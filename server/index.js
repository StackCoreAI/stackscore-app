// server/index.js
import "dotenv/config";
import express from "express";
import magicLinks from "./magicLinks.js";
import path from "path";
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
import mustacheExpress from "mustache-express";

// API routers
import { router as planRouter } from "./routes/plan.js";
import { router as checkoutRouter } from "./routes/checkout.js";
import healthRouter from "./routes/health.js";
import gptPlanRouter from "./routes/gptPlan.js";

// ───────────────────────────────────────────────────────────────────────────────
// Env guards (Stripe only)
// ───────────────────────────────────────────────────────────────────────────────
const requiredEnv = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID",
  "STRIPE_SUCCESS_URL",
  "STRIPE_CANCEL_URL",
];
for (const k of requiredEnv) {
  if (!process.env[k]) throw new Error(`Missing required env: ${k}`);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// ───────────────────────────────────────────────────────────────────────────────
// App setup
// ───────────────────────────────────────────────────────────────────────────────
const app = express();

// Security/perf
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "font-src": ["'self'", "data:"],
        "img-src": ["'self'", "data:"],
        "connect-src": ["'self'"], // API calls are same-origin (3001)
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"],
      },
    },
  })
);
app.use(compression());
app.use(rateLimit({ windowMs: 60 * 1000, max: 180, standardHeaders: true, legacyHeaders: false }));
app.use(cookieParser());

// ───────────────────────────────────────────────────────────────────────────────
// Static assets from /public (so 3001 serves guide.css/js/images too)
// ───────────────────────────────────────────────────────────────────────────────
const PUBLIC_DIR = path.join(process.cwd(), "public");

// Everything in /public (favicon, webmanifest, plain html, etc.)
app.use(express.static(PUBLIC_DIR));
// Cache /assets aggressively (guide.css, guide.js, lucide.min.js)
app.use(
  "/assets",
  express.static(path.join(PUBLIC_DIR, "assets"), {
    immutable: true,
    maxAge: "30d",
  })
);

// Cache SW/manifest a bit
app.get(["/sw.js", "/manifest.webmanifest"], (req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  next();
});

// ───────────────────────────────────────────────────────────────────────────────
// Stripe webhook (raw body FIRST)
// ───────────────────────────────────────────────────────────────────────────────
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const obj = event.data.object;
      const email =
        obj?.customer_details?.email || obj?.customer_email || obj?.metadata?.email || null;
      if (email) console.log(`✅ Checkout completed for: ${email}`);
      // TODO: entitlement write + Short.io magic link
    }
    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Stripe webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Switch back to JSON parsing for the rest
app.use(express.json({ limit: "2mb" }));

// ───────────────────────────────────────────────────────────────────────────────
/** Views (Mustache) */
// ───────────────────────────────────────────────────────────────────────────────
const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const publicDir = PUBLIC_DIR;
const serverViews = path.join(rootDir, "server", "templates");
const publicViews = path.join(publicDir, "templates");

app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", [serverViews, publicViews]);

// Route-scoped CSP for guide pages (allow fonts inline styles; scripts are self)
const guideCsp = helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "font-src": ["'self'", "data:"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "frame-ancestors": ["'none'"],
    },
  },
});

// ───────────────────────────────────────────────────────────────────────────────
// Helper fns (SSR sidebar + plan extraction)
// ───────────────────────────────────────────────────────────────────────────────
function getWizardAnswers(req) {
  let a = null;
  try {
    if (req.query.answers) a = JSON.parse(String(req.query.answers));
  } catch {}
  if (!a) {
    try {
      if (req.cookies?.ss_answers) a = JSON.parse(String(req.cookies.ss_answers));
    } catch {}
  }
  return a || null;
}

function iconFor(appName = "") {
  const n = appName.toLowerCase();
  if (n.includes("boost")) return "zap";
  if (n.includes("kikoff")) return "credit-card";
  if (n.includes("kovo")) return "trending-up";
  if (n.includes("rent")) return "home";
  if (n.includes("dispute")) return "shield-check";
  return "star";
}

