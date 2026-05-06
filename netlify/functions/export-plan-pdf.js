// netlify/functions/export-plan-pdf.js
import fs from "node:fs/promises";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import Stripe from "stripe";

const CUSTOMER_SITE_URL = "https://creditroute.com";
const DEV_QA_STACK_KEYS = new Set(["foundation", "growth", "accelerator"]);

let stripeClient;

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

function logPdfInfo(stage, details = {}) {
  console.log(
    "export-plan-pdf stage:",
    stage,
    JSON.stringify(details, (_key, value) =>
      typeof value === "string" && value.length > 400
        ? `${value.slice(0, 400)}...`
        : value
    )
  );
}

function logPdfError(stage, err, details = {}) {
  console.error(
    "export-plan-pdf stage error:",
    stage,
    JSON.stringify({
      ...details,
      error: String(err?.message || err),
      name: err?.name || "",
      stack: err?.stack || "",
    })
  );
}

function getHeader(headers, name) {
  const lower = String(name || "").toLowerCase();
  for (const key of Object.keys(headers || {})) {
    if (String(key).toLowerCase() === lower) return headers[key];
  }
  return "";
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && timingSafeEqual(left, right);
}

function idTail(value = "") {
  return String(value || "").slice(-8);
}

function isDeployPreviewRequest(event) {
  const context = String(process.env.CONTEXT || "").toLowerCase();
  const host = String(
    getHeader(event.headers, "x-forwarded-host") ||
      getHeader(event.headers, "host") ||
      ""
  ).toLowerCase();

  return (
    context === "deploy-preview" ||
    (/^deploy-preview-\d+--/.test(host) && host.endsWith(".netlify.app"))
  );
}

function hasAuthorizedDevPdfSecret(event) {
  const secret = process.env.TEST_DELIVERY_EMAIL_SECRET || "";
  const provided = getHeader(event.headers, "x-creditroute-dev-pdf-secret");
  return Boolean(secret && provided && safeEqual(provided, secret));
}

