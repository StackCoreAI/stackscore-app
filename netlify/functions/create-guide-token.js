import Stripe from "stripe";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function safeParse(value, fallback = {}) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value || fallback;
  } catch {
    return fallback;
  }
}

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

function sha256(value = "") {
  return crypto
    .createHash("sha256")
    .update(String(value).toLowerCase().trim())
    .digest("hex");
}

export const handler = async (event) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return json(500, { ok: false, error: "Missing STRIPE_SECRET_KEY" });
    }

    if (!process.env.GUIDE_TOKEN_SECRET) {
      return json(500, { ok: false, error: "Missing GUIDE_TOKEN_SECRET" });
    }

    const method = String(event.httpMethod || "GET").toUpperCase();
    if (method !== "GET" && method !== "POST") {
      return json(405, { ok: false, error: "Method Not Allowed" });
    }

    const body = method === "POST" ? safeParse(event.body || "{}", {}) : {};
    const query = event.queryStringParameters || {};

    const sessionId = String(
      body.session_id ||
        body.sessionId ||
        query.session_id ||
        query.sessionId ||
        ""
    ).trim();

    if (!sessionId) {
      return json(400, { ok: false, error: "Missing session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === "paid";
    if (!paid) {
      return json(403, { ok: false, error: "Session not paid" });
    }

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email ||
      "";

    if (!email) {
      return json(400, { ok: false, error: "Missing customer email" });
    }

    const stackKey = String(
      body.stackKey ||
        body.planKey ||
        query.stackKey ||
        query.planKey ||
        session.metadata?.stackKey ||
        session.metadata?.stack_key ||
        session.metadata?.planKey ||
        "growth"
    )
      .toLowerCase()
      .trim();

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

    return json(200, {
      ok: true,
      token,
      stackKey,
      expires_at: exp,
      session_id: session.id,
    });
  } catch (err) {
    console.error("create-guide-token error:", err);
    return json(500, {
      ok: false,
      error: String(err?.message || err),
    });
  }
};