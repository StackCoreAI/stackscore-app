import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

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

      const email =
        session?.customer_details?.email ||
        session?.customer_email ||
        session?.metadata?.email ||
        "";

      const stackKey = String(
        session?.metadata?.stackKey ||
        session?.metadata?.stack_key ||
        session?.metadata?.planKey ||
        "growth"
      ).toLowerCase().trim();

      const sessionId = String(session?.id || "").trim();

      console.log("Webhook purchase confirmed", {
        email,
        stackKey,
        sessionId,
      });

      // TODO: backup email delivery goes here later
      // Example links:
      const site =
        process.env.URL ||
        process.env.SITE_URL ||
        "https://stackscore.ai";

      const guideUrl = `${site}/guides/82.html?stackKey=${encodeURIComponent(stackKey)}`;
      const pdfUrl = `${site}/downloads/stackscore-credit-guide.pdf`;

      console.log("Delivery links", { guideUrl, pdfUrl });
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("Webhook unhandled error:", err);
    return { statusCode: 500, body: String(err?.message || err) };
  }
};