import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const CUSTOMER_SITE_URL = "https://creditroute.com";
let resendClient;

function formatError(err) {
  return {
    name: err?.name || "Error",
    message: err?.message || String(err),
    stack: err?.stack || "",
    response: err?.response || err?.cause || null,
  };
}

function getHeader(headers, name) {
  if (!headers) return "";
  const lower = String(name || "").toLowerCase();

  for (const key of Object.keys(headers)) {
    if (String(key).toLowerCase() === lower) {
      return headers[key];
    }
  }

  return "";
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

function buildPdfUrl(site, sessionId, stackKey) {
  const params = new URLSearchParams({
    session_id: sessionId,
    planKey: stackKey,
  });

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

async function fetchPdfAttachment({ site, sessionId, stackKey, plans, answers }) {
  const res = await fetch(`${site}/.netlify/functions/export-plan-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/pdf",
    },
    body: JSON.stringify({
      session_id: sessionId,
      planKey: stackKey,
      answers: answers || {},
      plans: plans || [],
    }),
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

function buildEmailHtml({ successUrl, pdfUrl, stackKey }) {
  const safeSuccessUrl = escapeHtml(successUrl);
  const safePdfUrl = escapeHtml(pdfUrl);
  const safeStackKey = escapeHtml(stackKey);
  const safePlanTitle = escapeHtml(titleForPlanKey(stackKey));

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

function buildEmailText({ successUrl, pdfUrl, stackKey }) {
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
    "Estimated impact: +80–100 points over 45–60 days when the plan is fully executed (results vary by profile)",
    "",
    "If you ever need to revisit your plan, keep this PDF as your reference and execution checklist.",
    "",
    "Consistency is the key to results — follow the plan and track your progress.",
    "",
    "— CreditRoute",
  ].join("\n");
}

async function sendDeliveryEmail({ email, sessionId, stackKey }) {
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const subject = "Your Personalized CreditRoute Plan Is Ready";

  console.log("stripe-webhook email send triggered", {
    recipient: email,
    subject,
    from,
    sessionId,
    stackKey,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasFromEmail: Boolean(process.env.RESEND_FROM_EMAIL),
  });

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY. Delivery email was not sent.");
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn(
      "RESEND_FROM_EMAIL missing. Falling back to onboarding@resend.dev."
    );
  }

  const site = getSiteUrl();
  const successUrl = buildSuccessUrl(site, sessionId, stackKey);
  const pdfUrl = buildPdfUrl(site, sessionId, stackKey);

  console.log("stripe-webhook delivery urls prepared", {
    successUrl,
    pdfUrl,
  });

  console.log("stripe-webhook fetching plan payload", { stackKey });
  const planPayload = await fetchPlanPayload({ site, stackKey });
  const plans = normalizePlans(planPayload);
  console.log("stripe-webhook plan payload resolved", {
    stackKey,
    planCount: plans.length,
  });

  console.log("stripe-webhook fetching PDF attachment", {
    sessionId,
    stackKey,
  });
  const pdfBuffer = await fetchPdfAttachment({
    site,
    sessionId,
    stackKey,
    plans,
    answers: {},
  });
  console.log("stripe-webhook PDF attachment ready", {
    bytes: pdfBuffer.length,
    filename: `CreditRoute-Plan-${stackKey}.pdf`,
  });

  const html = buildEmailHtml({
    successUrl,
    pdfUrl,
    stackKey,
  });

  const text = buildEmailText({
    successUrl,
    pdfUrl,
    stackKey,
  });

  try {
    const payloadSummary = {
      from,
      to: email,
      subject,
      attachmentFilename: `CreditRoute-Plan-${stackKey}.pdf`,
      attachmentBytes: pdfBuffer.length,
    };

    console.log("stripe-webhook calling Resend", payloadSummary);

    const result = await getResendClient().emails.send({
      from,
      to: email,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `CreditRoute-Plan-${stackKey}.pdf`,
          content: pdfBuffer.toString("base64"),
          contentType: "application/pdf",
        },
      ],
    });

    console.log("stripe-webhook email send success", {
      recipient: email,
      subject,
      result,
    });

    return result;
  } catch (err) {
    console.error("stripe-webhook email send failure", {
      recipient: email,
      subject,
      error: formatError(err),
    });
    throw err;
  }
}

export const handler = async (event) => {
  try {
    console.log("stripe-webhook triggered", {
      method: event.httpMethod,
      hasStripeSignature: Boolean(getHeader(event.headers, "stripe-signature")),
      isBase64Encoded: Boolean(event.isBase64Encoded),
    });

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("stripe-webhook env missing", {
        missing: "STRIPE_WEBHOOK_SECRET",
      });
      return { statusCode: 500, body: "Missing STRIPE_WEBHOOK_SECRET" };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("stripe-webhook env missing", {
        missing: "STRIPE_SECRET_KEY",
      });
      return { statusCode: 500, body: "Missing STRIPE_SECRET_KEY" };
    }

    console.log("stripe-webhook env check", {
      hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
      hasStripeWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasFromEmail: Boolean(process.env.RESEND_FROM_EMAIL),
      resendFromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    });

    const sig = getHeader(event.headers, "stripe-signature");
    if (!sig) {
      return { statusCode: 400, body: "Missing stripe-signature header" };
    }

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "";

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("stripe-webhook signature failure", formatError(err));
      return {
        statusCode: 400,
        body: `Bad signature: ${String(err?.message || err)}`,
      };
    }

    console.log("stripe-webhook event parsed", {
      id: stripeEvent.id,
      type: stripeEvent.type,
      livemode: stripeEvent.livemode,
    });

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const email =
        session?.customer_details?.email ||
        session?.customer_email ||
        session?.metadata?.email ||
        "";

      const stackKey = String(
        session?.metadata?.stackKey ||
          session?.metadata?.stack_key ||
          session?.metadata?.planKey ||
          "growth"
      )
        .toLowerCase()
        .trim();

      const sessionId = String(session?.id || "").trim();

      console.log("stripe-webhook checkout.session.completed", {
        email,
        stackKey,
        sessionId,
        payment_status: session?.payment_status,
      });

      if (session?.payment_status !== "paid") {
        console.warn(
          "checkout.session.completed received but payment_status is not paid",
          {
            sessionId,
            payment_status: session?.payment_status,
          }
        );
      }

      if (email && sessionId) {
        try {
          await sendDeliveryEmail({ email, sessionId, stackKey });
          console.log("stripe-webhook delivery email completed", {
            email,
            sessionId,
            stackKey,
          });
        } catch (emailErr) {
          console.error("stripe-webhook delivery email failed", {
            email,
            sessionId,
            stackKey,
            error: formatError(emailErr),
          });
          return {
            statusCode: 500,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              ok: false,
              error: "delivery_email_failed",
              detail: emailErr?.message || String(emailErr),
            }),
          };
        }
      } else {
        console.warn(
          "Skipping email send because email or sessionId is missing.",
          { email, sessionId }
        );
      }
    }

    console.log("stripe-webhook completed", {
      eventId: stripeEvent.id,
      eventType: stripeEvent.type,
    });

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("Webhook unhandled error:", formatError(err));
    return { statusCode: 500, body: String(err?.message || err) };
  }
};
