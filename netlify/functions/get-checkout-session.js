import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export const handler = async (event) => {
  try {
    const sessionId = event.queryStringParameters?.session_id;
    if (!sessionId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing session_id" }) };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email ||
      "";

    const stackKey = String(
  session.metadata?.stack_key ||
  session.metadata?.stackKey ||
  session.metadata?.planKey ||
  "foundation"
).toLowerCase();

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        stackKey,
        paid: session.payment_status === "paid",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
};