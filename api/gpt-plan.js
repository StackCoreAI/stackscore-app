// /api/gpt-plan.js
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  // Thursday Fixes: GET should be 405, POST handled by the real planner:contentReference[oaicite:1]{index=1}
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mod = await import('./plan/gpt-plan.js');
    // Delegate to the real planner handler (keeps your existing logic untouched)
    return mod.default(req, res);
  } catch (e) {
    console.error('gpt-plan route error:', e);
    return res
      .status(500)
      .json({ error: e?.message || 'Failed to generate plan' });
  }
}
