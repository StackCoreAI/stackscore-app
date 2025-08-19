import Stripe from "stripe";
import { getXataClient } from "../../src/xata.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });
const xata = getXataClient();

async function upsertEntitlement(email, fields) {
  try {
    return await xata.db.entitlements.createOrReplace(email, { email, ...fields });
  } catch {
    const ex = await xata.db.entitlements.filter({ email }).getFirst();
    return ex
      ? xata.db.entitlements.update(ex.id, fields)
      : xata.db.entitlements.create({ email, ...fields });
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  const session_id = String(req.query.session_id || "");

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const email =
      session.customer_details?.email || session.customer_email || session?.metadata?.email || null;

    if (!email) return res.status(200).json({ ok: false, reason: "no_email" });

    // HttpOnly cookie for fast-path
    res.setHeader(
      "Set-Cookie",
      `ss_email=${encodeURIComponent(email)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
    );

    // Soft upsert (webhook remains source of truth)
    await upsertEntitlement(email, { sessionId: session.id, hasAccess: true, createdAt: new Date() });

    res.status(200).json({ ok: true, email });
  } catch (e) {
    console.error("verify error:", e);
    res.status(500).json({ ok: false, error: "verify_failed" });
  }
}
