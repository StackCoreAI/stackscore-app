// api/checkout/verify.js
export const config = { runtime: "nodejs" };

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { session_id } = req.query || {};
  if (!session_id) return res.status(400).json({ ok: false, error: "missing session_id" });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent", "customer"],
    });

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete" ||
      session.payment_intent?.status === "succeeded";

    if (!paid) {
      return res.status(200).json({
        ok: false,
        status: session.payment_status || session.status,
        error: "verify_failed",
      });
    }

    return res.status(200).json({
      ok: true,
      customer_email: session.customer_details?.email || session.customer_email || null,
    });
  } catch (e) {
    console.error("verify error:", e);
    // Return the detail to the client for quick debugging
    return res.status(500).json({ ok: false, error: "verify_failed", detail: e?.message || String(e) });
  }
}
