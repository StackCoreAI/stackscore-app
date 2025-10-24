// netlify/functions/generate-plan.js
// Personalized plan composer (no PII). Accepts POST { stackKey, answers } or GET ?stackKey=...
// netlify/functions/generate-plan.js
import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const HAS_KEY = !!process.env.OPENAI_API_KEY;
const client = HAS_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/* ---------- Deterministic fallback catalog + scorer ---------- */
function app(name, url, features, meta){ return { app_name:name, app_url:url, features, ...meta }; }

const CATALOG = [
  app("Experian Boost","https://www.experian.com/boost",["Utilities reporting","Streaming bills count"],{tags:["utilities","instant","free"],cost:0}),
  app("Grow Credit","https://www.growcredit.com",["Stream/Subscriptions builder"],{tags:["subscriptions","utilities","low-cost"],cost:0}),
  app("Grain Utility Builder","https://www.grain.com",["Utility tradeline"],{tags:["utilities","tradeline"],cost:10}),
  app("BoomPay Rent","https://www.boompay.app",["Monthly + backdate"],{tags:["rent","backdate"],cost:4}),
  app("RentReporters","https://www.rentreporters.com",["Verify landlord","Backdate eligible"],{tags:["rent","backdate","manual"],cost:10}),
  app("Piñata","https://www.pinata.ai",["Rewards + rent reporting"],{tags:["rent","rewards"],cost:0}),
  app("Kikoff","https://www.kikoff.com",["Credit account","Low utilization"],{tags:["installment","low-cost","fast"],cost:5}),
  app("Self","https://www.self.inc",["Credit Builder Loan"],{tags:["installment","bank-link"],cost:25}),
  app("Kovo","https://www.kovo.com",["Installment trade"],{tags:["installment","purchase"],cost:10}),
  app("Dovly","https://www.dovly.com",["Automated disputes"],{tags:["dispute","automation"],cost:0}),
  app("DisputeBee","https://disputebee.com",["DIY letters"],{tags:["dispute","manual"],cost:20}),
  app("TomoCard Secured","https://www.tomocredit.com",["Secured tradeline"],{tags:["tradeline","secured"],cost:0}),
  app("Extra Debit","https://www.extra.app",["Debit-to-credit"],{tags:["tradeline","debit"],cost:20}),
];

function scoreApp(a, answers, stackKey){
  const tags = new Set(a.tags || []); let s = 0;
  const tl = (answers.timeline || "").toLowerCase();
  if (tl.includes("fast") && (tags.has("utilities") || tags.has("instant"))) s += 3;
  if (tl.includes("steady") && tags.has("installment")) s += 2;
  if (tl.includes("aggressive") && (tags.has("dispute") || tags.has("installment") || tags.has("tradeline"))) s += 2;

  const lv = (answers.living || "").toLowerCase();
  if (lv.includes("rent") && tags.has("rent")) s += 3;
  if (lv.includes("own")  && tags.has("utilities")) s += 2;

  const bdg = (answers.budget || "").toLowerCase();
  if (bdg.includes("$0") || bdg.includes("free") || bdg.includes("0")) s += (a.cost <= 5 ? 3 : (a.cost <= 10 ? 2 : 0));
  else if (bdg.includes("10")) s += (a.cost <= 15 ? 2 : 0);
  else s += 1;

  const emp = (answers.employment || "").toLowerCase();
  if (emp.includes("self")) { if (tags.has("utilities") || tags.has("installment")) s += 1; }
  if (emp.includes("w2") || emp.includes("employ")) s += 1;

  if ((answers.rent_backdate || "").toLowerCase().includes("yes") && tags.has("backdate")) s += 2;

  if (stackKey === "foundation") { if (tags.has("utilities")) s += 2; if (tags.has("installment")) s += 1; }
  if (stackKey === "growth")     { if (tags.has("installment") || tags.has("rent")) s += 2; }
  if (stackKey === "accelerator"){ if (tags.has("dispute") || tags.has("installment")) s += 2; }
  if (stackKey === "elite")      { if (tags.has("dispute") || tags.has("tradeline")) s += 2; }

  return s;
}

