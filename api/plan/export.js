// api/plan/export.js
export const config = { runtime: "nodejs" };

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/* ============================== helpers ============================== */

function readSearchParam(req, key) {
  try { return new URL(req.url, `https://${req.headers.host || "x"}`).searchParams.get(key); }
  catch { return null; }
}
function safeJson(body) {
  try {
    if (!body) return {};
    if (typeof body === "object" && !(body instanceof Buffer)) return body;
    const s = body instanceof Buffer ? body.toString("utf8") : String(body);
    return JSON.parse(s || "{}");
  } catch { return {}; }
}

/** WinAnsi‑safe text encoder (prevents pdf-lib encoding errors) */
function enc(v) {
  if (v == null) return "—";
  let s = typeof v === "string" ? v
        : (typeof v === "number" || typeof v === "boolean") ? String(v)
        : (()=>{ try { return JSON.stringify(v); } catch { return String(v); } })();
  return s
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u2023\u2043\u00B7]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\x7E]/g, "");
}

/** Quick word‑wrap utility */
function wrapLines(text, maxWidth, font, size) {
  const words = enc(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ========================== data normalization ========================== */

/** Accept: arrays, objects, {plans}, {plan}, nested .plan, arrays of plan nodes */
function normalizeApps(plans, planKey) {
  try {
    if (!plans) return [];
    const base = (plans && plans.plans && typeof plans.plans === "object") ? plans.plans : plans;

    if (Array.isArray(base)) return base;

    if (base && typeof base === "object") {
      // direct lists
      if (Array.isArray(base.apps))  return base.apps;
      if (Array.isArray(base.stack)) return base.stack;
      if (Array.isArray(base.items)) return base.items;

      // preferred key
      const node = base[planKey];
      if (node && typeof node === "object") {
        if (Array.isArray(node.apps))  return node.apps;
        if (Array.isArray(node.stack)) return node.stack;
        if (Array.isArray(node.items)) return node.items;
        if (node.plan) {
          if (Array.isArray(node.plan.apps))  return node.plan.apps;
          if (Array.isArray(node.plan.stack)) return node.plan.stack;
          if (Array.isArray(node.plan.items)) return node.plan.items;
        }
      }
      // fallback: first plan node with content (covers plans.A/B/C)
      for (const v of Object.values(base)) {
        if (!v || typeof v !== "object") continue;
        if (Array.isArray(v.apps))  return v.apps;
        if (Array.isArray(v.stack)) return v.stack;
        if (Array.isArray(v.items)) return v.items;
        if (v.plan) {
          if (Array.isArray(v.plan.apps))  return v.plan.apps;
          if (Array.isArray(v.plan.stack)) return v.plan.stack;
          if (Array.isArray(v.plan.items)) return v.plan.items;
        }
      }
    }
  } catch {}
  return [];
}

/** Setup‑Guide defaults — used when GPT omits details */
function appDefaults(title) {
  if (!title) return null;
  const t = String(title).toLowerCase();

  // Cushion.ai — Subscription reporting
  if (t.includes("cushion")) {
    return {
      category: "Subscription Reporting",
      reason: "Report 3–5 subscriptions to all bureaus to build positive history.",
      action: [
        "Create an account and choose Protect+",
        "Link the bank/card paying subscriptions (Netflix, Xfinity, OpenAI, Canva)",
        "Confirm 3–5 subscriptions are detected",
        "Activate credit reporting to all bureaus"
      ].join(" • "),
      url: "https://www.cushion.ai"
    };
  }

  // Kovo — Installment tradeline
  if (t.includes("kovo")) {
    return {
      category: "Installment Tradeline",
      reason: "Add a $240 education-based tradeline that reports monthly to bureaus.",
      action: [
        "Sign up for the Credit Builder Plan",
        "Enable autopay to keep on-time reporting",
        "Verify reporting to Experian, Equifax, TransUnion (+ Innovis)"
      ].join(" • "),
      url: "https://www.kovo.com"
    };
  }

  // StellarFi — Utility bill reporting
  if (t.includes("stellarfi") || t.includes("stellar fi")) {
    return {
      category: "Utility Bill Reporting",
      reason: "Report utilities (electric, water, mobile) as on-time payments.",
      action: [
        "Create account and connect checking/debit",
        "Add recurring utility bills",
        "Confirm bills are processed and reported monthly"
      ].join(" • "),
      url: "https://www.stellarfi.com"
    };
  }

  // Experian Boost — Streaming & utilities at Experian
  if (t.includes("experian boost") || t.includes("boost")) {
    return {
      category: "Streaming & Utility Reporting",
      reason: "Add eligible streaming/utility history directly to Experian.",
      action: [
        "Log in / sign up at Experian Boost",
        "Connect the bank account paying bills",
        "Select eligible recurring transactions and approve boost"
      ].join(" • "),
      url: "https://www.experian.com/boost"
    };
  }

  // Dovly AI — Automated disputes (generic defaults)
  if (t.includes("dovly")) {
    return {
      category: "Automated Disputes",
      reason: "Automate dispute workflows to remove inaccurate derogatories.",
      action: [
        "Create an account",
        "Connect your credit reports",
        "Run guided dispute and monitor outcomes"
      ].join(" • "),
      url: "https://www.dovly.com"
    };
  }

  return null;
}

/** Map ANY item (string or object) into consistent fields, then inject defaults if missing */
function mapApp(item) {
  // normalize to object
  let mapped;
  if (item == null) mapped = { title: "App" };
  else if (typeof item === "string") mapped = { title: item };
  else if (typeof item !== "object") mapped = { title: String(item) };
  else {
    mapped = {
      title: item.app_name || item.name || item.title || item.app || "App",
      category: item.category || item.type || item.tier || item.scope || "",
      reason: item.reason || item.why || item.description || item.summary || "",
      action: item.action || item.next || item.step || item.activation || "",
      url: item.url || item.link || item.website || item.homepage || ""
    };
  }

  // Embed Setup‑Guide defaults to fill gaps
  const d = appDefaults(mapped.title);
  if (d) {
    mapped.category = mapped.category || d.category;
    mapped.reason   = mapped.reason   || d.reason;
    mapped.action   = mapped.action   || d.action;
    mapped.url      = mapped.url      || d.url;
  }
  // Ensure fields exist
  return {
    title: mapped.title || "App",
    category: mapped.category || "",
    reason: mapped.reason || "",
    action: mapped.action || "",
    url: mapped.url || ""
  };
}

/* ============================== UI / layout ============================== */

const BRAND = {
  bg: rgb(0.06, 0.06, 0.06),
  text: rgb(0.09, 0.09, 0.09),
  gray: rgb(0.38, 0.38, 0.38),
  lime: rgb(0.65, 1.00, 0.40),
  border: rgb(0.88, 0.88, 0.88),
  panel: rgb(0.98, 0.98, 0.98)
};

function header(page, font, bold) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 92, width, height: 92, color: BRAND.bg });
  page.drawText("StackScore", { x: 36, y: height - 56, size: 22, font: bold, color: BRAND.lime });
  page.drawText("Optimized Stack Plan", { x: 36, y: height - 78, size: 12, font, color: rgb(1,1,1) });
}
function footer(page, font, pageNum, total) {
  const { width } = page.getSize();
  page.drawLine({ start: { x: 36, y: 42 }, end: { x: width - 36, y: 42 }, thickness: 0.5, color: BRAND.border });
  page.drawText(`Generated by StackScore • © ${new Date().getFullYear()} • Page ${pageNum} of ${total}`, {
    x: 36, y: 28, size: 9, font, color: BRAND.gray
  });
}
function sectionTitle(page, bold, x, y, title) {
  page.drawRectangle({ x, y: y - 12, width: 4, height: 24, color: BRAND.lime });
  page.drawText(enc(title), { x: x + 12, y, size: 15, font: bold, color: BRAND.text });
}

