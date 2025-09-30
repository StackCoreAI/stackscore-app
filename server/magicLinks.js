// server/magicLinks.js
import fs from "fs";
import path from "path";
import crypto from "crypto";
import Mustache from "mustache";
import fetch from "node-fetch";
import express from "express";

const router = express.Router();

// In-memory store (swap to Xata later)
const guides = new Map(); // id -> { html, token, createdAt }

const guideTemplatePath = path.resolve(process.cwd(), "server/templates/guide-v3.mustache");
const guideTemplate = fs.readFileSync(guideTemplatePath, "utf8");

// ───────── helpers ─────────
const b64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const newId    = () => b64url(crypto.randomBytes(9));
const newToken = () => b64url(crypto.randomBytes(24));
const last6    = (s) => (s || "").slice(-6);

function setLockdownHeaders(res) {
  // MVP: relaxed CSP so Tailwind/Lucide/CDN fonts work; still private/no-index/no-frame.
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Robots-Tag", "noindex,noarchive,noimageindex,nofollow");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' https: data:",
      "style-src 'self' 'unsafe-inline' https:",      // Tailwind CDN + inline
      "script-src 'self' 'unsafe-inline' https:",     // Lucide CDN + small inline JS
      "font-src 'self' data: https:",                 // Google Fonts + data: woff2
      "connect-src 'self' https:",                    // safe if you add fetch/XHR later
      "frame-ancestors 'none'",
    ].join("; ")
  );
}

// ───────── routes ─────────

// Create a private, linkable guide from GPT plan JSON
router.post("/api/guide/create", async (req, res) => {
  try {
    // If caller didn't send inputs, provide sane defaults so we always render a plan
    const input = (typeof req.body === "object" && req.body) ? { ...req.body } : {};
    if (!Object.keys(input).length) {
      Object.assign(input, {
        current_score: 510,
        monthly_budget_usd: 100,
        goals: ["near-term FICO improvement (30–90 days)"],
        preferences: {
          soft_pull_only: true,
          report_to_all_three: true,
          utility_reporting: true,
          subscription_reporting: true,
        },
        profile: { homeowner: true, rent_reporting: false, has_open_cards: false },
      });
    }

    // Call your local GPT endpoint (match current host/port; no hardcoding)
    const base = `${req.protocol}://${req.get("host")}`;
    const resp = await fetch(`${base}/api/gpt-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const text = await resp.text();
    if (!resp.ok) return res.status(502).json({ error: "gpt-plan failed", detail: text.slice(0, 400) });

    let plan;
    try { plan = JSON.parse(text); }
    catch { return res.status(502).json({ error: "Upstream non-JSON", sample: text.slice(0, 400) }); }

    const id    = newId();
    const token = newToken();

    // Build Mustache view
    const view = {
      stack_title: "Your StackScore Guide",
      token_tail: last6(token),
      has_plans: Array.isArray(plan?.plans) && plan.plans.length > 0,
      plans: (plan?.plans || []).map((p) => ({
        id: p.id,
        summary: p.summary || "",
        total_monthly_cost_usd: p.total_monthly_cost_usd ?? 0,
        apps: (p.apps || []).map((a) => ({
          app_name: a.app_name,
          app_description: a.app_description,
          monthly_fee_usd: a.monthly_fee_usd ?? 0,
          reports_to: Array.isArray(a.reports_to) ? a.reports_to.join(", ") : "",
        })),
        sequence: (p.sequence || []).map((s) => ({
          week: s.week,
          steps: Array.isArray(s.steps) ? s.steps : [],
        })),
        kpis: p.kpis || [],
        risk_flags: p.risk_flags || [],
        substitutes: (p.substitutes || []).map((s) => ({
          for_app: s.for_app,
          options: Array.isArray(s.options) ? s.options.join(" • ") : "",
        })),
      })),
    };

    const html = Mustache.render(guideTemplate, view);
    guides.set(id, { html, token, createdAt: Date.now() });

    return res.status(200).json({ ok: true, id, url: `/guide/${id}?t=${token}` });
  } catch (err) {
    console.error("create guide error:", err);
    return res.status(500).json({ error: "create guide failed" });
  }
});

// Serve the private guide (token-gated)
router.get("/guide/:id", (req, res) => {
  setLockdownHeaders(res);

  const { id } = req.params;
  const t = req.query.t;
  if (typeof t !== "string" || t.length < 32) return res.status(403).send("Forbidden");

  const rec = guides.get(id);
  if (!rec) return res.status(404).send("Not found");

  // timing-safe compare
  const a = Buffer.from(rec.token);
  const b = Buffer.from(String(t));
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!match) return res.status(403).send("Forbidden");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(rec.html);
});

// Rotate token
router.post("/api/guide/rotate", (req, res) => {
  const { id } = req.body || {};
  const rec = guides.get(id);
  if (!rec) return res.status(404).json({ error: "not found" });

  const token = newToken();
  const updatedHtml = rec.html.replace(/data-watermark="([A-Za-z0-9_-]{0,6})"/, `data-watermark="${last6(token)}"`);
  guides.set(id, { ...rec, token, html: updatedHtml });

  return res.json({ ok: true, url: `/guide/${id}?t=${token}` });
});

export default router;
