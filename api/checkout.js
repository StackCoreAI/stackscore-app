// api/checkout.js
export const config = { runtime: "nodejs" };

import Stripe from "stripe";

// Prefer env-provided URLs, but fall back to deriving from request host.
function buildUrls(req) {
  const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
  const successBase = process.env.STRIPE_SUCCESS_URL || `${origin}/thankyou`;
  const cancelUrl   = process.env.STRIPE_CANCEL_URL  || `${origin}/preview`;

  // Ensure {CHECKOUT_SESSION_ID} is appended
  const hasQuery = successBase.includes("?");
  const successUrl = `${successBase}${hasQuery ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
  return { successUrl, cancelUrl };
}

function safeJson(body) {
  try { return typeof body === "string" ? JSON.parse(body || "{}") : (body || {}); }
  catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key   = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  if (!key || !price) {
    console.error("❌ Missing STRIPE_SECRET_KEY or STRIPE_PRICE_ID");
    return res.status(500).json({ error: "Server not configured" });
  }

  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

  try {
    const { email, planKey } = safeJson(req.body);
    const { successUrl, cancelUrl } = buildUrls(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price, quantity: 1 }],
      success_url: successUrl,          // /thankyou?session_id={CHECKOUT_SESSION_ID}
      cancel_url:  cancelUrl,           // /preview
      customer_email: email || undefined,
      metadata: { planKey: planKey || "growth" }
    });

    // Thursday fixes expect { url } so the frontend can redirect cleanly:contentReference[oaicite:1]{index=1}.
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("❌ checkout error:", e);
    return res.status(500).json({ error: e?.message || "checkout_failed" });
  }
}

