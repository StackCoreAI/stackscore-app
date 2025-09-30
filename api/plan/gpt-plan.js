// api/plan/gpt-plan.js
export const config = { runtime: "nodejs" };

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ⬇️ Paste your real values from the Playground “Your prompt was published” modal
const PROMPT_ID = "pmp_XXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const PROMPT_VERSION = "1";

export default async function handler(req, res) {
  console.log("➡️ /api/plan/gpt-plan invoked");

  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Accept JSON body or JSON string
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const {
      current_score,
      monthly_budget_usd,
      goals = [],
      preferences = {},
      profile = {}
    } = body;

    // Call your published prompt (stable, versioned)
    const resp = await client.responses.create({
      model: "gpt-5",
      prompt: { id: PROMPT_ID, version: PROMPT_VERSION },
      input: { current_score, monthly_budget_usd, goals, preferences, profile }
    });

    // Our system prompt guarantees strict JSON
    const text = resp.output_text; // string
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // If anything ever drifts, surface a helpful 502 with a sample
      return res.status(502).json({
        error: "Upstream returned non-JSON",
        sample: text?.slice(0, 600)
      });
    }

    return res.status(200).json(json);
  } catch (err) {
    console.error("❌ /api/plan/gpt-plan error:", err?.message || err);
    return res.status(500).json({ error: "gpt-plan failed" });
  }
}