function stepsFor(appName = "", a = {}) {
  const n = appName.toLowerCase();
  if (a.step1 || a.step2 || a.step3) return [a.step1 || "", a.step2 || "", a.step3 || ""];

  if (n.includes("experian") && n.includes("boost"))
    return ["Instant Credit Score Boost", "Connect Bank", "Add Utilities"];
  if (n.includes("kikoff"))
    return ["Open Kikoff Credit Account", "Enable Autopay", "Keep Utilization <10%"];
  if (n.includes("kovo"))
    return ["Create Kovo Account", "Choose Monthly Plan", "Make On-Time Payments"];
  if (n.includes("self"))
    return ["Open Self Credit Builder", "Fund First Deposit", "Auto-pay On"];
  if (n.includes("rent") || n.includes("boom") || n.includes("rentreporter"))
    return ["Verify Lease", "Connect Payment Source", "Backdate (if eligible)"];
  if (n.includes("dispute") || n.includes("dovly"))
    return ["Import Report", "Auto-scan Issues", "Submit Round-1 Disputes"];

  return ["Start · Create account", "Connect · Bank/Payment", "Activate · Feature"];
}

function deriveSidebarApps(plans = []) {
  const seen = new Set();
  const out = [];
  const add = (a) => {
    const n = (a?.app_name || "").trim();
    if (!n || seen.has(n)) return;
    seen.add(n);
    out.push(a);
  };

  if (plans[0]?.apps) (plans[0].apps || []).forEach(add);
  for (let i = 1; i < plans.length && out.length < 5; i++) (plans[i].apps || []).forEach(add);

  // pad to 5 with sensible fallbacks
  const fallbacks = [
    { app_name: "Experian Boost", app_url: "https://www.experian.com/boost" },
    { app_name: "Kikoff", app_url: "https://www.kikoff.com/" },
    { app_name: "Kovo", app_url: "https://www.kovo.com/" },
    { app_name: "Self", app_url: "https://www.self.inc/" },
    { app_name: "Boom (Rent)", app_url: "https://www.boompay.app/" },
    { app_name: "Dovly (Disputes)", app_url: "https://www.dovly.com/" },
  ];
  for (const f of fallbacks) {
    if (out.length >= 5) break;
    if (!seen.has(f.app_name)) out.push(f);
  }
  return out.slice(0, 5);
}

function buildSidebarHtml(apps = []) {
  return apps
    .map((a, i) => {
      const app = a.app_name || a.name || "App";
      const url = a.app_url || a.url || "";
      const [s1, s2, s3] = stepsFor(app, a);
      return `
<details class="group"${i === 0 ? " open" : ""}>
  <summary class="w-full flex items-center justify-between px-3 py-2 bg-lime-600 text-black rounded-md hover:bg-lime-500 transition-colors text-xs font-medium cursor-pointer"
    data-app="${app}" data-url="${url}" data-step1="${s1}" data-step2="${s2}" data-step3="${s3}">
    <span class="flex items-center space-x-1.5"><i data-lucide="${iconFor(app)}" class="w-3.5 h-3.5"></i><span>${app}</span></span>
    <i data-lucide="chevron-down" class="w-3 h-3 chev"></i>
  </summary>
  <ul class="mt-3 space-y-2 px-3 pb-3">
    <li class="flex items-center justify-between text-xs text-zinc-300"><span>${s1}</span><input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600"></li>
    <li class="flex items-center justify-between text-xs text-zinc-300"><span>${s2}</span><input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600"></li>
    <li class="flex items-center justify-between text-xs text-zinc-300"><span>${s3}</span><input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600"></li>
  </ul>
</details>`;
    })
    .join("\n");
}

