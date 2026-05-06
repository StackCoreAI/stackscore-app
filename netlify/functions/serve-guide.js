import crypto from "crypto";
import fs from "node:fs/promises";
import path from "node:path";
import Stripe from "stripe";

const GUIDE_ID = "82";

let stripeClient;

const securityHeaders = {
  "content-security-policy":
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-src 'self' https://js.stripe.com https://checkout.stripe.com; form-action 'self' https://checkout.stripe.com; manifest-src 'self'; worker-src 'self'; upgrade-insecure-requests",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "strict-transport-security": "max-age=31536000",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy":
    "accelerometer=(), bluetooth=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
};

const noStoreHeaders = {
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
  pragma: "no-cache",
};

function response(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      ...securityHeaders,
      ...noStoreHeaders,
      ...headers,
    },
    body,
  };
}

function redirect(location, statusCode = 302) {
  return response(statusCode, "", { location });
}

function sign(data, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(value = "") {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function tokenTail(token = "") {
  return String(token || "").slice(-8);
}

function logGuideRejection(reason, details = {}) {
  console.warn("serve-guide rejected:", {
    reason,
    ...details,
  });
}

function normalizeStackKey(value = "", fallback = "") {
  return String(value || "").toLowerCase().trim() || fallback;
}

function verifyGuideToken({ token, requestedStackKey }) {
  if (!process.env.GUIDE_TOKEN_SECRET) {
    throw new Error("Missing GUIDE_TOKEN_SECRET");
  }

  if (!token || !token.includes(".")) {
    return { ok: false, reason: "missing_or_invalid_token" };
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return { ok: false, reason: "malformed_token" };
  }

  const expected = sign(encoded, process.env.GUIDE_TOKEN_SECRET);
  if (signature !== expected) {
    return {
      ok: false,
      reason: "bad_signature",
      tokenTail: tokenTail(token),
    };
  }

  let payload;
  try {
    payload = JSON.parse(b64urlDecode(encoded));
  } catch {
    return {
      ok: false,
      reason: "invalid_payload",
      tokenTail: tokenTail(token),
    };
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload?.exp || now > payload.exp) {
    return {
      ok: false,
      reason: "token_expired",
      tokenTail: tokenTail(token),
      exp: payload?.exp || 0,
      now,
    };
  }

  const tokenStackKey = normalizeStackKey(payload?.stackKey, "growth");
  if (requestedStackKey && tokenStackKey !== requestedStackKey) {
    return {
      ok: false,
      reason: "stack_mismatch",
      tokenTail: tokenTail(token),
      tokenStackKey,
    };
  }

  return {
    ok: true,
    stackKey: tokenStackKey,
    session_id: payload?.sid || "",
  };
}

async function verifyPaidSession(sessionId) {
  if (!sessionId) return null;

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripeClient ||= new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });

  const session = await stripeClient.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return null;

  return session;
}

async function loadGuideHtml() {
  const candidates = [
    path.join(process.cwd(), "public/guides/82.html"),
    path.join(process.env.LAMBDA_TASK_ROOT || "", "public/guides/82.html"),
    "/var/task/public/guides/82.html",
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return await fs.readFile(candidate, "utf8");
    } catch {}
  }

  throw new Error("Guide HTML not found");
}

function resolveRequestedGuideId(event) {
  const query = event.queryStringParameters || {};
  const pathValue = String(event.path || "");
  const routeId = /\/(?:guides|guide)\/(\d+)(?:\.html)?$/i.exec(pathValue)?.[1];

  return String(query.id || query.guide || routeId || GUIDE_ID).trim();
}

export const handler = async (event) => {
  try {
    const method = String(event.httpMethod || "GET").toUpperCase();
    if (method !== "GET") {
      return response(405, "Method Not Allowed", {
        "content-type": "text/plain; charset=utf-8",
      });
    }

    const requestedGuideId = resolveRequestedGuideId(event);
    if (requestedGuideId !== GUIDE_ID) {
      logGuideRejection("unsupported_guide", { requestedGuideId });
      return redirect("/activate");
    }

    const query = event.queryStringParameters || {};
    const token = String(query.t || query.token || "").trim();
    const requestedStackKey = normalizeStackKey(query.stackKey || query.planKey);
    const sessionId = String(query.session_id || query.sessionId || "").trim();

    if (token) {
      const tokenResult = verifyGuideToken({
        token,
        requestedStackKey,
      });

      if (tokenResult.ok) {
        const html = await loadGuideHtml();
        return response(200, html, {
          "content-type": "text/html; charset=UTF-8",
        });
      }

      logGuideRejection(tokenResult.reason, {
        requestedStackKey,
        tokenTail: tokenResult.tokenTail,
      });
    }

    const paidSession = await verifyPaidSession(sessionId).catch((err) => {
      logGuideRejection("stripe_session_check_failed", {
        error: String(err?.message || err),
        hasSessionId: Boolean(sessionId),
      });
      return null;
    });

    if (paidSession) {
      const stackKey = normalizeStackKey(
        requestedStackKey ||
          paidSession.metadata?.stackKey ||
          paidSession.metadata?.stack_key ||
          paidSession.metadata?.planKey,
        "growth"
      );
      const params = new URLSearchParams({
        session_id: paidSession.id || sessionId,
        stackKey,
      });

      return redirect(`/success?${params.toString()}`);
    }

    logGuideRejection("missing_valid_access", {
      requestedStackKey,
      hasToken: Boolean(token),
      hasSessionId: Boolean(sessionId),
    });

    return redirect("/activate");
  } catch (err) {
    console.error("serve-guide error:", err);
    return response(500, "Guide access error", {
      "content-type": "text/plain; charset=utf-8",
    });
  }
};
