// server/api/plan-pdf.js
import path from 'path';
import fs from 'fs';
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safe = (s = '') =>
  String(s).replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

export default async function planPdf(req, res) {
  let browser;
  try {
    // Inputs
    const plan = req.body?.plan ?? req.body ?? {};
    const stackKey = plan.selected_stack_key || 'plan';
    const withCover = Boolean(req.body?.cover);
    const debugSave = (process.env.PDF_DEBUG_SAVE === '1') || Boolean(req.body?.debug_save);
    const settleMs  = Number(process.env.PDF_SETTLE_MS || 400);

    // Load template + inject JSON
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'stacktemplate.html');
    if (!fs.existsSync(templatePath)) throw new Error(`Template not found at ${templatePath}`);
    let html = fs.readFileSync(templatePath, 'utf8');                       // template load

    const dataTag = `<script id="stacks-data" type="application/json">${JSON.stringify(plan)}</script>`;
    const reData  = /<script id="stacks-data"[^>]*>[\s\S]*?<\/script>/;
    html = reData.test(html) ? html.replace(reData, dataTag) : html.replace('</body>', `${dataTag}</body>`);

    // Optional: cover page
    if (withCover) {
      const coverBlock = `
        <section class="ss-cover" style="
          page-break-after: always; display:flex; align-items:center; justify-content:center;
          height: 100vh; text-align:center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif;
          background: #0b0f14; color: white;">
          <div>
            <div style="font-size:48px; font-weight:800; letter-spacing:.3px; margin-bottom:8px;">StackScore Plan</div>
            <div style="opacity:.85; font-size:18px; margin-bottom:28px;">Everything working in concert for maximum credit gains</div>
            <div style="font-size:14px; opacity:.7">Generated ${(new Date()).toLocaleDateString()}</div>
          </div>
        </section>`;
      html = html.replace('<body', '<body data-ss-cover="1"').replace('<main', `${coverBlock}<main`);
    }

    if (debugSave) {
      const outDir = path.join(process.cwd(), '.tmp');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
      fs.writeFileSync(path.join(outDir, 'last-render.html'), html);
    }

    // Choose engine
    const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_REGION;
    if (!isServerless) {
      const { default: puppeteer } = await import('puppeteer');
      const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();
      browser = await puppeteer.launch({
        headless: true,
        executablePath: execPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=medium'],
      });
    } else {
      const execPath = await chromium.executablePath();
      browser = await puppeteerCore.launch({
        args: [...chromium.args, '--font-render-hinting=medium'],
        defaultViewport: chromium.defaultViewport,
        executablePath: execPath,
        headless: chromium.headless,
      });
    }

    // Render page
    const page = await browser.newPage();
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    await page.setViewport({ width: 1280, height: 0, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: ['load', 'domcontentloaded', 'networkidle0'] });
    await page.emulateMediaType('screen');
    try { await page.evaluateHandle('document.fonts && document.fonts.ready'); } catch {}
    await sleep(settleMs);

    // Header/Footer with bulletproof system sans (fixes serif fallback)
    const margin = { top: '28px', right: '18px', bottom: '40px', left: '18px' };

    const headerTemplate = `
      <style>
        .h{
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
                       Arial, "Noto Sans", "Liberation Sans", sans-serif;
          font-size:10px; color:#6b7280; width:100%; padding:0 16px;
          -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
        }
        .r{ float:right }
      </style>
      <div class="h">
        <span>StackScore • Plan</span>
        <span class="r"></span>
      </div>`;

    const footerTemplate = `
      <style>
        .f{
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
                       Arial, "Noto Sans", "Liberation Sans", sans-serif;
          font-size:10px; color:#6b7280; width:100%; padding:0 16px;
          -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
        }
        .r{ float:right }
        .l{ color:#9AFF32; font-weight:600 }
      </style>
      <div class="f">
        <span class="l">StackScore</span> — Everything working in concert for maximum credit gains
        <span class="r">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`;

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin,
    });

    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    if (debugSave) {
      const outDir = path.join(process.cwd(), '.tmp');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
      fs.writeFileSync(path.join(outDir, 'last-render.pdf'), pdfBuffer);
    }

    const fileLabel = plan.title ? `${safe(stackKey)}-${safe(plan.title)}` : `StackScore-${safe(stackKey)}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-PDF-Ok', '1');
    res.setHeader('X-PDF-Logs', consoleLogs.slice(0, 3).join(' | ').slice(0, 200));
    res.setHeader('Content-Disposition', `attachment; filename="${fileLabel}.pdf"`);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    const msg = String(err?.message || err);
    console.error('plan-pdf error:', msg);
    res.status(500).json({ error: 'PdfRenderFailed', message: msg.slice(0, 500) });
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
  }
}
