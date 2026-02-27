import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { email, stackKey } = JSON.parse(event.body || "{}");
    if (!email || !stackKey) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing email or stackKey" }),
      };
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing STRIPE_PRICE_ID" }),
      };
    }

    // Prefer explicit URLs from env in production; fallback to SITE_URL + routes for local/dev
    const siteUrl = process.env.SITE_URL || "http://localhost:8888";

    // Success should land on a real page/route that can read session_id and then redirect to the paid guide
    const successBase =
      process.env.STRIPE_SUCCESS_URL || `${siteUrl}/success.html`;

    // Cancel should NEVER go to the paid delivery guide. Send them back to pricing (or wherever you want).
    const cancelBase =
      process.env.STRIPE_CANCEL_URL || `${siteUrl}/pricing`;

    // Stripe will substitute {CHECKOUT_SESSION_ID}
    const successUrl = `${successBase}${successBase.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;

    // Preserve stackKey on cancel so you can restore context on pricing/preview
    const cancelUrl = `${cancelBase}${cancelBase.includes("?") ? "&" : "?"}stackKey=${encodeURIComponent(String(stackKey))}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: String(email).trim(),
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        stack_key: String(stackKey).toLowerCase(),
        email: String(email).trim(),
      },
    });

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
};