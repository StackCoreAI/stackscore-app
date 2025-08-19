// server/index.js
import 'dotenv/config';
import express from 'express';
import path from 'path';
import Stripe from 'stripe';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { getXataClient } from './xata.js'; // adjust path if needed

// ───────────────────────────────────────────────────────────────────────────────
// Basic setup & guards
// ───────────────────────────────────────────────────────────────────────────────
const requiredEnv = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  'STRIPE_SUCCESS_URL',
  'STRIPE_CANCEL_URL',
];
for (const k of requiredEnv) {
  if (!process.env[k]) throw new Error(`Missing required env: ${k}`);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const app = express();

// Security & perf
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 180, // 180 req/min per IP
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(cookieParser());
// IMPORTANT: Do NOT use express.json() globally BEFORE the webhook raw body.
// We attach json parser AFTER the webhook route below.

// Static (SPA) serve
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distDir));

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
const mask = (v = '') => (v ? `${v.slice(0, 6)}...${v.slice(-4)}` : '');
console.log(`✅ Stripe key loaded: ${mask(process.env.STRIPE_SECRET_KEY)}`);

const xata = getXataClient();

/**
 * Upsert entitlement by email. Works whether "email" is the primary key
 * or just a unique column.
 */
async function upsertEntitlementByEmail(email, fields) {
  // Try createOrReplace with email as ID (best if email is PK)
  try {
    return await xata.db.entitlements.createOrReplace(email, {
      email,
      ...fields,
    });
  } catch {
    // Fallback: find by email unique column, then update or create
    const existing = await xata.db.entitlements.filter({ email }).getFirst();
    if (existing) {
      return await xata.db.entitlements.update(existing.id, fields);
    }
    return await xata.db.entitlements.create({ email, ...fields });
  }
}

async function getEntitlementByEmail(email) {
  // Try read by primary key first
  let rec = null;
  try {
    rec = await xata.db.entitlements.read(email);
  } catch {
    // ignore
  }
  if (rec) return rec;
  // Fallback: query by email
  return await xata.db.entitlements.filter({ email }).getFirst();
}

function getEmailFromRequest(req) {
  // Prefer secure HttpOnly cookie set by /api/checkout/verify
  if (req.cookies?.ss_email) return req.cookies.ss_email;

  // Allow explicit header (useful in dev or native clients)
  if (req.headers['x-ss-email']) return String(req.headers['x-ss-email']);

  // As a last resort, allow body.email
  if (req.body?.email) return String(req.body.email);

  return null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Stripe Webhook (must be BEFORE express.json())
// ───────────────────────────────────────────────────────────────────────────────
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email =
        session.customer_details?.email ||
        session.customer_email ||
        session?.metadata?.email ||
        null;

      if (!email) {
        console.warn('⚠️ checkout.session.completed missing email; session id:', session.id);
      } else {
        await upsertEntitlementByEmail(email, {
          sessionId: session.id,
          hasAccess: true,
          createdAt: new Date(),
        });
        console.log(`✅ Entitlement granted for ${email}`);
      }
    }

    // Handle refunds/cancellations if you want to revoke access later:
    // if (event.type === 'charge.refunded' || event.type === 'payment_intent.canceled') { ... }

    return res.json({ received: true });
  } catch (e) {
    console.error('❌ Webhook handler error:', e);
    return res.status(500).json({ error: 'Webhook handler failure' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// JSON parser for the rest of the API
// ───────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ───────────────────────────────────────────────────────────────────────────────
// /api/checkout  → creates Stripe Checkout Session
// ───────────────────────────────────────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  try {
    const { email } = req.body || {};
    // If you collect email on your own form:
    //  - pass it here and set customer_email.
    // If not, set: allow_promotion_codes, consent_collection, etc.

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      customer_email: email || undefined, // ensures email is present in session when possible
      // If you prefer forcing collection inside Stripe:
      // customer_creation: 'always',
      // consent_collection: { promotions: 'auto' },
    });

    return res.json({ id: session.id, url: session.url });
  } catch (e) {
    console.error('❌ /api/checkout error:', e);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// /api/checkout/verify?session_id=... → verifies session & sets cookie
// ───────────────────────────────────────────────────────────────────────────────
app.get('/api/checkout/verify', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ ok: false, error: 'Missing session_id' });

  try {
    const session = await stripe.checkout.sessions.retrieve(String(session_id));
    const email =
      session.customer_details?.email ||
      session.customer_email ||
      session?.metadata?.email ||
      null;

    if (!email) {
      return res.status(200).json({ ok: false, reason: 'no_email' });
    }

    // Optional: set fast-path cookie (HttpOnly, secure).
    res.cookie('ss_email', email, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    // Soft upsert entitlement as a safety net (webhook is source of truth)
    await upsertEntitlementByEmail(email, {
      sessionId: session.id,
      hasAccess: true,
      createdAt: new Date(),
    });

    return res.status(200).json({ ok: true, email });
  } catch (e) {
    console.error('❌ /api/checkout/verify error:', e);
    return res.status(500).json({ ok: false, error: 'verify_failed' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// /api/plan/export → Guarded by entitlement (Xata source of truth)
// Expects body: { planKey, answers, plans, apps, email? }
// Email is read from cookie/header/body (cookie preferred).
// ───────────────────────────────────────────────────────────────────────────────
app.post('/api/plan/export', async (req, res) => {
  try {
    const email = getEmailFromRequest(req);
    if (!email) {
      return res.status(401).json({ error: 'Unauthorized: missing email' });
    }

    const entitlement = await getEntitlementByEmail(email);
    if (!entitlement || entitlement.hasAccess !== true) {
      return res.status(402).json({ error: 'Payment required' });
    }

    // TODO: Replace with your real PDF generation/stream
    // Example: stream a PDF buffer
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="StackScore-Plan.pdf"');

    // Minimal demo buffer (replace with real generator):
    const fakePdf = Buffer.from('%PDF-1.4\n%… minimal demo …\n%%EOF');
    return res.status(200).end(fakePdf);
  } catch (e) {
    console.error('❌ /api/plan/export error:', e);
    return res.status(500).json({ error: 'export_failed' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// SPA fallback
// ───────────────────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// ───────────────────────────────────────────────────────────────────────────────
// Boot
// ───────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
