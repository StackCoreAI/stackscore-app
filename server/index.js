// server/index.js
import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'path';
import Stripe from 'stripe';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

// Load Xata client from src (with a safe fallback if it doesn't exist)
let getXataClientOrNull;
try {
  ({ getXataClientOrNull } = await import('../src/xata.js'));
} catch {
  console.warn('ℹ️ Xata client not found at ../src/xata.js — DB features disabled.');
  getXataClientOrNull = () => null;
}

// NEW: GPT plan JSON + HTML→PDF routes
import gptPlan from './api/gpt-plan.js';
import planPdf from './api/plan-pdf.js';

// NEW DIAGNOSTICS: smoke & debug-html
import pdfSmoke from './api/pdf-smoke.js';
import pdfDebugHtml from './api/pdf-debug-html.js';

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

// ⬇︎ Disable compression for PDF endpoints to avoid corrupting the binary payload
app.use(
  compression({
    filter: (req, res) => {
      if (req.path === '/api/plan/pdf' || req.path === '/api/plan/pdf-smoke') return false;
      return compression.filter(req, res);
    },
  })
);

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
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

app.use(express.static(distDir));     // built SPA (if present)
app.use(express.static(publicDir));   // /templates, /favicon.svg, etc.

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
const mask = (v = '') => (v ? `${v.slice(0, 6)}...${v.slice(-4)}` : '');
console.log(`✅ Stripe key loaded: ${mask(process.env.STRIPE_SECRET_KEY)}`);

const xata = getXataClientOrNull();

/**
 * Upsert entitlement by email. Safe if Xata isn't configured.
 */
async function upsertEntitlementByEmail(email, fields) {
  if (!xata) return null;
  try {
    // Try createOrReplace with email as ID (best if email is PK)
    return await xata.db.entitlements.createOrReplace(email, { email, ...fields });
  } catch {
    // Fallback: find by unique email, update or create
    const existing = await xata.db.entitlements.filter({ email }).getFirst();
    if (existing) return await xata.db.entitlements.update(existing.id, fields);
    return await xata.db.entitlements.create({ email, ...fields });
  }
}

async function getEntitlementByEmail(email) {
  if (!xata) return null;
  let rec = null;
  try {
    rec = await xata.db.entitlements.read(email);
  } catch { /* ignore */ }
  if (rec) return rec;
  return await xata.db.entitlements.filter({ email }).getFirst();
}

function getEmailFromRequest(req) {
  if (req.cookies?.ss_email) return req.cookies.ss_email;
  if (req.headers['x-ss-email']) return String(req.headers['x-ss-email']);
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
// NEW: Injected HTML view used by browser & PDF renderer
// ───────────────────────────────────────────────────────────────────────────────
app.get('/pdf/view', (req, res) => {
  const tplPath  = path.join(publicDir, 'templates', 'stacktemplate.html');
  const planPath = path.join(rootDir, 'plan.json');

  // 1) Load template
  let html = fs.readFileSync(tplPath, 'utf8');

  // 2) Load plan (fallback if missing)
  let plan;
  try {
    plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  } catch {
    plan = {
      selected_stack_key: 'elite',
      title: 'Elite Stack Guide',
      subtitle: 'Your personalized activation plan with proven apps and clear steps',
      value_props: ['100+ point potential', '30–60 day timeline', 'Premium coverage'],
      services: [],
      final_tip: {
        title: 'Pro Tip: lock in autopay + weekly checks',
        content:
          'Enable autopay on every app, then check Experian and Credit Karma weekly. If a tradeline isn’t visible after two cycles, recheck connections or use a fallback from your plan.',
      },
      footer: { year: '2025', tagline: 'Everything working in concert for maximum credit gains' },
    };
  }

  // 3) Inject plan JSON into <script id="stacks-data">…</script>
  const safe = JSON.stringify(plan).replace(/</g, '\\u003c'); // avoid </script> breakage
  html = html.replace(
    /<script id="stacks-data"[^>]*>[\s\S]*?<\/script>/,
    `<script id="stacks-data" type="application/json">\n${safe}\n</script>`
  );

  // 4) Respond
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
});

// ───────────────────────────────────────────────────────────────────────────────
// NEW: GPT Plan JSON + PDF + Diagnostics
// ───────────────────────────────────────────────────────────────────────────────
app.post('/api/gpt-plan', gptPlan);
app.post('/api/plan/pdf', planPdf);
app.post('/api/plan/pdf-smoke', pdfSmoke);          // Smoke test: returns Hello PDF
app.post('/api/plan/pdf-debug-html', pdfDebugHtml); // Returns injected HTML for inspection

// ───────────────────────────────────────────────────────────────────────────────
// /api/checkout  → creates Stripe Checkout Session
// ───────────────────────────────────────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  try {
    const { email } = req.body || {};
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      customer_email: email || undefined,
    });
    return res.json({ id: session.id, url: session.url });
  } catch (e) {
    console.error('❌ /api/checkout error:', e);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// /api/checkout/verify → verifies session & sets cookie
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

    if (!email) return res.status(200).json({ ok: false, reason: 'no_email' });

    // Optional: set fast-path cookie (HttpOnly, secure).
    res.cookie('ss_email', email, {
      httpOnly: true, secure: true, sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
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
// (Optional legacy) /api/plan/export – keep or remove after PDF route is live
// ───────────────────────────────────────────────────────────────────────────────
app.post('/api/plan/export', async (req, res) => {
  try {
    const email = getEmailFromRequest(req);
    if (!email) return res.status(401).json({ error: 'Unauthorized: missing email' });

    const entitlement = await getEntitlementByEmail(email);
    if (!entitlement || entitlement.hasAccess !== true) {
      return res.status(402).json({ error: 'Payment required' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="StackScore-Plan.pdf"');
    const fakePdf = Buffer.from('%PDF-1.4\n%… minimal demo …\n%%EOF');
    return res.status(200).end(fakePdf);
  } catch (e) {
    console.error('❌ /api/plan/export error:', e);
    return res.status(500).json({ error: 'export_failed' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// SPA fallback (must be LAST)
// ───────────────────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// ───────────────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`PDF template path => ${path.join(publicDir, 'templates', 'stacktemplate.html')}`);
});
