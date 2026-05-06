import { timingSafeEqual } from "node:crypto";
import {
  formatDeliveryError,
  sendCreditRouteDeliveryEmail,
} from "../../server/lib/creditrouteDeliveryEmail.js";

const DEV_QA_STACK_KEYS = new Set(["foundation", "growth", "accelerator"]);
const SITE_OWNER_TEST_EMAIL = "resolve@stackscore.ai";

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

function configuredTestRecipient() {
  return String(
    process.env.TEST_DELIVERY_EMAIL ||
      process.env.TEST_DELIVERY_EMAIL_TO ||
      process.env.RESEND_TEST_EMAIL ||
      ""
  )
    .toLowerCase()
    .trim();
}

function resolveTestRecipient({ body, query }) {
  const configuredRecipient = configuredTestRecipient();
  const fallbackRecipient = configuredRecipient || SITE_OWNER_TEST_EMAIL;
  const requestedRecipient = String(body.email || query.email || "")
    .toLowerCase()
    .trim();
  const recipient = requestedRecipient || fallbackRecipient;

  if (!recipient) {
    return {
      error: json(400, {
        ok: false,
        error: "missing_test_recipient",
        detail:
          "Set TEST_DELIVERY_EMAIL, TEST_DELIVERY_EMAIL_TO, or RESEND_TEST_EMAIL.",
      }),
    };
  }

  if (requestedRecipient && requestedRecipient !== fallbackRecipient) {
    return {
      error: json(403, {
        ok: false,
        error: "recipient_not_allowed",
        detail:
          "The test endpoint only sends to the configured test recipient.",
      }),
    };
  }

  return {
    recipient,
    source: configuredRecipient ? "env" : "site_owner_fallback",
  };
}

function resolveStackKey({ body, query }) {
  const requestedStackKey = String(body.stackKey || query.stackKey || "growth")
    .toLowerCase()
    .trim();

  return DEV_QA_STACK_KEYS.has(requestedStackKey) ? requestedStackKey : "growth";
}

export const handler = async (event) => {
  try {
    const method = String(event.httpMethod || "").toUpperCase();
    const isJsonBody =
      method === "POST" || method === "PUT" || method === "PATCH";

    console.log("test-delivery-email triggered", {
      method,
      hasTestSecret: Boolean(process.env.TEST_DELIVERY_EMAIL_SECRET),
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasFromEmail: Boolean(process.env.RESEND_FROM_EMAIL),
      hasTestRecipient: Boolean(configuredTestRecipient()),
      hasSiteOwnerFallback: Boolean(SITE_OWNER_TEST_EMAIL),
    });

    if (method !== "GET" && method !== "POST") {
      return json(405, { ok: false, error: "Method Not Allowed" });
    }

    if (!process.env.TEST_DELIVERY_EMAIL_SECRET) {
      console.error("test-delivery-email disabled", {
        missing: "TEST_DELIVERY_EMAIL_SECRET",
      });
      return json(403, {
        ok: false,
        error: "test_delivery_email_disabled",
        detail: "Set TEST_DELIVERY_EMAIL_SECRET to enable this endpoint.",
      });
    }

    const body = isJsonBody ? parseBody(event) : {};
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

    const recipientResult = resolveTestRecipient({ body, query });
    if (recipientResult.error) return recipientResult.error;

    const stackKey = resolveStackKey({ body, query });

    console.log("test-delivery-email send requested", {
      recipient: recipientResult.recipient,
      recipientSource: recipientResult.source,
      stackKey,
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasFromEmail: Boolean(process.env.RESEND_FROM_EMAIL),
    });

    const result = await sendCreditRouteDeliveryEmail({
      email: recipientResult.recipient,
      stackKey,
      devPdf: true,
      logPrefix: "test-delivery-email",
    });

    return json(200, {
      ok: true,
      message: "Test delivery email sent",
      to: result.to,
      resendId: result.resendId,
      stackKey: result.stackKey,
      pdfBytes: result.pdfBytes,
    });
  } catch (err) {
    console.error("test-delivery-email failed", formatDeliveryError(err));
    return json(err?.statusCode || 500, {
      ok: false,
      error: "test_delivery_email_failed",
      detail: err?.message || String(err),
    });
  }
};
