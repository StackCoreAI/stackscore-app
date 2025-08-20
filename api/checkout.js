// api/checkout.js
// Signature pattern: method guard → env checks → lazy import → work → clear JSON errors
export const config = { runtime: "nodejs18.x" }; // Avoid Edge; keep Node SDKs happy

function safeJson(body) {
  try { return typeof body === "string" ? JSON.parse(body || "{}") : (body || {}); }
  catch { return {}; } // Never let parsing crash the function
}

export default async function handler(req, res) {
  // 1) Hard method guard: wrong verb? Return 405 and stop immediately
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2) Sanity check required envs so we fail fast with a readable error
  const key = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  const success = process.env.STRIPE_SUCCESS_URL;
  const cancel = process.env.STRIPE_CANCEL_URL;
  if (!key || !price || !success || !cancel) {
    console.error("❌ Missing Stripe envs in checkout");
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    // 3) Lazy‑import Stripe AFTER guards; prevents module‑load crashes on GET/cold starts
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key, { apiVersion: "2022-11-15" });

    // 4) Do the actual work
    const { email } = safeJson(req.body);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price, quantity: 1 }],
      success_url: `${success}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel,
      customer_email: email || undefined,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (e) {
    // 5) One concise log line for fast diagnosis from Vercel logs
    console.error("❌ checkout error:", e?.message || e);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
