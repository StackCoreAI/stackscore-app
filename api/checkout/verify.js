// api/checkout/verify.js
// Signature pattern: guard → input/env checks → lazy imports → work → clean JSON + cookie
export const config = { runtime: "nodejs18.x" };

function methodNotAllowed(res) {
  res.setHeader("Allow", "GET");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

export default async function handler(req, res) {
  // 1) Method guard
  if (req.method !== "GET") return methodNotAllowed(res);

  // 2) Input/env sanity
  const session_id = String(req.query.session_id || "").trim();
  if (!session_id) return res.status(400).json({ ok: false, error: "missing_session_id" });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ ok: false, error: "server_not_configured" });

  try {
    // 3) Lazy‑import Stripe + Xata AFTER guards (prevents module‑load 500s)
    const Stripe = (await import("stripe")).default;
    const { getXataClient } = await import("../../src/xata.js");
    const stripe = new Stripe(key, { apiVersion: "2022-11-15" });
    const xata = getXataClient();

    // 4) Do the work: retrieve session → derive email → set cookie → upsert entitlement
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const email =
      session?.customer_details?.email ||
      session?.customer_email ||
      session?.metadata?.email ||
      null;

    if (!email) return res.status(200).json({ ok: false, reason: "no_email" });

    // Fast-path identity for your app via HttpOnly cookie (30 days)
    res.setHeader(
      "Set-Cookie",
      `ss_email=${encodeURIComponent(email)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
    );

    // Soft upsert (webhook remains source of truth)
    try {
      await xata.db.entitlements.createOrReplace(email, {
        email,
        sessionId: session.id,
        hasAccess: true,
        createdAt: new Date(),
      });
    } catch {
      const existing = await xata.db.entitlements.filter({ email }).getFirst();
      if (existing) {
        await xata.db.entitlements.update(existing.id, { sessionId: session.id, hasAccess: true });
      } else {
        await xata.db.entitlements.create({
          email,
          sessionId: session.id,
          hasAccess: true,
          createdAt: new Date(),
        });
      }
    }

    return res.status(200).json({ ok: true, email });
  } catch (e) {
    console.error("❌ verify error:", e?.message || e);
    return res.status(500).json({ ok: false, error: "verify_failed" });
  }
}
