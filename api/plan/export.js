// api/plan/export.js
export const config = { runtime: "nodejs" };

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ---------- utils ----------
function readSearchParam(req, key) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || "x"}`);
    return url.searchParams.get(key);
  } catch { return null; }
}

function safeJson(body) {
  try {
    if (!body) return {};
    if (typeof body === "object" && !(body instanceof Buffer)) return body;
    const s = body instanceof Buffer ? body.toString("utf8") : String(body);
    return JSON.parse(s || "{}");
  } catch { return {}; }
}

/** normalize apps for any of these:
 *  - [{...}]
 *  - { apps: [...] }
 *  - { [planKey]: { apps: [...] } }
 *  - { ok: true, plans: { [planKey]: { apps: [...] } } }
 */
function normalizeApps(plans, planKey) {
  try {
    if (!plans) return [];

    // unwrap { ok, plans }
    const base = (plans && plans.plans && typeof plans.plans === "object")
      ? plans.plans
      : plans;

    if (Array.isArray(base)) return base;
    if (base && typeof base === "object") {
      if (Array.isArray(base.apps)) return base.apps;
      const node = base[planKey];
      if (node && Array.isArray(node.apps)) return node.apps;
    }
  } catch {}
  return [];
}

// ---------- theme ----------
const BRAND = {
  bg: rgb(0.06, 0.06, 0.06),
  text: rgb(0.07, 0.07, 0.07),
  lime: rgb(0.65, 1.00, 0.40),   // ~ #A6FF66
  gray: rgb(0.38, 0.38, 0.38),
  border: rgb(0.88, 0.88, 0.88),
};

function drawSectionTitle(page, fontBold, x, y, title) {
  page.drawRectangle({ x, y: y - 10, width: 4, height: 20, color: BRAND.lime });
  page.drawText(title, { x: x + 12, y, size: 14, font: fontBold, color: BRAND.text });
}

function drawKeyVal(page, font, xKey, xVal, y, key, val, right = 540) {
  const size = 11;
  page.drawText(`${key}:`, { x: xKey, y, size, font, color: BRAND.gray });
  let txt = String(val ?? "—");
  const max = right - xVal;
  while (font.widthOfTextAtSize(txt, size) > max && txt.length > 3) txt = txt.slice(0, -1);
  page.drawText(txt, { x: xVal, y, size, font, color: BRAND.text });
  return y - 14;
}

function drawBulletWrapped(page, font, x, y, text, maxWidth) {
  const bullet = "• ";
  const size = 11;
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = bullet;
  for (const w of words) {
    const test = (line === bullet) ? bullet + w : line + " " + w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(line); line = bullet + w;
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line);
  let yy = y;
  for (const ln of lines) { page.drawText(ln, { x, y: yy, size, font, color: BRAND.text }); yy -= 14; }
  return yy;
}

// ---------- handler ----------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const data = safeJson(req.body);
  const debug = readSearchParam(req, "debug");
  const { ss_access, planKey = "growth", answers = {}, plans = [] } = data;

  // quick inspect
  if (debug === "1") {
    return res.status(200).json({
      ok: true,
      received: {
        ss_access,
        planKey,
        answersKeys: Object.keys(answers || {}),
        plansHasPlansKey: !!(plans && plans.plans),
        normalizedCount: normalizeApps(plans, planKey).length
      }
    });
  }

  try {
    if (ss_access !== "1") return res.status(403).json({ error: "Not authorized" });

    const appList = normalizeApps(plans, planKey);

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let page = pdf.addPage([612, 792]); // Letter
    const { width, height } = page.getSize();

    // Header band
    page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: BRAND.bg });
    page.drawText("StackScore", { x: 36, y: height - 56, size: 22, font: fontBold, color: BRAND.lime });
    page.drawText("Optimized Stack Plan", { x: 36, y: height - 78, size: 12, font, color: rgb(1,1,1) });

    // Title
    const titleY = height - 120;
    page.drawText("Your Optimized Credit Stack", { x: 36, y: titleY, size: 18, font: fontBold, color: BRAND.text });
    page.drawText(`Selected Plan: ${String(planKey).toUpperCase()}`, { x: 36, y: titleY - 20, size: 11, font, color: BRAND.gray });

    // Answers panel
    const panelTop = titleY - 50;
    page.drawRectangle({ x: 32, y: panelTop - 130, width: width - 64, height: 130, color: rgb(1,1,1), borderColor: BRAND.border, borderWidth: 1 });
    drawSectionTitle(page, fontBold, 40, panelTop + 98, "Your Answers");

    let y = panelTop + 78;
    const subs = Array.isArray(answers.subs) ? answers.subs.join(", ") : (answers.subs ?? "—");

    y  = drawKeyVal(page, font, 60, 155, y, "Housing",      answers.housing ?? "—");
    y  = drawKeyVal(page, font, 60, 155, y, "Subscriptions", subs || "—");
    y  = drawKeyVal(page, font, 60, 155, y, "Tools",        answers.tools ?? "—");

    let y2 = panelTop + 78;
    y2 = drawKeyVal(page, font, 320, 410, y2, "Employment", answers.employment ?? "—");
    y2 = drawKeyVal(page, font, 320, 410, y2, "Goal (days)", answers.goal ?? "—");
    y2 = drawKeyVal(page, font, 320, 410, y2, "Budget / mo", answers.budget ? `$${answers.budget}` : "—");

    page.drawText(
      "These recommendations pair proven credit‑builder apps with smart tracking to compound wins quickly.",
      { x: 36, y: panelTop - 20, size: 11, font, color: BRAND.gray }
    );

    // Apps
    let yy = panelTop - 50;
    drawSectionTitle(page, fontBold, 36, yy + 20, "Recommended Apps");
    yy -= 6;

    const startX = 48, maxWidth = width - startX - 48;
    const ensureRoom = (lines = 60) => {
      if (yy < 80 + lines) {
        const w = page.getSize().width;
        page.drawLine({ start: { x: 36, y: 40 }, end: { x: w - 36, y: 40 }, thickness: 0.5, color: BRAND.border });
        page.drawText(`Generated by StackScore • © ${new Date().getFullYear()}`, {
          x: 36, y: 26, size: 9, font, color: BRAND.gray
        });
        page = pdf.addPage([612, 792]);
        yy = page.getSize().height - 72;
        drawSectionTitle(page, fontBold, 36, yy + 20, "Recommended Apps (cont.)");
        yy -= 6;
      }
    };

    (appList || []).slice(0, 50).forEach((app, idx) => {
      ensureRoom();
      page.drawRectangle({ x: 40, y: yy - 2, width: width - 80, height: 60, color: rgb(1,1,1), borderColor: BRAND.border, borderWidth: 1 });
      page.drawText(`${idx + 1}. ${app?.app_name || app?.name || "App"}`, {
        x: startX, y: yy + 34, size: 12, font: fontBold, color: BRAND.text
      });

      let nextY = yy + 18;
      if (app?.category) nextY = drawBulletWrapped(page, font, startX, nextY, `Category: ${app.category}`, maxWidth);
      if (app?.reason || app?.why) nextY = drawBulletWrapped(page, font, startX, nextY, app.reason || app.why, maxWidth);
      if (app?.action)  nextY = drawBulletWrapped(page, font, startX, nextY, `Action: ${app.action}`, maxWidth);

      yy -= 70;
    });

    // footer last page
    const w = page.getSize().width;
    page.drawLine({ start: { x: 36, y: 40 }, end: { x: w - 36, y: 40 }, thickness: 0.5, color: BRAND.border });
    page.drawText(`Generated by StackScore • © ${new Date().getFullYear()}`, { x: 36, y: 26, size: 9, font, color: BRAND.gray });

    const bytes = await pdf.save();
    const filename = `StackScore-Plan-${String(planKey).toUpperCase()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).end(Buffer.from(bytes));
  } catch (e) {
    const dbg = readSearchParam(req, "debug");
    console.error("export error:", e);
    return res.status(500).json({
      error: "export_failed",
      ...(dbg === "2" ? { detail: e?.message || String(e), stack: e?.stack } : {})
    });
  }
}

