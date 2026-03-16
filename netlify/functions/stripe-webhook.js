import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const resend = new Resend(process.env.RESEND_API_KEY || "");

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
  return (
    process.env.SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://stackscore.ai"
  ).replace(/\/+$/, "");
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
  <h2 style="margin: 0 0 8px; font-size: 28px; line-height: 1.2;">
    Your StackScore Credit Route Is Ready
  </h2>

  <p style="margin: 0 0 16px;">
    Thank you for your purchase. Your personalized AI-generated Credit Route is now available.
   </p>

  <p style="margin: 0 0 8px;">
    <strong>Route selected:</strong> ${safePlanTitle}
  </p>

  <p style="margin: 0 0 18px;">
    You can access it in three ways:
  </p>

  <ol style="margin: 0 0 18px 20px; padding: 0;">
    <li style="margin: 0 0 8px;">Open your online Credit Route using the button below</li>
    <li style="margin: 0 0 8px;">Open the printable PDF attached to this email</li>
    <li style="margin: 0;">Print or save your route from inside the online guide</li>
  </ol>

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
          href="${safeSuccessUrl}"
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
          <span style="color:#ffffff; text-decoration:none;">Access My Credit Route</span>
        </a>
      </td>
    </tr>
  </table>
</div>

  <p style="margin: 0 0 12px; color:#4b5563; font-size:14px;">
    Your printable StackScore guide is attached to this email as a PDF.
  </p>

  <p style="margin: 0 0 12px; color:#4b5563; font-size:14px;">
    If you don’t see this email in your inbox, please check your junk or spam folder for messages from
    <strong>delivery@stackscore.ai</strong>.
  </p>

  <p style="margin: 0 0 18px; color:#4b5563; font-size:14px;">
    If your email app does not show attachments properly, you can use the fallback PDF link below to open or download your printable guide.
  </p>

  <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px; margin: 0 0 20px;">
    <p style="margin:0 0 8px; font-size:13px; color:#374151;">
      <strong>Direct guide link:</strong><br />
      <a href="${safeSuccessUrl}" style="color:#2563eb; word-break:break-all;">${safeSuccessUrl}</a>
    </p>

    <p style="margin:0; font-size:13px; color:#374151;">
      <strong>Fallback PDF link:</strong><br />
      <a href="${safePdfUrl}" style="color:#2563eb; word-break:break-all;">${safePdfUrl}</a>
    </p>
  </div>

  <p style="margin: 0 0 8px; color:#6b7280; font-size:13px;">
    Internal route key: <strong>${safeStackKey}</strong>
  </p>

  <p style="margin: 0 0 8px; color:#6b7280; font-size:13px;">
    For security, your guide access link may be time-limited. We recommend saving this email and downloading your PDF for future reference.
  </p>

  <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />

  <p style="margin: 0; font-size:13px; color:#6b7280;">
    If you have any trouble accessing your purchase, reply to this email for support.
  </p>
</div>
`;
}

function buildEmailText({ successUrl, pdfUrl, stackKey }) {
  const planTitle = titleForPlanKey(stackKey);

  return [
    "Your StackScore Credit Route Is Ready",
    "",
    "Thank you for your purchase. Your personalized AI-generated Credit Route is now available.",
    "",
    `Route selected: ${planTitle}`,
    "",
    "You can access it in three ways:",
    "1. Open your online Credit Route using the guide link below",
    "2. Open the printable PDF attached to this email",
    "3. Print or save your route from inside the online guide",
    "",
    `Access your guide: ${successUrl}`,
    `Fallback PDF link: ${pdfUrl}`,
    "",
    "Your printable StackScore guide is also attached to this email as a PDF.",
    "If you don’t see this email in your inbox, please check your junk or spam folder for messages from delivery@stackscore.ai.",
    "",
    "If you have any trouble accessing your purchase, reply to this email for support.",
  ].join("\n");
}

async function sendDeliveryEmail({ email, sessionId, stackKey }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing. Skipping email send.");
    return;
  }

  const site = getSiteUrl();
  const successUrl = buildSuccessUrl(site, sessionId, stackKey);
  const pdfUrl = buildPdfUrl(site, sessionId, stackKey);

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const subject = "Your StackScore Credit Route Is Ready";

  const planPayload = await fetchPlanPayload({ site, stackKey });
  const plans = normalizePlans(planPayload);

  const pdfBuffer = await fetchPdfAttachment({
    site,
    sessionId,
    stackKey,
    plans,
    answers: {},
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

  const result = await resend.emails.send({
    from,
    to: email,
    subject,
    html,
    text,
    attachments: [
      {
        filename: `StackScore-Plan-${stackKey}.pdf`,
        content: pdfBuffer.toString("base64"),
        contentType: "application/pdf",
      },
    ],
  });

  console.log("Resend result:", result);
  return result;
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return { statusCode: 500, body: "Missing STRIPE_WEBHOOK_SECRET" };
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return { statusCode: 500, body: "Missing STRIPE_SECRET_KEY" };
    }

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
      return {
        statusCode: 400,
        body: `Bad signature: ${String(err?.message || err)}`,
      };
    }

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

      console.log("Webhook purchase confirmed", {
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
          console.log("Delivery email sent", {
            email,
            sessionId,
            stackKey,
          });
        } catch (emailErr) {
          console.error("Failed to send delivery email:", emailErr);
        }
      } else {
        console.warn(
          "Skipping email send because email or sessionId is missing.",
          { email, sessionId }
        );
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("Webhook unhandled error:", err);
    return { statusCode: 500, body: String(err?.message || err) };
  }
};