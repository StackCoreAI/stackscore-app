import Stripe from "stripe";
import {
  formatDeliveryError as formatError,
  sendCreditRouteDeliveryEmail,
} from "../../server/lib/creditrouteDeliveryEmail.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

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
          await sendCreditRouteDeliveryEmail({
            email,
            sessionId,
            stackKey,
            logPrefix: "stripe-webhook",
          });
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
