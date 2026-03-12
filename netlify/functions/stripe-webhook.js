import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const resend = new Resend(process.env.RESEND_API_KEY || "");

function getHeader(headers, name) {
  if (!headers) return "";
  const lower = name.toLowerCase();
  return headers[lower] || headers[name] || "";
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
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error || `export-plan-pdf failed (${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function sendDeliveryEmail({ email, sessionId, stackKey }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing. Skipping email send.");
    return;
  }

  const site =
    process.env.SITE_URL ||
    process.env.URL ||
    "https://stackscore.ai";

  const successUrl = `${site}/success?session_id=${encodeURIComponent(sessionId)}`;

  const from =
    process.env.RESEND_FROM_EMAIL ||
    "onboarding@resend.dev";

  const subject = "Your StackScore Credit Route Is Ready";

  const planPayload = await fetchPlanPayload({ site, stackKey });
  const plans = Array.isArray(planPayload?.plans)
    ? planPayload.plans
    : Array.isArray(planPayload?.apps)
      ? [{ apps: planPayload.apps }]
      : planPayload?.plan
        ? [planPayload.plan]
        : [];

  const pdfBuffer = await fetchPdfAttachment({
    site,
    sessionId,
    stackKey,
    plans,
    answers: {},
  });

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto;">
      <h2 style="margin-bottom: 8px;">Your StackScore Credit Route Is Ready</h2>

      <p style="margin-top: 0;">
        Thank you for your purchase. Your personalized AI-generated Credit Route is now available.
      </p>

      <p>
        <a
          href="${successUrl}"
          style="display:inline-block;padding:12px 18px;background:#84cc16;color:#111827;text-decoration:none;border-radius:10px;font-weight:700;"
        >
          Access My Credit Route
        </a>
      </p>

      <p style="color:#4b5563;font-size:14px;">
        Your printable StackScore guide is attached to this email as a PDF.
      </p>

      <p style="color:#4b5563;font-size:14px;">
        For security, this access link expires in 24 hours. We recommend bookmarking or downloading your guide for future access.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

      <p style="font-size:13px;color:#6b7280;">
        Route selected: <strong>${stackKey}</strong>
      </p>

      <p style="font-size:13px;color:#6b7280;">
        If you have any trouble accessing your purchase, please contact support.
      </p>
    </div>
  `;

  const result = await resend.emails.send({
    from,
    to: email,
    subject,
    html,
    attachments: [
      {
        filename: `StackScore-Plan-${stackKey}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });

  console.log("Resend result:", result);
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
      : (event.body || "");

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
      ).toLowerCase().trim();

      const sessionId = String(session?.id || "").trim();

      console.log("Webhook purchase confirmed", {
        email,
        stackKey,
        sessionId,
      });

      if (email && sessionId) {
        try {
          await sendDeliveryEmail({ email, sessionId, stackKey });
          console.log("Backup delivery email sent", {
            email,
            sessionId,
            stackKey,
          });
        } catch (emailErr) {
          console.error("Failed to send backup delivery email:", emailErr);
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