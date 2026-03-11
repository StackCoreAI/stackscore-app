import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
Handlebars.registerHelper('sf', (target) => target === 'head' ? 'sf-head' : '');
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run a child process and capture stdout (PDF bytes) + stderr (errors)
function runWeasy(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });

    const chunks = [];
    let stderr = '';

    p.stdout.on('data', (d) => chunks.push(d));
    p.stderr.on('data', (d) => { stderr += d.toString(); });

    p.on('close', (code) => {
      if (code === 0) return resolve(Buffer.concat(chunks));
      console.error('[WeasyPrint stderr]\n' + stderr);
      reject(new Error(stderr || `WeasyPrint exited with code ${code}`));
    });
  });
}

/**
 * Render a StackScore plan to a premium PDF using WeasyPrint.
 * Expects:
 *  - server/templates/stacktemplate.hbs
 *  - public/templates/print.premium.css  (this is now the stylesheet we include)
 *  - public/templates/fonts/Inter-Variable.woff2
 */
export async function renderPlanWithWeasy(plan) {
  // 1) Compile server-side HTML (no client JS)
  const tplPath = path.resolve(__dirname, '../templates/stacktemplate.hbs');
  const tplSrc = await fs.readFile(tplPath, 'utf8');
  const tpl = Handlebars.compile(tplSrc);
  const html = tpl({ ...plan });

  // 2) Save HTML for debugging
  const projRoot = path.resolve(__dirname, '../..');
  const tmpDir = path.join(projRoot, '.tmp');
  await fs.mkdir(tmpDir, { recursive: true });
  const htmlPath = path.join(tmpDir, 'plan-print.html');
  await fs.writeFile(htmlPath, html, 'utf8');

  // 3) Build CLI args
  const publicDir = path.join(projRoot, 'public');
  // explicitly point to premium stylesheet
  const printCss  = path.join(publicDir, 'templates', 'print.premium.css');

  const weasyBin = process.env.WEASYPRINT_BIN || 'weasyprint';

  const args = [
    htmlPath,                // input HTML
    '-',                     // output to stdout
    '-s', printCss,          // stylesheet
    '--base-url', publicDir  // so "templates/..." and "fonts/..." resolve
  ];

  // 4) Execute and return PDF bytes
  const pdfBuffer = await runWeasy(weasyBin, args);

  // (Optional) Persist last good PDF for inspection
  try {
    await fs.writeFile(path.join(tmpDir, 'last-weasy.pdf'), pdfBuffer);
  } catch { /* ignore */ }

  return pdfBuffer;
}
