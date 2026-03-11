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

    const sig = getHeader(event.headers, "stripe-signature");
    if (!sig) {
      return { statusCode: 400, body: "Missing stripe-signature header" };
    }

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
      return {
        statusCode: 400,
        body: `Bad signature: ${String(err?.message || err)}`,
      };
    }

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const emailRaw =
        session?.customer_details?.email ||
        session?.customer_email ||
        session?.metadata?.email ||
        "";

      const email = String(emailRaw).toLowerCase().trim();

      const stackKey = String(
        session?.metadata?.stackKey ||
        session?.metadata?.stack_key ||
        session?.metadata?.planKey ||
        "growth"
      )
        .toLowerCase()
        .trim();

      const sessionId = String(session?.id || "").trim();

      if (!email) {
        console.log("Webhook: no email found, skipping fulfillment.");
        return { statusCode: 200, body: "No email; ignoring" };
      }

      if (!sessionId) {
        console.log("Webhook: no session id found, skipping fulfillment.");
        return { statusCode: 200, body: "No session id; ignoring" };
      }

      const emailHash = sha256(email);

      // 1) Store entitlement if DB is available
      if (pool) {
        try {
          const q = `
            insert into entitlements (email_hash, stack_key, status, stripe_session_id)
            values ($1, $2, 'paid', $3)
            on conflict (stripe_session_id) do nothing
          `;
          await pool.query(q, [emailHash, stackKey, sessionId]);
          console.log("Webhook: entitlement stored", { emailHash, stackKey, sessionId });
        } catch (dbErr) {
          console.error("Webhook: entitlement insert failed", dbErr);
          // Do not fail webhook delivery if DB insert fails
        }
      } else {
        console.warn("Webhook: XATA_PG_URL missing, entitlement not stored.");
      }

      // 2) Build delivery links for backup email
      const site =
        process.env.URL ||
        process.env.SITE_URL ||
        "https://stackscore.ai";

      const guideUrl = `${site}/guides/82.html?stackKey=${encodeURIComponent(stackKey)}`;
      const pdfUrl = `${site}/downloads/stackscore-credit-guide.pdf`;

      console.log("Webhook: delivery payload", {
        email,
        stackKey,
        guideUrl,
        pdfUrl,
      });

      // 3) TODO: send backup email here
      // Example provider options:
      // - Resend
      // - Postmark
      // - SendGrid
      //
      // Suggested email:
      // Subject: Your StackScore Credit Route Is Ready
      // Body:
      //   Access your guide:
      //   ${guideUrl}
      //
      //   Download your printable guide:
      //   ${pdfUrl}
      //
      //   We recommend bookmarking or downloading your guide for future access.
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("Webhook: unhandled error", err);
    return { statusCode: 500, body: String(err?.message || err) };
  }
};