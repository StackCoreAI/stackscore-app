// netlify/functions/preview-copy.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { answers } = JSON.parse(event.body || "{}");
    if (!answers || typeof answers !== "object") {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing answers" }),
      };
    }

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const system = `
You write short, premium product copy for a credit-stacking app.
Return ONLY valid JSON (no markdown).
We need personalized PREVIEW copy ONLY (no app names).
For each stack: foundation, growth, accelerator, elite:
- narrative: 1–2 sentences max
- unlockBullets: exactly 3 bullets, short, concrete outcomes (no app names)
Use only the user's answers: living, budget, timeline, employment, rent_backdate.
Avoid extra numbers (time/impact is shown elsewhere).
`.trim();

    const user = `
User answers (no PII):
${JSON.stringify(answers, null, 2)}

Return JSON shape EXACTLY:
{
  "foundation": { "narrative": "...", "unlockBullets": ["...", "...", "..."] },
  "growth": { "narrative": "...", "unlockBullets": ["...", "...", "..."] },
  "accelerator": { "narrative": "...", "unlockBullets": ["...", "...", "..."] },
  "elite": { "narrative": "...", "unlockBullets": ["...", "...", "..."] }
}
`.trim();

    const resp = await client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const text = resp.choices?.[0]?.message?.content || "{}";
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = {};
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(json),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
};