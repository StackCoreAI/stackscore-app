// server/routes/checkout.js
import { Router } from "express";
import Stripe from "stripe";

const r = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

function normEmail(v) {
  return String(v || "").trim().toLowerCase();
}
function normStackKey(v) {
  return String(v || "foundation").trim();
}
// Include the placeholder so Stripe appends ?session_id=cs_... on redirect
function successUrl(stackKey) {
  return `${process.env.STRIPE_SUCCESS_URL}?stackKey=${encodeURIComponent(
    stackKey
  )}&session_id={CHECKOUT_SESSION_ID}`;
}
function cancelUrl(stackKey) {
  return `${process.env.STRIPE_CANCEL_URL}?stackKey=${encodeURIComponent(stackKey)}`;
}
function bad(res, code, msg) {
  return res.status(code).json({ error: msg });
}

/**
 * POST /api/checkout/session
 * body: { email, stackKey }  -> returns { url }
 */
r.post("/session", async (req, res) => {
  try {
    const email = normEmail(req.body?.email);
    const stackKey = normStackKey(req.body?.stackKey);
    if (!email) return bad(res, 422, "email required");
    if (!process.env.STRIPE_PRICE_ID) return bad(res, 500, "price not configured");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      metadata: { email, stackKey },
      success_url: successUrl(stackKey),
      cancel_url: cancelUrl(stackKey),
      allow_promotion_codes: true,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/checkout/session error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

/**
 * GET /api/checkout/buy?email=you@example.com&stackKey=foundation
 * -> 302 redirect to Stripe Checkout (handy for tests or shareable links)
 */
r.get("/buy", async (req, res) => {
  try {
    const email = normEmail(req.query?.email);
    const stackKey = normStackKey(req.query?.stackKey);
    if (!email) return res.status(422).send("email required");
    if (!process.env.STRIPE_PRICE_ID) return res.status(500).send("price not configured");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      metadata: { email, stackKey },
      success_url: successUrl(stackKey),
      cancel_url: cancelUrl(stackKey),
      allow_promotion_codes: true,
    });

    return res.redirect(302, session.url);
  } catch (err) {
    console.error("GET /api/checkout/buy error:", err);
    return res.status(500).send("internal_error");
  }
});

/**
 * (Optional) Verify a session from your Thank You page
 * GET /api/checkout/verify?session_id=cs_test_...
 */
r.get("/verify", async (req, res) => {
  try {
    const id = String(req.query.session_id || "").trim();
    if (!id) return bad(res, 422, "session_id required");

    const session = await stripe.checkout.sessions.retrieve(id, { expand: ["payment_intent"] });
    return res.json({
      id: session.id,
      status: session.payment_status, // 'paid' on success
      email:
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.email ||
        null,
      stackKey: session.metadata?.stackKey || null,
      amount_total: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error("GET /api/checkout/verify error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

export { r as router };