function pickApps(answers, stackKey){
  const ranked = CATALOG.map(a => ({ a, score: scoreApp(a, answers, stackKey) }))
                        .sort((x,y) => y.score - x.score);
  const want = (()=>{
    if (stackKey==="foundation") return ["utilities","installment","rent"];
    if (stackKey==="growth")     return ["installment","rent","utilities"];
    if (stackKey==="accelerator")return ["dispute","installment","utilities"];
    if (stackKey==="elite")      return ["dispute","tradeline","installment"];
    return ["utilities","installment","rent"];
  })();

  const seen=new Set(), chosen=[];
  for (const cat of want) {
    const hit = ranked.find(r => !seen.has(r.a.app_name) && (r.a.tags||[]).includes(cat));
    if (hit){ chosen.push(hit.a); seen.add(hit.a.app_name); }
  }
  for (const r of ranked) { if (chosen.length>=5) break; if (!seen.has(r.a.app_name)) { chosen.push(r.a); seen.add(r.a.app_name);} }
  return chosen.slice(0, Math.max(3, Math.min(5, chosen.length)));
}

/* ---------- GPT composer (structured JSON) ---------- */
const JSON_SCHEMA = {
  name: "stack_plan",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      apps: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name","website","features"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 60 },
            website: { type: "string", minLength: 8, maxLength: 200 },
            features: {
              type: "array", minItems: 1, maxItems: 5,
              items: { type: "string", minLength: 2, maxLength: 120 }
            }
          }
        }
      },
      reasoning: { type: "string" }
    },
    required: ["apps"]
  }
};

async function gptPlan(stackKey, answers) {
  if (!HAS_KEY) throw new Error("no_openai_key");
  const sys = `You are an expert credit-building coach for US consumers.
Return ONLY JSON matching the schema. 3–5 apps that best fit the user and stack.
Stacks:
- foundation: low friction + instant impact + basic builders
- growth: installment depth + rent reporting
- accelerator: add dispute automation + momentum
- elite: dispute + tradelines + best-in-class builders
Rules: real products with correct URLs; tailor to timeline, living, budget, employment, rent backdate; prefer low cost if budget tight; include concise features to activate.`;

  const user = {
    stackKey,
    answers: {
      living: answers.living || "",
      budget: answers.budget || "",
      timeline: answers.timeline || "",
      employment: answers.employment || "",
      rent_backdate: answers.rent_backdate || ""
    }
  };

  const resp = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 600,
    response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify(user) }
    ],
    timeout: 15_000
  });

  const raw = resp.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);
  const apps = (parsed?.apps || []).map(a => ({
    app_name: a.name, app_url: a.website, features: a.features || []
  })).slice(0, 5);

  if (apps.length < 3) throw new Error("insufficient_apps");
  return { meta: { stackKey, personalized: true, model: MODEL, source: "gpt" }, apps, reasoning: parsed?.reasoning || "" };
}

/* ---------- Handler ---------- */
export const handler = async (event) => {
  try {
    let stackKey = "foundation";
    let answers = {};
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      stackKey = (body.stackKey || "foundation").toLowerCase();
      answers  = body.answers || {};
    } else {
      const params = new URLSearchParams(event.queryStringParameters || {});
      stackKey = (params.get("stackKey") || "foundation").toLowerCase();
      const a = params.get("a"); if (a) { try { answers = JSON.parse(Buffer.from(a,"base64").toString("utf8")); } catch {} }
    }

    // GPT first; fallback if anything fails
    try {
      const plan = await gptPlan(stackKey, answers);
      return {
        statusCode: 200,
        headers: { "content-type": "application/json", "cache-control": "no-store", "x-plan-source":"gpt" },
        body: JSON.stringify(plan)
      };
    } catch (err) {
      const fallback = pickApps(answers, stackKey);
      return {
        statusCode: 200,
        headers: { "content-type": "application/json", "cache-control": "no-store", "x-plan-source":"fallback" },
        body: JSON.stringify({ meta: { stackKey, personalized: false, fallback: true, source: "fallback" }, apps: fallback })
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) })
    };
  }
};
