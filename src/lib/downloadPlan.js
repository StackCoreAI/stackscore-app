// src/lib/downloadPlan.js
export async function downloadPlan(plan) {
    const r = await fetch('/api/plan/pdf-docraptor-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      throw new Error(`PDF generation failed (${r.status}) ${text}`);
    }
    const { url } = await r.json();
    window.location.assign(url); // triggers the download
  }
  