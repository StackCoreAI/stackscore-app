// api/plan/export.js
export const config = { runtime: "nodejs" };

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function safeJson(body) {
  try { return typeof body === "string" ? JSON.parse(body || "{}") : (body || {}); }
  catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ss_access, planKey = "growth", answers = {}, plans = [] } = safeJson(req.body);

    // Require the same access flag ThankYou sets after checkout/verify
    if (ss_access !== "1") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Build PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]); // Letter
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const draw = (text, x, y, size = 12, useBold = false) =>
      page.drawText(String(text ?? ""), { x, y, size, font: useBold ? bold : font, color: rgb(0,0,0) });

    // Header
    page.drawRectangle({ x: 0, y: 742, width: 612, height: 50, color: rgb(0.1,0.1,0.1) });
    draw("StackScore — Optimized Stack Plan", 32, 760, 18, true);
    draw(`Selected Plan: ${String(planKey).toUpperCase()}`, 32, 742 - 14, 10);

    // Answers
    let y = 700;
    draw("Your Answers", 32, y, 14, true); y -= 18;
    const subs = Array.isArray(answers.subs) ? answers.subs.join(", ") : (answers.subs ?? "—");
    const lines = [
      `Housing: ${answers.housing ?? "—"}`,
      `Subscriptions: ${subs || "—"}`,
      `Tools: ${answers.tools ?? "—"}`,
      `Employment: ${answers.employment ?? "—"}`,
      `Goal: ${answers.goal ?? "—"}`,
      `Budget: $${answers.budget ?? "—"}/mo`,
    ];
    for (const line of lines) { draw(`• ${line}`, 40, y); y -= 16; }

    // Apps
    y -= 10;
    draw("Recommended Apps", 32, y, 14, true); y -= 18;
    const appList = Array.isArray(plans) ? plans : (plans?.[planKey]?.apps || plans?.apps || []);
    (appList || []).slice(0, 20).forEach((app, i) => {
      const name = app?.app_name || app?.name || `App ${i+1}`;
      const note = app?.reason || app?.why || app?.category || "";
      draw(`• ${name}${note ? ` — ${note}` : ""}`, 40, y);
      y -= 16;
    });

    const bytes = await pdf.save();
    const filename = `StackScore-Plan-${String(planKey).toUpperCase()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).end(Buffer.from(bytes));
  } catch (e) {
    console.error("export error:", e);
    return res.status(500).json({ error: "export_failed", detail: e?.message || String(e) });
  }
}