function drawAnswerPanel(page, font, bold, answers) {
  const { width } = page.getSize();
  const panelTop = 640;

  page.drawText("Your Optimized Credit Stack", { x: 36, y: 700, size: 18, font: bold, color: BRAND.text });

  page.drawRectangle({
    x: 32, y: panelTop - 136, width: width - 64, height: 136,
    color: BRAND.panel, borderColor: BRAND.border, borderWidth: 1
  });
  sectionTitle(page, bold, 40, panelTop, "Your Answers");

  const leftXLabel = 56, leftXVal = 168;
  const rightXLabel = 336, rightXVal = 448;
  let yL = panelTop - 26;
  let yR = panelTop - 26;

  const subs = Array.isArray(answers?.subs) ? answers.subs.map(enc).join(", ") : enc(answers?.subs);

  yL = drawKV(page, font, leftXLabel,  leftXVal,  yL, "Housing",       answers?.housing);
  yL = drawKV(page, font, leftXLabel,  leftXVal,  yL, "Subscriptions", subs || "—");
  yL = drawKV(page, font, leftXLabel,  leftXVal,  yL, "Tools",         answers?.tools);

  yR = drawKV(page, font, rightXLabel, rightXVal, yR, "Employment",    answers?.employment);
  yR = drawKV(page, font, rightXLabel, rightXVal, yR, "Goal (days)",   answers?.goal);
  yR = drawKV(page, font, rightXLabel, rightXVal, yR, "Budget / mo",   answers?.budget != null ? `$${answers.budget}` : "—");

  const blurb = "These recommendations pair proven credit‑builder apps with smart tracking to compound wins quickly.";
  page.drawText(enc(blurb), { x: 36, y: panelTop - 150, size: 11, font, color: BRAND.gray });

  return panelTop - 180;
}
function drawKV(page, font, xKey, xVal, y, key, val) {
  const size = 11.5;
  page.drawText(enc(`${key}:`), { x: xKey, y, size, font, color: BRAND.gray });
  const text = enc(val ?? "—");
  const max = (xKey < 300 ? 150 : 160);
  const lines = wrapLines(text, max, font, size);
  for (let i = 0; i < lines.length; i++) {
    page.drawText(lines[i], { x: xVal, y: y - (i * 14), size, font, color: BRAND.text });
  }
  return y - (lines.length * 14) - 10;
}

