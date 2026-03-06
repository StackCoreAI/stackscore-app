var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/preview-copy.js
var preview_copy_exports = {};
__export(preview_copy_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(preview_copy_exports);
var import_openai = __toESM(require("openai"), 1);
var client = new import_openai.default({ apiKey: process.env.OPENAI_API_KEY });
var handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const { answers } = JSON.parse(event.body || "{}");
    if (!answers || typeof answers !== "object") {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Missing answers" })
      };
    }
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const system = `
You write short, premium product copy for a credit-stacking app.
Return ONLY valid JSON (no markdown).
We need personalized PREVIEW copy ONLY (no app names).
For each stack: foundation, growth, accelerator, elite:
- narrative: 1\u20132 sentences max
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
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" }
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
      body: JSON.stringify(json)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=preview-copy.js.map
