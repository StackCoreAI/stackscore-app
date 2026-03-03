// netlify/functions/create-checkout-session.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { stackKey = "growth" } = JSON.parse(event.body || "{}");

    // ✅ Single $29 price (support either env var name to match your Netlify settings)
    const price = process.env.STRIPE_PRICE_ID || process.env.STRIPE_PRICE_STACKSCORE;
    if (!price) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing STRIPE_PRICE_ID (or STRIPE_PRICE_STACKSCORE)" }),
      };
    }

    const site = process.env.SITE_URL || "http://localhost:8888";
    const key = String(stackKey).toLowerCase();

    // ✅ Frictionless: do NOT require email; Stripe collects it on Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price, quantity: 1 }],
      success_url: `${site}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/preview`,
      metadata: {
        stackKey: key,
        product: "stackscore-access",
      },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (e) {
    console.error("create-checkout-session error:", e);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: e?.message || "Server error" }),
    };
  }
};