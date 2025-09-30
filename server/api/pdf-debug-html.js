// server/api/pdf-debug-html.js (ESM)
import fs from 'fs';
import path from 'path';

export default async function pdfDebugHtml(req, res) {
  try {
    const plan = req.body || {};
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'stacktemplate.html');
    if (!fs.existsSync(templatePath)) {
      return res.status(500).send(`Template not found at ${templatePath}`);
    }
    let html = fs.readFileSync(templatePath, 'utf8');

    const tag = `<script id="stacks-data" type="application/json">${JSON.stringify(plan)}</script>`;
    const re  = /<script id="stacks-data"[^>]*>[\s\S]*?<\/script>/;
    html = re.test(html) ? html.replace(re, tag) : html.replace('</body>', `${tag}</body>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Optional: write snapshot so you can open it in a browser tab directly from disk
    try {
      const out = path.join(process.cwd(), '.tmp');
      if (!fs.existsSync(out)) fs.mkdirSync(out);
      fs.writeFileSync(path.join(out, 'last-render.html'), html);
      res.setHeader('X-Debug-HTML-Saved', 'true');
    } catch {}
    return res.status(200).send(html);
  } catch (err) {
    console.error('pdf-debug-html error:', err);
    return res.status(500).send(String(err?.message || err));
  }
}
