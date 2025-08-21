// api/plan/export.js
export const config = { runtime: "nodejs" };

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const found = raw.split(";").map(s => s.trim()).find(s => s.startsWith(name + "="));
  return found ? decodeURIComponent(found.split("=").slice(1).join("=")) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Lazy-load Xata inside the handler (prevents module-load crashes)
    const { getXataClient } = await import("../../src/xata.js");
    const xata = getXataClient();

    const cookieEmail = readCookie(req, "ss_email");
    const bodyEmail =
      (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}).email || null;
    const email = cookieEmail || bodyEmail;
    if (!email) return res.status(401).json({ error: "Unauthorized: missing email" });

    let entitlement = null;
    try {
      entitlement = await xata.db.entitlements.read(email);
    } catch {}
    if (!entitlement) {
      entitlement = await xata.db.entitlements.filter({ email }).getFirst();
    }
    if (!entitlement || entitlement.hasAccess !== true) {
      return res.status(402).json({ error: "Payment required" });
    }

    // Minimal PDF demo; replace with your real generator
    const buf = Buffer.from("%PDF-1.4\n%… minimal demo …\n%%EOF");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="StackScore-Plan.pdf"');
    res.setHeader("Content-Length", String(buf.length));
    res.status(200).end(buf);
  } catch (e) {
    console.error("export error:", e?.message || e);
    res.status(500).json({ error: "export_failed" });
  }
}
