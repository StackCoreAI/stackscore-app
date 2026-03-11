import crypto from "crypto";

function sign(data, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(s = "") {
  const normalized = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export const handler = async (event) => {
  try {
    const token =
      event.queryStringParameters?.t ||
      JSON.parse(event.body || "{}")?.t ||
      "";

    const requestedStackKey = String(
      event.queryStringParameters?.stackKey ||
      JSON.parse(event.body || "{}")?.stackKey ||
      ""
    ).toLowerCase();

    if (!process.env.GUIDE_TOKEN_SECRET) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing GUIDE_TOKEN_SECRET" }),
      };
    }

    if (!token || !token.includes(".")) {
      return {
        statusCode: 401,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify({ ok: false, error: "Missing or invalid token" }),
      };
    }

    const [encoded, signature] = token.split(".");
    const expected = sign(encoded, process.env.GUIDE_TOKEN_SECRET);

    if (signature !== expected) {
      return {
        statusCode: 401,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify({ ok: false, error: "Bad signature" }),
      };
    }

    const payload = JSON.parse(b64urlDecode(encoded));
    const now = Math.floor(Date.now() / 1000);

    if (!payload?.exp || now > payload.exp) {
      return {
        statusCode: 401,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify({ ok: false, error: "Token expired" }),
      };
    }

    if (
      requestedStackKey &&
      payload?.stackKey &&
      String(payload.stackKey).toLowerCase() !== requestedStackKey
    ) {
      return {
        statusCode: 401,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify({ ok: false, error: "Stack mismatch" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({
        ok: true,
        stackKey: payload.stackKey,
        exp: payload.exp,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ ok: false, error: String(err?.message || err) }),
    };
  }
};