function parseRequestBody(rawBody) {
  try {
    if (!rawBody) return {};
    if (typeof rawBody !== "string") return rawBody;
    return JSON.parse(rawBody);
  } catch (err) {
    logPdfError("parse-request-body", err, {
      bodyLength: typeof rawBody === "string" ? rawBody.length : null,
      bodyPreview:
        typeof rawBody === "string" ? rawBody.slice(0, 200) : typeof rawBody,
    });
    const requestError = new Error("Invalid JSON request body");
    requestError.statusCode = 400;
    throw requestError;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSiteUrl() {
  return CUSTOMER_SITE_URL;
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

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
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
      app_url: String(app?.app_url || app?.url || app?.website || "").trim(),
      features: normalizeList(app?.features),
      step1: app?.step1 || "",
      step2: app?.step2 || "",
      step3: app?.step3 || "",
      tip: app?.tip || "",
      execution_insights: normalizeList(app?.execution_insights),
      reroutes: normalizeList(app?.reroutes),
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

function scorecardForPlanKey(planKey = "growth") {
  const k = String(planKey || "growth").toLowerCase();
  if (k === "foundation") {
    return { route: "Foundation", impact: "+10-30 pts", timeline: "30-60 days" };
  }
  if (k === "growth") {
    return { route: "Growth", impact: "+40-70 pts", timeline: "45-75 days" };
  }
  if (k === "accelerator") {
    return { route: "Accelerator", impact: "+80-100 pts", timeline: "45-60 days" };
  }
  if (k === "elite") {
    return { route: "Elite", impact: "100+ pts", timeline: "30-60 days" };
  }
  return { route: titleForPlanKey(k).replace(/\s+Credit Route$/i, ""), impact: "+40-70 pts", timeline: "45-75 days" };
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

function listHtml(items = [], emptyText = "Not provided.") {
  const clean = normalizeList(items);
  if (!clean.length) return `<p class="muted">${escapeHtml(emptyText)}</p>`;
  return `<ul>${clean.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function templateValues({ planKey, answers, apps, email, logoSrc }) {
  const score = scorecardForPlanKey(planKey);
  const summary = receiptSummary({ planKey, answers, apps });
  const generatedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const profileItems = [
    `Living: ${answers.living || "Not provided"}`,
    `Budget: ${answers.budget || "Not provided"}`,
    `Timeline: ${answers.timeline || "Not provided"}`,
    `Employment: ${answers.employment || "Not provided"}`,
    `Rent backdate: ${answers.rent_backdate || "Not provided"}`,
  ];

  const checklistItems = [
    "Start with the first route step and complete setup before moving forward.",
    "Turn on the named reporting or credit-building feature inside each tool.",
    "Enable autopay or calendar reminders when available.",
    "Confirm each account or feature is active before starting the next step.",
    "Keep this PDF as your execution checklist and reference.",
  ];

  const actionStepsHtml = apps
    .map((app, index) => {
      const features = normalizeList(app.features);
      const insights = normalizeList(app.execution_insights);
      const reroutes = normalizeList(app.reroutes);
      return `
        <section class="action-card">
          <div class="step-label">Step ${index + 1}</div>
          <h3>${escapeHtml(app.app_name)}</h3>
          ${app.app_url ? `<p class="url">${escapeHtml(app.app_url)}</p>` : ""}
          ${
            features.length
              ? `<p><strong>Primary feature:</strong> ${escapeHtml(features.join(", "))}</p>`
              : `<p><strong>Primary feature:</strong> Recommended reporting or credit-building setup.</p>`
          }
          <h4>Action Steps</h4>
          ${listHtml(stepsFor(app))}
          ${app.tip ? `<p><strong>Tip:</strong> ${escapeHtml(app.tip)}</p>` : ""}
          ${insights.length ? `<h4>Execution Notes</h4>${listHtml(insights)}` : ""}
          ${reroutes.length ? `<h4>Reroutes</h4>${listHtml(reroutes)}` : ""}
        </section>
      `;
    })
    .join("");

  return {
    LOGO_SRC: escapeHtml(logoSrc),
    TITLE: escapeHtml(summary.title),
    GENERATED_AT: escapeHtml(generatedAt),
    EMAIL_LINE: email ? `Prepared for ${escapeHtml(email)}` : "Prepared for your CreditRoute account",
    STRATEGY: escapeHtml(summary.strategy),
    IMPACT: escapeHtml(score.impact),
    TIMELINE: escapeHtml(score.timeline),
    ROUTE_STRENGTH: "High",
    SIGNALS_HTML: listHtml(summary.signals),
    PROFILE_HTML: listHtml(profileItems),
    SUMMARY_TEXT: escapeHtml(
      `This ${score.route} route prioritizes ${summary.strategy.toLowerCase()} and focuses on the strongest available signals for your profile.`
    ),
    CHECKLIST_HTML: listHtml(checklistItems),
    ACTION_STEPS_HTML: actionStepsHtml || `<p class="muted">No route apps are available yet.</p>`,
  };
}

function renderTemplate(template, values) {
  return Object.entries(values).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
}

async function loadTemplate() {
  const candidates = [
    path.join(process.cwd(), "pdf/templates/creditroute-guide.html"),
    path.join(
      process.env.LAMBDA_TASK_ROOT || "",
      "pdf/templates/creditroute-guide.html"
    ),
    "/var/task/pdf/templates/creditroute-guide.html",
  ];
  const tried = [];

  for (const candidate of candidates) {
    if (!candidate || tried.includes(candidate)) continue;
    tried.push(candidate);
    try {
      const template = await fs.readFile(candidate, "utf8");
      logPdfInfo("template-loaded", {
        path: candidate,
        bytes: Buffer.byteLength(template),
      });
      return template;
    } catch (err) {
      logPdfError("template-load-candidate", err, { path: candidate });
    }
  }

  throw new Error(`PDF template not found. Tried: ${tried.join(", ")}`);
}

async function loadLogoSrc() {
  const fallbackUrl = "https://creditroute.com/assets/creditroute-logo.png";
  const candidates = [
    path.join(process.cwd(), "public/assets/creditroute-logo.png"),
    path.join(
      process.env.LAMBDA_TASK_ROOT || "",
      "public/assets/creditroute-logo.png"
    ),
    "/var/task/public/assets/creditroute-logo.png",
  ];
  const tried = [];

  for (const candidate of candidates) {
    if (!candidate || tried.includes(candidate)) continue;
    tried.push(candidate);
    try {
      const logo = await fs.readFile(candidate);
      logPdfInfo("logo-loaded", {
        path: candidate,
        bytes: logo.length,
      });
      return `data:image/png;base64,${logo.toString("base64")}`;
    } catch (err) {
      logPdfError("logo-load-candidate", err, { path: candidate });
    }
  }

  logPdfInfo("logo-fallback-url", { fallbackUrl, tried });
  return fallbackUrl;
}

async function verifyPaidSession(sessionId) {
  if (!sessionId) {
    const err = new Error("Missing session_id");
    logPdfError("verify-paid-session", err, {
      reason: "missing_session_id",
    });
    throw err;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripeClient ||= new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });

  let session;
  try {
    session = await stripeClient.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    logPdfError("verify-paid-session", err, {
      reason: "stripe_retrieve_failed",
      sessionIdTail: idTail(sessionId),
    });
    throw err;
  }

  if (session.payment_status !== "paid") {
    const err = new Error("Session not paid");
    logPdfError("verify-paid-session", err, {
      reason: "session_not_paid",
      sessionIdTail: idTail(sessionId),
      paymentStatus: session.payment_status || "",
    });
    throw err;
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
  let browser;

  try {
    logPdfInfo("build-start", {
      planKey,
      appCount: apps.length,
      hasEmail: Boolean(email),
    });

    const template = await loadTemplate();
    const logoSrc = await loadLogoSrc();
    const html = renderTemplate(
      template,
      templateValues({ planKey, answers, apps, email, logoSrc })
    );

    logPdfInfo("html-rendered", {
      htmlBytes: Buffer.byteLength(html),
    });

    let executablePath;
    try {
      executablePath = await chromium.executablePath();
      logPdfInfo("chromium-executable-path", {
        executablePath,
        argCount: chromium.args.length,
      });
    } catch (err) {
      logPdfError("chromium-executable-path", err);
      throw err;
    }

    try {
      logPdfInfo("puppeteer-launch-start");
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: true,
      });
      logPdfInfo("puppeteer-launch-complete");
    } catch (err) {
      logPdfError("puppeteer-launch", err, { executablePath });
      throw err;
    }

    const page = await browser.newPage();

    try {
      logPdfInfo("page-set-content-start");
      await page.setContent(html, { waitUntil: "networkidle0" });
      logPdfInfo("page-set-content-complete");
    } catch (err) {
      logPdfError("page-set-content", err, {
        htmlBytes: Buffer.byteLength(html),
      });
      throw err;
    }

    try {
      logPdfInfo("page-pdf-start");
      const pdf = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: {
          top: "10mm",
          bottom: "10mm",
          left: "10mm",
          right: "10mm",
        },
      });
      logPdfInfo("page-pdf-complete", { pdfBytes: pdf.length });
      return pdf;
    } catch (err) {
      logPdfError("page-pdf", err);
      throw err;
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
        logPdfInfo("browser-closed");
      } catch (err) {
        logPdfError("browser-close", err);
      }
    }
  }
}

export const handler = async (event) => {
  try {
    const method = String(event.httpMethod || "").toUpperCase();

    if (method !== "POST" && method !== "GET") {
      return json({}, 405, { error: "Method Not Allowed" });
    }

    const body = method === "POST" ? parseRequestBody(event.body) : {};

    const query = event.queryStringParameters || {};

    const sessionId =
      body.session_id ||
      body.sessionId ||
      query.session_id ||
      query.sessionId ||
      "";

    const requestedStackKey = String(
      body.planKey ||
        body.stackKey ||
        query.planKey ||
        query.stackKey ||
        ""
    )
      .toLowerCase()
      .trim();

    const requestedDevPdf =
      String(body.dev || query.dev || "") === "1" &&
      DEV_QA_STACK_KEYS.has(requestedStackKey);
    const isAllowedDevPdf =
      requestedDevPdf &&
      (isDeployPreviewRequest(event) || hasAuthorizedDevPdfSecret(event));

    if (!sessionId && !isAllowedDevPdf) {
      logPdfInfo("session-verification-missing", {
        method,
        requestedStackKey,
        requestedDevPdf,
        isDeployPreview: isDeployPreviewRequest(event),
        hasAuthorizedDevPdfSecret: hasAuthorizedDevPdfSecret(event),
      });
      if (requestedDevPdf) {
        return json({}, 403, {
          error: "Dev PDF bypass is only available on deploy previews.",
        });
      }
      return json({}, 400, { error: "Missing session_id" });
    }

    const session = isAllowedDevPdf
      ? null
      : await verifyPaidSession(sessionId);

    const verifiedStackKey = String(
      requestedStackKey ||
        session?.metadata?.stackKey ||
        session?.metadata?.stack_key ||
        session?.metadata?.planKey ||
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
      session?.customer_details?.email ||
      session?.customer_email ||
      session?.metadata?.email ||
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
        "content-disposition": `attachment; filename="CreditRoute-Plan-${verifiedStackKey}.pdf"`,
        "cache-control": "no-store",
      },
      body: Buffer.from(pdfBytes).toString("base64"),
    };
  } catch (err) {
    console.error("export-plan-pdf error:", err);
    return json({}, err?.statusCode || 500, {
      error: String(err?.message || err),
    });
  }
};
