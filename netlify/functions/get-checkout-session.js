import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return json(500, {
        ok: false,
        error: "Missing STRIPE_SECRET_KEY",
      });
    }

    const method = String(event.httpMethod || "GET").toUpperCase();

    if (method !== "GET") {
      return json(405, {
        ok: false,
        error: "Method Not Allowed",
      });
    }

    const sessionId = String(
      event.queryStringParameters?.session_id ||
      event.queryStringParameters?.sessionId ||
      ""
    ).trim();

    if (!sessionId) {
      return json(400, {
        ok: false,
        error: "Missing session_id",
      });
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
    )
      .toLowerCase()
      .trim();

    return json(200, {
      ok: true,
      paid,
      email,
      stackKey,
      mode: session.mode || "",
      payment_status: session.payment_status || "",
      session_id: session.id || sessionId,
    });
  } catch (err) {
    console.error("get-checkout-session error:", err);

    return json(500, {
      ok: false,
      error: String(err?.message || err),
    });
  }
};