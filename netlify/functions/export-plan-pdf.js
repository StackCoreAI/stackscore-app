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

function getSiteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://stackscore.ai"
  ).replace(/\/+$/, "");
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
    return input.plans.flatMap((p) => (Array.isArray(p?.apps) ? p.apps : []));
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
      tip: app?.tip || "",
      execution_insights: Array.isArray(app?.execution_insights)
        ? app.execution_insights
        : [],
      reroutes: Array.isArray(app?.reroutes) ? app.reroutes : [],
    });
  }

  return out.slice(0, 5);
}

function stepsFor(app) {
  const explicit = [app?.step1, app?.step2, app?.step3]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (explicit.length) return explicit;

  const n = String(app?.app_name || "").toLowerCase();
  const featureLabel =
    Array.isArray(app?.features) && app.features.length
      ? app.features[0]
      : "core reporting feature";

  if (n.includes("experian") && n.includes("boost")) {
    return [
      "Create your Experian account and enter the Boost setup flow.",
      "Connect the bank account that pays your eligible utility and streaming bills.",
      "Select the bills you want Boost to count and confirm Boost is active.",
    ];
  }

  if (n.includes("grow credit")) {
    return [
      "Open your Grow Credit account and complete the starter setup.",
      "Link the eligible subscription payments you want routed through Grow Credit.",
      "Turn on reporting so those subscription payments begin building history.",
    ];
  }

  if (n.includes("grain")) {
    return [
      "Create your Grain account and complete identity setup.",
      "Link the eligible bill or payment source used for reporting.",
      "Turn on the reporting feature tied to that bill so it begins contributing to your route.",
    ];
  }

  if (n.includes("kikoff")) {
    return [
      "Open your Kikoff account and activate the credit builder line.",
      "Enable autopay so the monthly payment reports consistently.",
      "Keep utilization low and leave the account active so the tradeline stays healthy.",
    ];
  }

  if (n.includes("kovo")) {
    return [
      "Create your Kovo account and select the credit-building product you want reported.",
      "Complete payment setup so the installment trade can begin reporting properly.",
      "Keep the account in good standing with on-time payments each cycle.",
    ];
  }

  if (n.includes("self")) {
    return [
      "Open your Self account and choose the Credit Builder Loan that fits your budget.",
      "Fund the first payment and enable autopay for on-time reporting.",
      "Keep the loan active until reporting history begins compounding.",
    ];
  }

  if (
    n.includes("rent") ||
    n.includes("boom") ||
    n.includes("rentreporter") ||
    n.includes("pinata") ||
    n.includes("piñata")
  ) {
    return [
      "Create your rent reporting account and complete the verification setup.",
      "Submit landlord, lease, or payment details for current rent history.",
      "Turn on rent reporting and add backdated rent history if eligible.",
    ];
  }

  if (n.includes("dovly")) {
    return [
      "Create your Dovly account and import your credit profile.",
      "Run the scan so Dovly can identify negative items and dispute opportunities.",
      "Turn on the automated dispute workflow and monitor for the first update cycle.",
    ];
  }

  if (n.includes("dispute")) {
    return [
      "Import your credit report details into the dispute tool.",
      "Generate the first dispute round for qualified items.",
      "Send the first dispute set and track responses before starting the next round.",
    ];
  }

  if (n.includes("tomo")) {
    return [
      "Open your Tomo account and complete the secured card setup.",
      "Link your bank account and fund the secured component if required.",
      "Enable autopay and keep card usage low so the tradeline reports cleanly.",
    ];
  }

  if (n.includes("extra")) {
    return [
      "Create your Extra account and complete the debit-to-credit setup.",
      "Link the bank account Extra uses to support card activity.",
      "Use the card lightly and keep the reporting feature active so the tradeline stays strong.",
    ];
  }

  return [
    `Create your ${app?.app_name || "account"} account and complete the initial setup flow.`,
    `Connect the payment source, bank account, or verification details required to use the ${String(
      featureLabel
    ).toLowerCase()}.`,
    `Turn on the specific reporting or credit-building feature inside ${
      app?.app_name || "the app"
    } so it begins contributing to your route.`,
  ];
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

  if (/rent|boom|rentreporter|pinata|piñata/.test(names)) {
    signals.push("Rent reporting");
  }
  if (/boost|experian|grow credit|grain/.test(names)) {
    signals.push("Utilities or bill reporting");
  }
  if (/kikoff|self|kovo/.test(names)) {
    signals.push("Installment builder");
  }
  if (/dovly|dispute/.test(names)) {
    signals.push("Dispute support");
  }
  if (/tomo|extra|grain/.test(names)) {
    signals.push("Tradeline support");
  }

  const strategy = answers.living?.toLowerCase().includes("rent")
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
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error("Session not paid");
  }

  return session;
}

