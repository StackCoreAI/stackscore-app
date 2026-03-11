// /api/xata/health.js
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { getXataClient } = await import('../../src/xata.js');
    const xata = getXataClient();
    // Light-touch call to confirm client initializes in prod:contentReference[oaicite:2]{index=2}
    await xata.db.entitlements?.getMetadata();
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('xata/health error:', e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || String(e) });
  }
}