// ───────────────────────────────────────────────────────────────────────────────
// Plan fetch for SSR (GET + stackKey)
// ───────────────────────────────────────────────────────────────────────────────
async function fetchPlansAndSidebar(req, guideId) {
  const answers = getWizardAnswers(req);
  const stackKey = (req.query.stackKey || "foundation").toString().trim();
  const url = `${req.protocol}://${req.get("host")}/api/gpt-plan?stackKey=${encodeURIComponent(
    stackKey
  )}`;

  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) throw new Error(`/api/gpt-plan ${resp.status}`);
  let data = await resp.json();

  const tryParse = (v) =>
    typeof v === "string"
      ? (() => {
          try {
            return JSON.parse(v);
          } catch {
            return null;
          }
        })()
      : null;

  let plans = [];
  if (Array.isArray(data?.plans) && data.plans.length) plans = data.plans;
  else if (data?.plan) plans = [data.plan];
  else {
    const nest =
      tryParse(data?.result) ||
      tryParse(data?.output) ||
      tryParse(data?.plan_json) ||
      tryParse(data);
    if (Array.isArray(nest?.plans)) plans = nest.plans;
    else if (nest?.plan) plans = [nest.plan];
  }

  if (!plans.length) {
    plans = [
      {
        id: "A",
        summary: "Fallback demo: utilities + 1 installment.",
        total_monthly_cost_usd: 29,
        apps: [
          {
            app_name: "Experian Boost",
            app_description: "Report utilities",
            monthly_fee_usd: 0,
            reports_to: "EX",
            app_url: "https://www.experian.com/boost",
          },
          {
            app_name: "Kikoff",
            app_description: "Installment tradeline",
            monthly_fee_usd: 5,
            reports_to: "EX/EQ/TU",
            app_url: "https://www.kikoff.com/",
          },
        ],
        sequence: [
          { week: 1, steps: ["Sign up Boost", "Connect bank"] },
          { week: 2, steps: ["Open Kikoff", "Enable autopay"] },
        ],
        kpis: ["+15–30 pts in 30–60 days"],
        risk_flags: ["Missed payments undo progress"],
      },
    ];
  }

  const sidebar_html = buildSidebarHtml(deriveSidebarApps(plans));
  return { plans, sidebar_html };
}

// ───────────────────────────────────────────────────────────────────────────────
// APIs
// ───────────────────────────────────────────────────────────────────────────────
app.use("/api/plan", planRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api", healthRouter);
app.use("/api", gptPlanRouter); // supports GET /api/gpt-plan (and optional POST alias)

// Safety redirects for old asset paths under /guide/*
app.get("/guide/assets/*", (req, res) =>
  res.redirect(301, req.path.replace(/^\/guide\/assets\//, "/assets/"))
);
app.get("/guide/manifest.webmanifest", (_req, res) => res.redirect(301, "/manifest.webmanifest"));
app.get("/guide/favicon.ico", (_req, res) => res.redirect(301, "/favicon.ico"));

// ───────────────────────────────────────────────────────────────────────────────
// Dynamic GUIDE route (Mustache)
// ───────────────────────────────────────────────────────────────────────────────
app.get("/guide/:id", guideCsp, async (req, res) => {
  try {
    const token_tail = (req.query.t || "anon").toString().slice(-6);
    const { plans, sidebar_html } = await fetchPlansAndSidebar(req, req.params.id);
    return res.render("guide-v3", {
      stack_title: "StackScore – Build & Compose",
      token_tail,
      plans,
      sidebar_html,
    });
  } catch (err) {
    console.error("❌ /guide/:id error:", err);
    const token_tail = (req.query.t || "anon").toString().slice(-6);
    return res
      .status(200)
      .render("guide-v3", {
        stack_title: "StackScore – Build & Compose",
        token_tail,
        plans: [],
        sidebar_html: "",
      });
  }
});

// Sidebar fragment (HTML only, same origin)
app.get("/render/sidebar", guideCsp, async (req, res) => {
  try {
    const { sidebar_html } = await fetchPlansAndSidebar(req, "sidebar-fragment");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(sidebar_html || "");
  } catch (e) {
    console.error("❌ /render/sidebar error:", e);
    return res.status(200).send("");
  }
});

// Magic links AFTER guide routes
app.use(magicLinks);

// Legacy simple health (kept) + new /api/health from router
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

// SPA fallback for any other route (served from /dist)
app.use(
  express.static(distDir, {
    setHeaders: (res, p) => {
      if (/\.(css|js|woff2?|png|svg|jpg|jpeg|gif)$/.test(p)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);
app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));

// Boot
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Public dir: ${PUBLIC_DIR}`);
  console.log(`Views (server): ${serverViews}`);
  console.log(`Views (public): ${publicViews}`);
});

export default app;
