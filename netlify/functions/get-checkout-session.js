import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export const handler = async (event) => {
  try {
    const sessionId = event.queryStringParameters?.session_id;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "Missing session_id"
        }),
      };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === "paid";
    const email =
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email ||
      "";

    const stackKey = String(
      session.metadata?.stackKey ||
      session.metadata?.stack_key ||
      session.metadata?.planKey ||
      "growth"
    ).toLowerCase();

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify({
        ok: true,
        paid,
        email,
        stackKey,
        mode: session.mode
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify({
        ok: false,
        error: String(err?.message || err),
      }),
    };
  }
};