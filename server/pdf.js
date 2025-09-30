// server/pdf.js
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Minimal HTML that pulls your /assets CSS + watermark
function sampleHtml(plan = {}) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>StackScore Plan</title>
  <link rel="stylesheet" href="css/print.css" />
</head>
<body>
  <header>StackScore • Plan</header>
  <footer>Page <span class="pageNumber"></span> of <span class="totalPages"></span></footer>
  <main>
    <h1>${plan.title || 'Weekend Credit Boost'}</h1>
    <p>${plan.subtitle || 'Personalized, step‑by‑step actions'}</p>

    <section class="service">
      <h3>${plan.item?.name || 'Experian Boost'}</h3>
      <ol class="steps">
        <li>Connect your bank</li>
        <li>Verify utilities</li>
        <li>Confirm boost</li>
      </ol>
    </section>
  </main>
</body>
</html>`;
}

// Calls DocRaptor with baseurl pointing at your CDN
async function docraptorPdf({ html }) {
  const resp = await fetch('https://docraptor.com/docs', {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' + Buffer.from(process.env.DOCRAPTOR_API_KEY + ':').toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      test: String(process.env.DOCRAPTOR_TEST === 'true'),
      type: 'pdf',                      // new param name DocRaptor accepts
      name: 'stackscore-plan.pdf',
      document_content: html,           // send HTML directly
      'prince_options[baseurl]': process.env.ASSET_BASEURL, // 👈 https://cdn.stackscore.ai/assets/
    }),
  });
  if (!resp.ok) throw new Error(`DocRaptor failed: ${resp.status} ${await resp.text()}`);
  return Buffer.from(await resp.arrayBuffer());
}

// POST /api/pdf → returns the PDF bytes (browser downloads)
router.post('/pdf', async (req, res) => {
  try {
    const html = sampleHtml(req.body?.plan);
    const pdf = await docraptorPdf({ html });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="stackscore-plan.pdf"');
    res.send(pdf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

export default router;
