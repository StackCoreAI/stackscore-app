// api/plan/gpt-plan.js
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  console.log("➡️ /api/plan/gpt-plan invoked");
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    const plans = {
      A: { name: "Accelerator", apps: ["Dovly AI", "Experian Boost"], monthly: 25 },
      B: { name: "Balanced",    apps: ["Self Credit Builder", "Kikoff"], monthly: 20 },
      C: { name: "Budget",      apps: ["Grow Credit (Free)"],           monthly: 0 }
    };
    return res.status(200).json({ ok: true, plans });
  } catch (err) {
    console.error("❌ /api/plan/gpt-plan stub error:", err?.message || err);
    return res.status(500).json({ error: "API 500" });
  }
}
