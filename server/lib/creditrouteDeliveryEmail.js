import { Resend } from "resend";

export const CREDITROUTE_SITE_URL = "https://creditroute.com";
export const CREDITROUTE_DELIVERY_SUBJECT =
  "Your Personalized CreditRoute Plan Is Ready";

let resendClient;

export function formatDeliveryError(err) {
  return {
    name: err?.name || "Error",
    message: err?.message || String(err),
    stack: err?.stack || "",
    response: err?.response || err?.cause || null,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY. Delivery email was not sent.");
  }

  resendClient ||= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

function titleForPlanKey(planKey = "growth") {
  const k = String(planKey || "growth").toLowerCase().trim();
  if (k === "foundation") return "Foundation Credit Route";
  if (k === "growth") return "Growth Credit Route";
  if (k === "accelerator") return "Accelerator Credit Route";
  if (k === "elite") return "Elite Credit Route";
  return `${k.charAt(0).toUpperCase()}${k.slice(1)} Credit Route`;
}

function buildSuccessUrl(site, sessionId, stackKey) {
  const params = new URLSearchParams({
    session_id: sessionId,
    stackKey,
  });

  return `${site}/success?${params.toString()}`;
}

function buildPdfUrl(site, sessionId, stackKey, devPdf = false) {
  const params = new URLSearchParams({
    planKey: stackKey,
  });

  if (devPdf) {
    params.set("dev", "1");
  } else {
    params.set("session_id", sessionId);
  }

  return `${site}/.netlify/functions/export-plan-pdf?${params.toString()}`;
}

function normalizePlans(planPayload) {
  if (Array.isArray(planPayload?.plans)) return planPayload.plans;
  if (Array.isArray(planPayload?.apps)) return [{ apps: planPayload.apps }];
  if (planPayload?.plan) return [planPayload.plan];
  return [];
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

async function fetchPdfAttachment({
  site,
  sessionId,
  stackKey,
  plans,
  answers,
  devPdf = false,
}) {
  const body = {
    planKey: stackKey,
    answers: answers || {},
    plans: plans || [],
  };

  if (devPdf) {
    body.dev = "1";
  } else {
    body.session_id = sessionId;
  }

  const res = await fetch(`${site}/.netlify/functions/export-plan-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/pdf",
      ...(devPdf && process.env.TEST_DELIVERY_EMAIL_SECRET
        ? {
            "x-creditroute-dev-pdf-secret":
              process.env.TEST_DELIVERY_EMAIL_SECRET,
          }
        : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const maybeJson = await res.json().catch(() => null);
    throw new Error(
      maybeJson?.error || `export-plan-pdf failed (${res.status})`
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function buildEmailHtml({ pdfUrl, stackKey }) {
  const safePdfUrl = escapeHtml(pdfUrl);

  return `
<div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px 16px;">
  <p style="margin: 0 0 16px;">
    Hi there,
  </p>

  <p style="margin: 0 0 16px;">
    You now have a clear path forward.
  </p>

  <p style="margin: 0 0 16px;">
    Your personalized CreditRoute Plan is ready.
  </p>

  <p style="margin: 0 0 16px;">
    This plan is designed to guide your credit improvement step-by-step using the highest-impact signals available for your profile.
  </p>

  <p style="margin: 0 0 16px;">
    We recommend saving this document and following each step in order. The biggest results come from consistency and completing each action as outlined.
  </p>

  <p style="margin: 0 0 16px;">
    Start with Step 1 and move forward only after each step is fully set up and active.
  </p>

 <div style="margin:0 0 18px;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td
        bgcolor="#111827"
        style="
          background:#111827;
          border:1px solid #374151;
          border-radius:10px;
        "
      >
        <a
          href="${safePdfUrl}"
          style="
            display:inline-block;
            padding:14px 22px;
            font-family:Inter, Arial, sans-serif;
            font-size:16px;
            font-weight:700;
            line-height:1;
            color:#ffffff;
            text-decoration:none;
            border-radius:10px;
          "
        >
          <span style="color:#ffffff; text-decoration:none;">Download Your CreditRoute Plan</span>
        </a>
      </td>
    </tr>
  </table>
</div>

  <p style="margin: 0 0 16px;">
    Estimated impact: +80-100 points over 45-60 days when the plan is fully executed (results vary by profile)
  </p>

  <p style="margin: 0 0 16px;">
    If you ever need to revisit your plan, keep this PDF as your reference and execution checklist.
  </p>

  <p style="margin: 0 0 16px;">
    Consistency is the key to results - follow the plan and track your progress.
  </p>

  <div style="margin: 0 0 16px; padding: 14px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; color: #374151; font-size: 13px; line-height: 1.5;">
    <p style="margin: 0 0 6px; font-weight: 700; color: #111827;">
      IMPORTANT DISCLAIMER
    </p>
    <p style="margin: 0;">
      CreditRoute provides educational information only and is not financial, legal, credit repair, or credit counseling advice. Credit score improvements are not guaranteed and depend on your individual profile, reporting timelines, lender policies, and actions taken.
    </p>
  </div>

  <p style="margin: 0;">
    - CreditRoute
  </p>
</div>
`;
}

function buildEmailText({ stackKey }) {
  const planTitle = titleForPlanKey(stackKey);

  return [
    "Hi there,",
    "",
    "You now have a clear path forward.",
    "",
    "Your personalized CreditRoute Plan is ready.",
    "",
    "This plan is designed to guide your credit improvement step-by-step using the highest-impact signals available for your profile.",
    "",
    "We recommend saving this document and following each step in order. The biggest results come from consistency and completing each action as outlined.",
    "",
    "Start with Step 1 and move forward only after each step is fully set up and active.",
    "",
    "[Download Your CreditRoute Plan]",
    "",
    "Estimated impact: +80-100 points over 45-60 days when the plan is fully executed (results vary by profile)",
    "",
    "If you ever need to revisit your plan, keep this PDF as your reference and execution checklist.",
    "",
    "Consistency is the key to results - follow the plan and track your progress.",
    "",
    "IMPORTANT DISCLAIMER",
    "CreditRoute provides educational information only and is not financial, legal, credit repair, or credit counseling advice. Credit score improvements are not guaranteed and depend on your individual profile, reporting timelines, lender policies, and actions taken.",
    "",
    "- CreditRoute",
    "",
    planTitle,
  ].join("\n");
}

function getResendId(result) {
  return result?.data?.id || result?.id || "";
}

function formatResendError(result) {
  const error = result?.error;
  if (!error) return "";
  return error?.message || error?.name || JSON.stringify(error);
}

export async function sendCreditRouteDeliveryEmail({
  email,
  sessionId = "",
  stackKey = "growth",
  devPdf = false,
  logPrefix = "creditroute-delivery",
}) {
  const recipient = String(email || "").toLowerCase().trim();
  if (!recipient) {
    throw new Error("Missing recipient email. Delivery email was not sent.");
  }

  const normalizedStackKey = String(stackKey || "growth").toLowerCase().trim();
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const subject = CREDITROUTE_DELIVERY_SUBJECT;

  console.log(`${logPrefix} email send triggered`, {
    recipient,
    subject,
    from,
    sessionId,
    stackKey: normalizedStackKey,
    devPdf,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasFromEmail: Boolean(process.env.RESEND_FROM_EMAIL),
  });

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY. Delivery email was not sent.");
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn(
      `${logPrefix} RESEND_FROM_EMAIL missing. Falling back to onboarding@resend.dev.`
    );
  }

  const site = CREDITROUTE_SITE_URL;
  const successUrl = sessionId
    ? buildSuccessUrl(site, sessionId, normalizedStackKey)
    : "";
  const pdfUrl = buildPdfUrl(site, sessionId, normalizedStackKey, devPdf);

  console.log(`${logPrefix} delivery urls prepared`, {
    successUrl,
    pdfUrl,
  });

  console.log(`${logPrefix} fetching plan payload`, {
    stackKey: normalizedStackKey,
  });
  const planPayload = await fetchPlanPayload({
    site,
    stackKey: normalizedStackKey,
  });
  const plans = normalizePlans(planPayload);
  console.log(`${logPrefix} plan payload resolved`, {
    stackKey: normalizedStackKey,
    planCount: plans.length,
  });

  console.log(`${logPrefix} fetching PDF attachment`, {
    sessionId,
    stackKey: normalizedStackKey,
    devPdf,
  });
  const pdfBuffer = await fetchPdfAttachment({
    site,
    sessionId,
    stackKey: normalizedStackKey,
    plans,
    answers: {},
    devPdf,
  });
  console.log(`${logPrefix} PDF attachment ready`, {
    bytes: pdfBuffer.length,
    filename: `CreditRoute-Plan-${normalizedStackKey}.pdf`,
  });

  const payloadSummary = {
    from,
    to: recipient,
    subject,
    attachmentFilename: `CreditRoute-Plan-${normalizedStackKey}.pdf`,
    attachmentBytes: pdfBuffer.length,
  };

  try {
    console.log(`${logPrefix} calling Resend`, payloadSummary);

    const result = await getResendClient().emails.send({
      from,
      to: recipient,
      subject,
      html: buildEmailHtml({
        pdfUrl,
        stackKey: normalizedStackKey,
      }),
      text: buildEmailText({
        stackKey: normalizedStackKey,
      }),
      attachments: [
        {
          filename: `CreditRoute-Plan-${normalizedStackKey}.pdf`,
          content: pdfBuffer.toString("base64"),
          contentType: "application/pdf",
        },
      ],
    });

    if (result?.error) {
      throw new Error(formatResendError(result) || "Resend email send failed");
    }

    const resendId = getResendId(result);
    console.log(`${logPrefix} email send success`, {
      recipient,
      subject,
      resendId,
    });

    return {
      resendId,
      pdfBytes: pdfBuffer.length,
      pdfUrl,
      stackKey: normalizedStackKey,
      subject,
      to: recipient,
    };
  } catch (err) {
    console.error(`${logPrefix} email send failure`, {
      recipient,
      subject,
      error: formatDeliveryError(err),
    });
    throw err;
  }
}
