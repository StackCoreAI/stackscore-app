import crypto from "crypto";

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

function safeParse(value, fallback = {}) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value || fallback;
  } catch {
    return fallback;
  }
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

export const handler = async (event) => {
  try {
    if (!process.env.GUIDE_TOKEN_SECRET) {
      return json(500, {
        ok: false,
        error: "Missing GUIDE_TOKEN_SECRET",
      });
    }

    const method = String(event.httpMethod || "GET").toUpperCase();
    if (method !== "GET" && method !== "POST") {
      return json(405, {
        ok: false,
        error: "Method Not Allowed",
      });
    }

    const body = method === "POST" ? safeParse(event.body || "{}", {}) : {};
    const query = event.queryStringParameters || {};

    const token = String(
      body.t ||
        body.token ||
        query.t ||
        query.token ||
        ""
    ).trim();

    const requestedStackKey = String(
      body.stackKey ||
        body.planKey ||
        query.stackKey ||
        query.planKey ||
        ""
    )
      .toLowerCase()
      .trim();

    if (!token || !token.includes(".")) {
      return json(401, {
        ok: false,
        error: "Missing or invalid token",
      });
    }

    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) {
      return json(401, {
        ok: false,
        error: "Malformed token",
      });
    }

    const expected = sign(encoded, process.env.GUIDE_TOKEN_SECRET);

    if (signature !== expected) {
      return json(401, {
        ok: false,
        error: "Bad signature",
      });
    }

    let payload;
    try {
      payload = JSON.parse(b64urlDecode(encoded));
    } catch {
      return json(401, {
        ok: false,
        error: "Invalid token payload",
      });
    }

    const now = Math.floor(Date.now() / 1000);

    if (!payload?.exp || now > payload.exp) {
      return json(401, {
        ok: false,
        error: "Token expired",
      });
    }

    if (
      requestedStackKey &&
      payload?.stackKey &&
      String(payload.stackKey).toLowerCase().trim() !== requestedStackKey
    ) {
      return json(401, {
        ok: false,
        error: "Stack mismatch",
      });
    }

    return json(200, {
      ok: true,
      stackKey: String(payload?.stackKey || "").toLowerCase().trim(),
      exp: payload?.exp || 0,
      iat: payload?.iat || 0,
      session_id: payload?.sid || "",
    });
  } catch (err) {
    console.error("verify-guide-token error:", err);
    return json(500, {
      ok: false,
      error: String(err?.message || err),
    });
  }
};