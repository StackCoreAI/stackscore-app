// server/lib/shortio.js
import fetch from "node-fetch";

/**
 * createShortLink({ title, longUrl, expiresAt? })
 * Requires env: SHORTIO_API_KEY, SHORTIO_DOMAIN (e.g. "ss.jxpx.io")
 */
export async function createShortLink({ title, longUrl, expiresAt }) {
  const apiKey = process.env.SHORTIO_API_KEY;
  const domain = process.env.SHORTIO_DOMAIN; // your Short.io domain
  if (!apiKey || !domain) throw new Error("Short.io env not configured");

  const body = {
    domain, originalURL: longUrl, title: title?.slice(0, 120) || "StackScore Access",
    expire_at: expiresAt || null, // ISO string or null
    redirectType: 302,
  };

  const resp = await fetch("https://api.short.io/links", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: apiKey },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Short.io error ${resp.status}: ${text}`);
  }
  return resp.json(); // { shortURL, ... }
}
