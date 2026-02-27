import Stripe from "stripe";
import crypto from "crypto";
import pg from "pg";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const { Pool } = pg;
const pool = process.env.XATA_PG_URL
  ? new Pool({ connectionString: process.env.XATA_PG_URL, max: 2 })
  : null;

function sha256(s = "") {
  return crypto
    .createHash("sha256")
    .update(String(s).toLowerCase().trim())
    .digest("hex");
}

function getHeader(headers, name) {
  if (!headers) return "";
  const lower = name.toLowerCase();
  // Netlify normalizes headers to lowercase keys, but be defensive
  return headers[lower] || headers[name] || "";
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return { statusCode: 500, body: "Missing STRIPE_WEBHOOK_SECRET" };
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return { statusCode: 500, body: "Missing STRIPE_SECRET_KEY" };
    }
    if (!pool) {
      return { statusCode: 500, body: "Missing XATA_PG_URL" };
    }

    const sig = getHeader(event.headers, "stripe-signature");
    if (!sig) {
      // Stripe always sends this; if missing, something is wrong with the request path/proxy
      return { statusCode: 400, body: "Missing stripe-signature header" };
    }

    // Netlify functions deliver `event.body` as a raw string by default.
    // If base64-encoded, decode first.
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : (event.body || "");

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return { statusCode: 400, body: `Bad signature: ${String(err?.message || err)}` };
    }

    // Only handle what we need for entitlements
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      // Prefer customer_details.email (newer), fall back to customer_email
      const emailRaw =
        session?.customer_details?.email ||
        session?.customer_email ||
        "";

      const email = String(emailRaw).toLowerCase().trim();
      const stackKey = String(session?.metadata?.stack_key || "foundation")
        .toLowerCase()
        .trim();

      const sessionId = String(session?.id || "").trim();
      if (!email) return { statusCode: 200, body: "No email; ignoring" };
      if (!sessionId) return { statusCode: 200, body: "No session id; ignoring" };

      const emailHash = sha256(email);

      const q = `
        insert into entitlements (email_hash, stack_key, status, stripe_session_id)
        values ($1, $2, 'paid', $3)
        on conflict (stripe_session_id) do nothing
      `;
      await pool.query(q, [emailHash, stackKey, sessionId]);
    }

    // Always 200 to acknowledge receipt (Stripe retries on non-2xx)
    return { statusCode: 200, body: "ok" };
  } catch (err) {
    return { statusCode: 500, body: String(err?.message || err) };
  }
};