async function fetchPlanPayload({ site, stackKey }) {
  const res = await fetch(`${site}/.netlify/functions/generate-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      stackKey,
      answers: {},
    }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error || `generate-plan failed (${res.status})`);
  }

  return json;
}

function normalizePlans(planPayload) {
  if (Array.isArray(planPayload?.plans)) return planPayload.plans;
  if (Array.isArray(planPayload?.apps)) return [{ apps: planPayload.apps }];
  if (planPayload?.plan) return [planPayload.plan];
  return [];
}

async function resolveApps({ apps, site, planKey }) {
  if (Array.isArray(apps) && apps.length) {
    return uniqueApps(apps);
  }

  const planPayload = await fetchPlanPayload({ site, stackKey: planKey });
  return uniqueApps(normalizeApps(normalizePlans(planPayload)));
}

async function buildPdf({ planKey, answers, apps, email }) {
  const pdf = await PDFDocument.create();
  let currentPage = pdf.addPage([612, 792]);
  const { width, height } = currentPage.getSize();

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const lime = rgb(0.52, 0.80, 0.09);
  const white = rgb(0.96, 0.96, 0.96);
  const gray = rgb(0.72, 0.72, 0.72);
  const muted = rgb(0.84, 0.84, 0.84);
  const dark = rgb(0.08, 0.08, 0.08);
  const panel = rgb(0.12, 0.12, 0.12);
  const line = rgb(0.22, 0.22, 0.22);

  const paintPageBase = (page) => {
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: dark,
    });
  };

  const startNewPage = () => {
    currentPage = pdf.addPage([612, 792]);
    paintPageBase(currentPage);
    return height - 52;
  };

  const ensureSpace = (currentY, needed = 140) => {
    if (currentY > needed) return currentY;
    return startNewPage();
  };

  paintPageBase(currentPage);

  currentPage.drawText("StackScore", {
    x: 48,
    y: height - 50,
    size: 16,
    font: fontBold,
    color: lime,
  });

  currentPage.drawText(titleForPlanKey(planKey), {
    x: 48,
    y: height - 92,
    size: 28,
    font: fontBold,
    color: white,
  });

  currentPage.drawText("Printable Credit Route Guide", {
    x: 48,
    y: height - 116,
    size: 11,
    font: fontRegular,
    color: gray,
  });

  let y = height - 146;

  const summary = receiptSummary({ planKey, answers, apps });

  currentPage.drawRectangle({
    x: 48,
    y: y - 84,
    width: width - 96,
    height: 84,
    color: panel,
    borderColor: line,
    borderWidth: 1,
  });

  currentPage.drawText("Route Intelligence Snapshot", {
    x: 62,
    y: y - 20,
    size: 12,
    font: fontBold,
    color: lime,
  });

  currentPage.drawText(summary.strategy, {
    x: 62,
    y: y - 42,
    size: 14,
    font: fontBold,
    color: white,
  });

  currentPage.drawText(`Signals: ${summary.signals.join(", ")}`, {
    x: 62,
    y: y - 60,
    size: 10,
    font: fontRegular,
    color: gray,
  });

  currentPage.drawText("Use the apps below in sequence and activate the named feature inside each tool.", {
    x: 62,
    y: y - 76,
    size: 9,
    font: fontRegular,
    color: gray,
  });

  y -= 104;

  currentPage.drawText("Selected Plan", {
    x: 48,
    y,
    size: 10,
    font: fontBold,
    color: lime,
  });

  y -= 16;

  currentPage.drawText(titleForPlanKey(planKey), {
    x: 48,
    y,
    size: 18,
    font: fontBold,
    color: white,
  });

  y -= 28;

  currentPage.drawText("Profile Inputs", {
    x: 48,
    y,
    size: 13,
    font: fontBold,
    color: white,
  });

  y -= 18;

  const answerLines = [
    `Living: ${answers.living || "—"}`,
    `Budget: ${answers.budget || "—"}`,
    `Timeline: ${answers.timeline || "—"}`,
    `Employment: ${answers.employment || "—"}`,
    `Rent backdate: ${answers.rent_backdate || "—"}`,
  ];

  for (const lineText of answerLines) {
    currentPage.drawText(lineText, {
      x: 60,
      y,
      size: 10,
      font: fontRegular,
      color: gray,
    });
    y -= 15;
  }

  y -= 12;

  currentPage.drawText("Your Credit Route — Start Here", {
    x: 48,
    y,
    size: 16,
    font: fontBold,
    color: white,
  });

  y -= 22;

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];
    const steps = stepsFor(app);
    const features = Array.isArray(app.features) ? app.features : [];
    const featureText = features.length
      ? `Use these features in ${app.app_name}: ${features.join(", ")}.`
      : `Use the recommended reporting or credit-building feature inside ${app.app_name}.`;

    const tipText = String(app?.tip || "").trim();
    const insightText =
      Array.isArray(app?.execution_insights) && app.execution_insights.length
        ? `Execution insights: ${app.execution_insights.join(" • ")}`
        : "";

    const rerouteText =
      Array.isArray(app?.reroutes) && app.reroutes.length
        ? `Reroutes if unavailable: ${app.reroutes.join(", ")}`
        : "";

    y = ensureSpace(y, 205);
    const cardTopY = y;

    currentPage.drawRectangle({
      x: 48,
      y: cardTopY - 146,
      width: width - 96,
      height: 146,
      color: panel,
      borderColor: line,
      borderWidth: 1,
    });

    currentPage.drawText(`${i + 1}. ${app.app_name}`, {
      x: 62,
      y: cardTopY - 20,
      size: 14,
      font: fontBold,
      color: lime,
    });

    let contentY = cardTopY - 38;

    if (app.app_url) {
      contentY = drawWrappedText(currentPage, app.app_url, 62, contentY, {
        font: fontRegular,
        size: 9,
        color: gray,
        maxWidth: width - 124,
        lineGap: 2,
      });
      contentY -= 4;
    }

    contentY = drawWrappedText(currentPage, featureText, 62, contentY, {
      font: fontRegular,
      size: 10,
      color: white,
      maxWidth: width - 124,
      lineGap: 3,
    });

    if (tipText) {
      contentY -= 4;
      contentY = drawWrappedText(currentPage, `Tip: ${tipText}`, 62, contentY, {
        font: fontRegular,
        size: 9,
        color: muted,
        maxWidth: width - 124,
        lineGap: 2,
      });
    }

    contentY -= 8;

    currentPage.drawText("Activation steps:", {
      x: 62,
      y: contentY,
      size: 10,
      font: fontBold,
      color: white,
    });

    contentY -= 15;

    for (const step of steps.slice(0, 3)) {
      contentY = drawWrappedText(currentPage, `• ${step}`, 72, contentY, {
        font: fontRegular,
        size: 9.5,
        color: gray,
        maxWidth: width - 142,
        lineGap: 2,
      });
      contentY -= 3;
    }

    if (insightText) {
      contentY -= 2;
      contentY = drawWrappedText(currentPage, insightText, 62, contentY, {
        font: fontRegular,
        size: 8.5,
        color: muted,
        maxWidth: width - 124,
        lineGap: 2,
      });
    }

    if (rerouteText) {
      contentY -= 2;
      contentY = drawWrappedText(currentPage, rerouteText, 62, contentY, {
        font: fontRegular,
        size: 8.5,
        color: muted,
        maxWidth: width - 124,
        lineGap: 2,
      });
    }

    y = cardTopY - 162;
  }

  y = ensureSpace(y, 100);

  currentPage.drawText("Support", {
    x: 48,
    y,
    size: 12,
    font: fontBold,
    color: white,
  });

  y -= 16;

  const footerText = `Purchased access${
    email ? ` for ${email}` : ""
  }. For security, your guide link may be time-limited. We recommend opening your route now and saving this PDF for future reference.`;

  drawWrappedText(currentPage, footerText, 48, y, {
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
    const method = String(event.httpMethod || "").toUpperCase();

    if (method !== "POST" && method !== "GET") {
      return json({}, 405, { error: "Method Not Allowed" });
    }

    const body =
      method === "POST" ? safeParse(event.body || "{}", {}) || {} : {};

    const query = event.queryStringParameters || {};

    const sessionId =
      body.session_id ||
      body.sessionId ||
      query.session_id ||
      query.sessionId ||
      "";

    if (!sessionId) {
      return json({}, 400, { error: "Missing session_id" });
    }

    const session = await verifyPaidSession(sessionId);

    const verifiedStackKey = String(
      body.planKey ||
        body.stackKey ||
        query.planKey ||
        query.stackKey ||
        session.metadata?.stackKey ||
        session.metadata?.stack_key ||
        session.metadata?.planKey ||
        "growth"
    )
      .toLowerCase()
      .trim();

    const answers = normalizeAnswers(body.answers || {});
    const site = getSiteUrl();

    const submittedApps = uniqueApps(
      normalizeApps(body.plans || body.apps || [])
    );

    const apps = await resolveApps({
      apps: submittedApps,
      site,
      planKey: verifiedStackKey,
    });

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