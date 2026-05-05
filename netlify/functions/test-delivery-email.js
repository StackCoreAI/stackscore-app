import { timingSafeEqual } from "node:crypto";
import { Resend } from "resend";

const CUSTOMER_SITE_URL = "https://creditroute.com";
const ALLOWED_STACK_KEYS = new Set(["foundation", "growth", "accelerator"]);
const SUBJECT = "Your Personalized CreditRoute Plan Is Ready";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function formatError(err) {
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

function parseBody(event) {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw);
  } catch (err) {
    const requestError = new Error("Invalid JSON request body");
    requestError.statusCode = 400;
    requestError.cause = err;
    throw requestError;
  }
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

function buildEmailHtml({ pdfUrl }) {
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
    Estimated impact: +80–100 points over 45–60 days when the plan is fully executed (results vary by profile)
  </p>

  <p style="margin: 0 0 16px;">
    If you ever need to revisit your plan, keep this PDF as your reference and execution checklist.
  </p>

  <p style="margin: 0 0 16px;">
    Consistency is the key to results — follow the plan and track your progress.
  </p>

  <p style="margin: 0;">
    — CreditRoute
  </p>
</div>
`;
}

function buildEmailText() {
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
    "Estimated impact: +80–100 points over 45–60 days when the plan is fully executed (results vary by profile)",
    "",
    "If you ever need to revisit your plan, keep this PDF as your reference and execution checklist.",
    "",
    "Consistency is the key to results — follow the plan and track your progress.",
    "",
    "— CreditRoute",
  ].join("\n");
}

async function fetchQaPdf({ stackKey }) {
  const params = new URLSearchParams({
    dev: "1",
    stackKey,
  });
  const pdfUrl = `${CUSTOMER_SITE_URL}/.netlify/functions/export-plan-pdf?${params.toString()}`;

  console.log("test-delivery-email fetching PDF attachment", {
    stackKey,
    pdfUrl,
  });

  const res = await fetch(pdfUrl, {
    method: "GET",
    headers: { Accept: "application/pdf" },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `export-plan-pdf failed (${res.status}): ${body.slice(0, 500)}`
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const pdfBuffer = Buffer.from(await res.arrayBuffer());

  console.log("test-delivery-email PDF attachment ready", {
    stackKey,
    bytes: pdfBuffer.length,
    contentType,
    filename: `CreditRoute-Plan-${stackKey}.pdf`,
  });

  return { pdfUrl, pdfBuffer };
}

export const handler = async (event) => {
  try {
    console.log("test-delivery-email triggered", {
      method: event.httpMethod,
      hasTestSecret: Boolean(process.env.TEST_DELIVERY_EMAIL_SECRET),
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasFromEmail: Boolean(process.env.RESEND_FROM_EMAIL),
      hasTestRecipient: Boolean(
        process.env.TEST_DELIVERY_EMAIL_TO || process.env.RESEND_TEST_EMAIL
      ),
    });

    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method Not Allowed" });
    }

    if (!process.env.TEST_DELIVERY_EMAIL_SECRET) {
      console.error("test-delivery-email disabled", {
        missing: "TEST_DELIVERY_EMAIL_SECRET",
      });
      return json(403, {
        ok: false,
        error: "test_delivery_email_disabled",
      });
    }

    const body = parseBody(event);
    const query = event.queryStringParameters || {};
    const providedSecret =
      getHeader(event.headers, "x-creditroute-test-secret") ||
      body.secret ||
      query.secret ||
      "";

    if (!safeEqual(providedSecret, process.env.TEST_DELIVERY_EMAIL_SECRET)) {
      console.warn("test-delivery-email unauthorized");
      return json(403, { ok: false, error: "unauthorized" });
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY. Test email was not sent.");
    }

    const configuredRecipient = String(
      process.env.TEST_DELIVERY_EMAIL_TO || process.env.RESEND_TEST_EMAIL || ""
    )
      .toLowerCase()
      .trim();
    const recipient = String(body.email || query.email || configuredRecipient)
      .toLowerCase()
      .trim();

    if (!recipient) {
      return json(400, {
        ok: false,
        error: "missing_test_recipient",
        detail:
          "Provide email in the request body or set TEST_DELIVERY_EMAIL_TO.",
      });
    }

    if (configuredRecipient && recipient !== configuredRecipient) {
      return json(403, {
        ok: false,
        error: "recipient_not_allowed",
      });
    }

    const requestedStackKey = String(body.stackKey || query.stackKey || "growth")
      .toLowerCase()
      .trim();
    const stackKey = ALLOWED_STACK_KEYS.has(requestedStackKey)
      ? requestedStackKey
      : "growth";
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    if (!process.env.RESEND_FROM_EMAIL) {
      console.warn(
        "RESEND_FROM_EMAIL missing. Falling back to onboarding@resend.dev."
      );
    }

    console.log("test-delivery-email send triggered", {
      recipient,
      subject: SUBJECT,
      from,
      stackKey,
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasFromEmail: Boolean(process.env.RESEND_FROM_EMAIL),
    });

    const { pdfUrl, pdfBuffer } = await fetchQaPdf({ stackKey });

    console.log("test-delivery-email calling Resend", {
      from,
      to: recipient,
      subject: SUBJECT,
      attachmentFilename: `CreditRoute-Plan-${stackKey}.pdf`,
      attachmentBytes: pdfBuffer.length,
    });

    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from,
      to: recipient,
      subject: SUBJECT,
      html: buildEmailHtml({ pdfUrl }),
      text: buildEmailText(),
      attachments: [
        {
          filename: `CreditRoute-Plan-${stackKey}.pdf`,
          content: pdfBuffer.toString("base64"),
          contentType: "application/pdf",
        },
      ],
    });

    console.log("test-delivery-email email send success", {
      recipient,
      subject: SUBJECT,
      result,
    });

    return json(200, {
      ok: true,
      recipient,
      subject: SUBJECT,
      stackKey,
      pdfBytes: pdfBuffer.length,
      pdfUrl,
      result,
    });
  } catch (err) {
    console.error("test-delivery-email failed", formatError(err));
    return json(err?.statusCode || 500, {
      ok: false,
      error: "test_delivery_email_failed",
      detail: err?.message || String(err),
    });
  }
};
