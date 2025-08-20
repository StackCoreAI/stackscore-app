// api/stripe/webhook.js
import Stripe from "stripe";

// Use the current Stripe API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Read the raw body so Stripe signature verification works
async function readRawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // 🚧 Explicit method guard so random GET/HEAD never crash this function
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  try {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      console.warn("⚠️ Missing Stripe signature header");
      return res.status(400).send("Missing Stripe signature");
    }

    const raw = await readRawBody(req);

    // Verify payload authenticity
    const event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Stripe webhook:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email =
        session?.customer_details?.email ||
        session?.customer_email ||
        session?.metadata?.email ||
        null;

      if (!email) {
        console.warn("⚠️ checkout.session.completed had no email");
      } else {
        // Lazy-load Xata only when needed so method guard above can’t crash
        const { getXataClient } = await import("../../src/xata.js");
        const xata = getXataClient();

        // Upsert entitlement row keyed by email
        try {
          await xata.db.entitlements.createOrReplace(email, {
            email,
            sessionId: session.id,
            hasAccess: true,
            createdAt: new Date()
          });
        } catch {
          const existing = await xata.db.entitlements.filter({ email }).getFirst();
          if (existing) {
            await xata.db.entitlements.update(existing.id, {
              sessionId: session.id,
              hasAccess: true
            });
          } else {
            await xata.db.entitlements.create({
              email,
              sessionId: session.id,
              hasAccess: true,
              createdAt: new Date()
            });
          }
        }
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