function drawAppCard(page, font, bold, y, app) {
  const { width } = page.getSize();
  const cardX = 40, cardW = width - 80, cardH = 92;

  page.drawRectangle({ x: cardX, y: y - cardH + 2, width: cardW, height: cardH, color: rgb(1,1,1), borderColor: BRAND.border, borderWidth: 1 });
  page.drawRectangle({ x: cardX, y: y - 6, width: cardW, height: 2, color: BRAND.lime });

  page.drawText(enc(app.title || "App"), { x: 48, y: y - 20, size: 13, font: bold, color: BRAND.text });

  let lineY = y - 36;
  const maxW = width - 48 - 48;

  function bullet(label, value) {
    if (!value) return;
    const t = label ? `${label}: ${value}` : value;
    const lines = wrapLines(t, maxW, font, 11);
    for (const ln of lines) {
      page.drawText(`- ${enc(ln)}`, { x: 48, y: lineY, size: 11, font, color: BRAND.text });
      lineY -= 14;
    }
  }

  bullet("Category", app.category);
  bullet("Why",      app.reason);
  bullet("Action",   app.action);
  bullet("Link",     app.url);

  return y - cardH - 10;
}

/* =============================== handler =============================== */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const data = safeJson(req.body);
  const dbg  = readSearchParam(req, "debug");
  const { ss_access, planKey = "growth", answers = {}, plans = [] } = data;

  if (dbg === "1") {
    const apps = normalizeApps(plans, planKey);
    return res.status(200).json({
      ok: true,
      received: {
        planKey,
        answersKeys: Object.keys(answers || {}),
        normalizedCount: Array.isArray(apps) ? apps.length : 0,
        sample: Array.isArray(apps) && apps.length ? apps[0] : null
      }
    });
  }

  try {
    if (ss_access !== "1") return res.status(403).json({ error: "Not authorized" });

    // Map first (supports strings), then filter empties
    const rawList = normalizeApps(plans, planKey);
    const appList = (Array.isArray(rawList) ? rawList : []).map(mapApp).filter(a => a && a.title);

    const pdf  = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let page = pdf.addPage([612, 792]); // Letter
    header(page, font, bold);

    page.drawText("Your Optimized Credit Stack", { x: 36, y: 720, size: 18, font: bold, color: BRAND.text });
    page.drawText(enc(`Selected Plan: ${String(planKey).toUpperCase()}`), { x: 36, y: 705, size: 11, font, color: BRAND.gray });

    let nextY = drawAnswerPanel(page, font, bold, answers);

    sectionTitle(page, bold, 36, nextY + 28, "Recommended Apps");
    nextY -= 6;

    if (appList.length === 0) {
      page.drawText(enc("No recommended apps were found for this plan."), { x: 48, y: nextY + 10, size: 11, font, color: BRAND.gray });
      nextY -= 24;
    } else {
      for (let i = 0; i < Math.min(appList.length, 50); i++) {
        if (nextY < 130) {
          const idx = pdf.getPageIndices().indexOf(page) + 1; // for reference
          page = pdf.addPage([612, 792]);
          header(page, font, bold);
          nextY = 720 - 48;
          sectionTitle(page, bold, 36, nextY, "Recommended Apps (cont.)");
          nextY -= 18;
        }
        nextY = drawAppCard(page, font, bold, nextY, appList[i]);
      }
    }

    // Page numbers
    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i++) footer(pages[i], font, i + 1, pages.length);

    const bytes = await pdf.save();
    const filename = `StackScore-Plan-${String(planKey).toUpperCase()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).end(Buffer.from(bytes));
  } catch (e) {
    const show = readSearchParam(req, "debug") === "2";
    console.error("export error:", e);
    return res.status(500).json({ error: "export_failed", ...(show ? { detail: e?.message || String(e), stack: e?.stack } : {}) });
  }
}
