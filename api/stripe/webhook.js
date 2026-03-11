// api/stripe/webhook.js
import Stripe from "stripe";

// Read raw body for Stripe signature verification
async function readRawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // 1) Hard method guard — GET/HEAD never crash
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  // 2) Header & env sanity checks
  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).send("Missing Stripe signature");

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !endpointSecret) {
    return res.status(500).send("Server misconfigured");
  }

  try {
    const raw = await readRawBody(req);

    // 3) Init Stripe *after* guards
    const stripe = new Stripe(stripeKey);
    const event = stripe.webhooks.constructEvent(raw, sig, endpointSecret);

    console.log("✅ Stripe webhook:", event.type);

    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      const email =
        s?.customer_details?.email || s?.customer_email || s?.metadata?.email || null;

      if (email) {
        // 4) Lazy-load Xata only when needed
        const { getXataClient } = await import("../../src/xata.js");
        const xata = getXataClient();

        try {
          await xata.db.entitlements.createOrReplace(email, {
            email,
            sessionId: s.id,
            hasAccess: true,
            createdAt: new Date(),
          });
        } catch {
          const existing = await xata.db.entitlements.filter({ email }).getFirst();
          if (existing) {
            await xata.db.entitlements.update(existing.id, {
              sessionId: s.id,
              hasAccess: true,
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
