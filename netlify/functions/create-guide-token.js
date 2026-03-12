import Stripe from "stripe";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(data, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256(s = "") {
  return crypto
    .createHash("sha256")
    .update(String(s).toLowerCase().trim())
    .digest("hex");
}

export const handler = async (event) => {
  try {
    const sessionId =
      event.queryStringParameters?.session_id ||
      JSON.parse(event.body || "{}")?.session_id;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing session_id" }),
      };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }),
      };
    }

    if (!process.env.GUIDE_TOKEN_SECRET) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing GUIDE_TOKEN_SECRET" }),
      };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === "paid";
    if (!paid) {
      return {
        statusCode: 403,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Session not paid" }),
      };
    }

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email ||
      "";

    if (!email) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing customer email" }),
      };
    }

    const stackKey = String(
      session.metadata?.stackKey ||
      session.metadata?.stack_key ||
      session.metadata?.planKey ||
      "growth"
    ).toLowerCase();

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60 * 24; // 24 hours

    const payload = {
      sub: sha256(email),
      stackKey,
      sid: session.id,
      iat: now,
      exp,
    };

    const encoded = b64url(JSON.stringify(payload));
    const sig = sign(encoded, process.env.GUIDE_TOKEN_SECRET);
    const token = `${encoded}.${sig}`;

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
      body: JSON.stringify({ token, stackKey }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
};