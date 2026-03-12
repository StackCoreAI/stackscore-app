// netlify/functions/export-plan-pdf.js
import Stripe from "stripe";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

function json(headers = {}, statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

function safeParse(v, fallback = null) {
  try {
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch {
    return fallback;
  }
}

function normalizeAnswers(raw = {}) {
  return {
    living: raw.living || raw.housing || "",
    budget: raw.budget || "",
    timeline: raw.timeline || raw.goal || "",
    employment: raw.employment || "",
    rent_backdate: raw.rent_backdate || "",
  };
}

function normalizeApps(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.flatMap((item) => {
      if (Array.isArray(item?.apps)) return item.apps;
      if (item?.app_name || item?.name) return [item];
      return [];
    });
  }

  if (Array.isArray(input?.apps)) return input.apps;
  if (Array.isArray(input?.plans)) {
    return input.plans.flatMap((p) => Array.isArray(p?.apps) ? p.apps : []);
  }

  return [];
}

function uniqueApps(apps = []) {
  const seen = new Set();
  const out = [];

  for (const app of apps) {
    const name = String(app?.app_name || app?.name || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      app_name: name,
      app_url: String(app?.app_url || app?.url || "").trim(),
      features: Array.isArray(app?.features) ? app.features : [],
      step1: app?.step1 || "",
      step2: app?.step2 || "",
      step3: app?.step3 || "",
    });
  }

  return out.slice(0, 5);
}

function stepsFor(app) {
  const n = String(app?.app_name || "").toLowerCase();

  if (app?.step1 || app?.step2 || app?.step3) {
    return [app.step1, app.step2, app.step3].filter(Boolean);
  }

  if (n.includes("experian") && n.includes("boost")) {
    return ["Connect bank account", "Add utility bills", "Confirm reporting is active"];
  }
  if (n.includes("kikoff")) {
    return ["Open Kikoff account", "Enable autopay", "Keep utilization under 10%"];
  }
  if (n.includes("kovo")) {
    return ["Create Kovo account", "Choose your plan", "Make on-time payments"];
  }
  if (n.includes("self")) {
    return ["Open Self Credit Builder", "Fund first payment", "Enable autopay"];
  }
  if (n.includes("rent") || n.includes("boom") || n.includes("rentreporter") || n.includes("pinata")) {
    return ["Verify lease or rent history", "Connect payment source", "Turn on rent reporting"];
  }
  if (n.includes("dovly") || n.includes("dispute")) {
    return ["Import credit report", "Scan for issues", "Start first dispute round"];
  }

  return ["Create account", "Connect payment or required source", "Activate the core feature"];
}

function titleForPlanKey(planKey = "growth") {
  const k = String(planKey || "growth").toLowerCase();
  if (k === "foundation") return "Foundation Credit Route";
  if (k === "growth") return "Growth Credit Route";
  if (k === "accelerator") return "Accelerator Credit Route";
  if (k === "elite") return "Elite Credit Route";
  return `${k.charAt(0).toUpperCase()}${k.slice(1)} Credit Route`;
}

function receiptSummary({ planKey, answers, apps }) {
  const signals = [];
  const names = apps.map((a) => a.app_name.toLowerCase()).join(" | ");

  if (/rent|boom|rentreporter|pinata/.test(names)) signals.push("Rent reporting");
  if (/boost|experian|grow credit|grain/.test(names)) signals.push("Utilities or bill reporting");
  if (/kikoff|self|kovo/.test(names)) signals.push("Installment builder");
  if (/dovly|dispute/.test(names)) signals.push("Dispute support");

  const strategy =
    answers.living?.toLowerCase().includes("rent")
      ? "Rent-optimized activation"
      : "Low-friction reporting strategy";

  return {
    title: titleForPlanKey(planKey),
    strategy,
    signals: signals.length ? signals : ["General credit activation"],
  };
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(page, text, x, y, opts) {
  const {
    font,
    size = 12,
    color = rgb(0, 0, 0),
    maxWidth = 400,
    lineGap = 4,
  } = opts;

  const lines = wrapText(text, font, size, maxWidth);
  let cursorY = y;

  for (const line of lines) {
    page.drawText(line, { x, y: cursorY, size, font, color });
    cursorY -= size + lineGap;
  }

  return cursorY;
}

async function verifyPaidSession(sessionId) {
  if (!sessionId) throw new Error("Missing session_id");
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error("Session not paid");
  }

  return session;
}

