import express from "express";
import Stripe from "stripe";
export const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.APP_BASE_URL}/preview?paid=1`,
      cancel_url: `${process.env.APP_BASE_URL}/pricing?canceled=1`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});
