// server/api/pdf-smoke.js (ESM)
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function launchBrowser() {
  const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_REGION;
  if (!isServerless) {
    const { default: puppeteer } = await import('puppeteer'); // local Chrome
    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();
    return puppeteer.launch({
      headless: true,
      executablePath: execPath,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    });
  }
  const execPath = await chromium.executablePath();
  return puppeteerCore.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: execPath,
    headless: chromium.headless
  });
}

export default async function pdfSmoke(req, res) {
  let browser;
  try {
    const html = `<!doctype html><html><head><meta charset="utf-8" />
      <style>body{font-family:-apple-system,system-ui,sans-serif;padding:48px}
      .card{border:1px solid #e5e7eb;border-radius:12px;padding:24px;box-shadow:0 4px 16px rgba(0,0,0,.06)}</style>
      </head><body><div class="card"><h1>Hello PDF ✅</h1><p>This is a smoke test.</p></div></body></html>`;

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMediaType('screen');
    await sleep(150);

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '24px', right: '24px', bottom: '24px', left: '24px' }
    });

    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-PDF-Ok', '1');
    return res.status(200).send(pdf);
  } catch (err) {
    try { if (browser) await browser.close(); } catch {}
    console.error('pdf-smoke error:', err);
    return res.status(500).json({ error: 'PdfSmokeFailed', message: String(err?.message || err) });
  }
}