async function buildPdf({ planKey, answers, apps, email }) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const { width, height } = page.getSize();

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const lime = rgb(0.52, 0.80, 0.09);
  const white = rgb(0.96, 0.96, 0.96);
  const gray = rgb(0.72, 0.72, 0.72);
  const dark = rgb(0.08, 0.08, 0.08);
  const panel = rgb(0.12, 0.12, 0.12);

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: dark,
  });

  page.drawText("StackScore", {
    x: 48,
    y: height - 54,
    size: 16,
    font: fontBold,
    color: lime,
  });

  page.drawText(titleForPlanKey(planKey), {
    x: 48,
    y: height - 92,
    size: 28,
    font: fontBold,
    color: white,
  });

  let y = height - 130;

  const summary = receiptSummary({ planKey, answers, apps });

  page.drawRectangle({
    x: 48,
    y: y - 76,
    width: width - 96,
    height: 76,
    color: panel,
    borderColor: rgb(0.25, 0.25, 0.25),
    borderWidth: 1,
  });

  page.drawText("Route Summary", {
    x: 62,
    y: y - 22,
    size: 12,
    font: fontBold,
    color: lime,
  });

  page.drawText(summary.strategy, {
    x: 62,
    y: y - 44,
    size: 14,
    font: fontBold,
    color: white,
  });

  page.drawText(`Signals: ${summary.signals.join(", ")}`, {
    x: 62,
    y: y - 62,
    size: 10,
    font: fontRegular,
    color: gray,
  });

  y -= 110;

  page.drawText("Profile Inputs", {
    x: 48,
    y,
    size: 14,
    font: fontBold,
    color: white,
  });

  y -= 20;

  const answerLines = [
    `Living: ${answers.living || "—"}`,
    `Budget: ${answers.budget || "—"}`,
    `Timeline: ${answers.timeline || "—"}`,
    `Employment: ${answers.employment || "—"}`,
    `Rent backdate: ${answers.rent_backdate || "—"}`,
  ];

  for (const line of answerLines) {
    page.drawText(line, {
      x: 60,
      y,
      size: 10,
      font: fontRegular,
      color: gray,
    });
    y -= 16;
  }

  y -= 10;

  page.drawText("Your Route", {
    x: 48,
    y,
    size: 16,
    font: fontBold,
    color: white,
  });

  y -= 24;

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];
    const steps = stepsFor(app);

    if (y < 140) {
      const next = pdf.addPage([612, 792]);
      next.drawRectangle({ x: 0, y: 0, width, height, color: dark });
      y = height - 60;
      pageRef.current = next;
    }
  }

  let currentPage = page;

  const ensureSpace = (needed = 120) => {
    if (y > needed) return;
    currentPage = pdf.addPage([612, 792]);
    currentPage.drawRectangle({ x: 0, y: 0, width, height, color: dark });
    y = height - 60;
  };

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];
    const steps = stepsFor(app);
    const features = Array.isArray(app.features) ? app.features : [];

    ensureSpace(180);

    currentPage.drawRectangle({
      x: 48,
      y: y - 120,
      width: width - 96,
      height: 120,
      color: panel,
      borderColor: rgb(0.22, 0.22, 0.22),
      borderWidth: 1,
    });

    currentPage.drawText(`${i + 1}. ${app.app_name}`, {
      x: 62,
      y: y - 22,
      size: 14,
      font: fontBold,
      color: lime,
    });

    if (app.app_url) {
      y = drawWrappedText(currentPage, app.app_url, 62, y - 42, {
        font: fontRegular,
        size: 9,
        color: gray,
        maxWidth: width - 124,
        lineGap: 2,
      });
    } else {
      y -= 42;
    }

    const featureText = features.length
      ? `Key features: ${features.join(", ")}`
      : "Key features: Follow the guided activation steps inside your route.";

    y = drawWrappedText(currentPage, featureText, 62, y - 4, {
      font: fontRegular,
      size: 10,
      color: white,
      maxWidth: width - 124,
      lineGap: 3,
    });

    y -= 10;

    currentPage.drawText("Activation steps:", {
      x: 62,
      y,
      size: 10,
      font: fontBold,
      color: white,
    });

    y -= 16;

    for (const step of steps.slice(0, 3)) {
      y = drawWrappedText(currentPage, `• ${step}`, 72, y, {
        font: fontRegular,
        size: 10,
        color: gray,
        maxWidth: width - 140,
        lineGap: 3,
      });
      y -= 4;
    }

    y -= 24;
  }

  ensureSpace(90);

  currentPage.drawText("Support", {
    x: 48,
    y,
    size: 12,
    font: fontBold,
    color: white,
  });

  y -= 18;

  const footerText = `Purchased access${email ? ` for ${email}` : ""}. For security, your guide link expires in 24 hours. We recommend bookmarking or downloading your guide for future access.`;
  y = drawWrappedText(currentPage, footerText, 48, y, {
    font: fontRegular,
    size: 9,
    color: gray,
    maxWidth: width - 96,
    lineGap: 3,
  });

  return await pdf.save();
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json({}, 405, { error: "Method Not Allowed" });
    }

    const body = safeParse(event.body || "{}", {}) || {};
    const sessionId =
      body.session_id ||
      body.sessionId ||
      event.queryStringParameters?.session_id ||
      "";

    if (!sessionId) {
      return json({}, 400, { error: "Missing session_id" });
    }

    const session = await verifyPaidSession(sessionId);

    const verifiedStackKey = String(
      body.planKey ||
      body.stackKey ||
      session.metadata?.stackKey ||
      session.metadata?.stack_key ||
      session.metadata?.planKey ||
      "growth"
    ).toLowerCase();

    const answers = normalizeAnswers(body.answers || {});
    const apps = uniqueApps(normalizeApps(body.plans || []));

    if (!apps.length) {
      return json({}, 400, {
        error: "Missing plan data. Generate the plan first, then export the PDF.",
      });
    }

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email ||
      "";

    const pdfBytes = await buildPdf({
      planKey: verifiedStackKey,
      answers,
      apps,
      email,
    });

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="StackScore-Plan-${verifiedStackKey}.pdf"`,
        "cache-control": "no-store",
      },
      body: Buffer.from(pdfBytes).toString("base64"),
    };
  } catch (err) {
    console.error("export-plan-pdf error:", err);
    return json({}, 500, { error: String(err?.message || err) });
  }
};