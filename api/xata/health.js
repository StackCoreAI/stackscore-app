export default async function handler(req, res) {
  try {
    const { getXataClient } = await import("../../src/xata.js");
    const xata = getXataClient();
    await xata.db.entitlements?.getMetadata();
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
