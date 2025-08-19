import { getXataClient } from "../../src/xata.js";

const xata = getXataClient();

async function getEntitlementByEmail(email) {
  try {
    const rec = await xata.db.entitlements.read(email);
    if (rec) return rec;
  } catch {}
  return xata.db.entitlements.filter({ email }).getFirst();
}

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const found = raw.split(";").map(s => s.trim()).find(s => s.startsWith(name + "="));
  return found ? decodeURIComponent(found.split("=").slice(1).join("=")) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const cookieEmail = readCookie(req, "ss_email");
    const bodyEmail = (req.body && req.body.email) || null;
    const email = cookieEmail || bodyEmail;

    if (!email) return res.status(401).json({ error: "Unauthorized: missing email" });

    const entitlement = await getEntitlementByEmail(email);
    if (!entitlement || entitlement.hasAccess !== true)
      return res.status(402).json({ error: "Payment required" });

    // Stream a minimal PDF (swap with your real generator)
    const buf = Buffer.from("%PDF-1.4\n%… minimal demo …\n%%EOF");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="StackScore-Plan.pdf"');
    res.status(200).end(buf);
  } catch (e) {
    console.error("export error:", e);
    res.status(500).json({ error: "export_failed" });
  }
}
