import Stripe from "stripe";
import { getXataClient } from "../../src/xata.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });
const xata = getXataClient();

async function upsertEntitlement(email, fields) {
  try {
    return await xata.db.entitlements.createOrReplace(email, { email, ...fields });
  } catch {
    const ex = await xata.db.entitlements.filter({ email }).getFirst();
    return ex
      ? xata.db.entitlements.update(ex.id, fields)
      : xata.db.entitlements.create({ email, ...fields });
  }
}

// Read raw body for Stripe signature verification
async function readRawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const sig = req.headers["stripe-signature"];
    const raw = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email =
        session.customer_details?.email || session.customer_email || session?.metadata?.email || null;

      if (email) {
        await upsertEntitlement(email, {
          sessionId: session.id,
          hasAccess: true,
          createdAt: new Date()
        });
        console.log("✅ Entitlement granted for", email);
      } else {
        console.warn("⚠️ checkout.session.completed without email", session.id);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("webhook error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
