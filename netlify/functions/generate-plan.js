// netlify/functions/generate-plan.js
// Personalized plan composer (no PII). Accepts POST { stackKey, answers } or GET ?stackKey=...

const CATALOG = [
  // --- Utilities / instant ---
  app("Experian Boost", "https://www.experian.com/boost", ["Utilities reporting", "Streaming bills count"], { tags:["utilities","instant","free"], cost:0 }),
  app("Grow Credit", "https://www.growcredit.com", ["Stream/Subscriptions builder"], { tags:["subscriptions","utilities","low-cost"], cost:0 }),
  app("Grain Utility Builder", "https://www.grain.com", ["Utility tradeline"], { tags:["utilities","tradeline"], cost:10 }),

  // --- Rent reporting ---
  app("BoomPay Rent", "https://www.boompay.app", ["Monthly + backdate"], { tags:["rent","backdate"], cost:4 }),
  app("RentReporters", "https://www.rentreporters.com", ["Verify landlord", "Backdate eligible"], { tags:["rent","backdate","manual"], cost:10 }),
  app("Piñata", "https://www.pinata.ai", ["Rewards + rent reporting"], { tags:["rent","rewards"], cost:0 }),

  // --- Installment / builder lines ---
  app("Kikoff", "https://www.kikoff.com", ["Credit account", "Low utilization"], { tags:["installment","low-cost","fast"], cost:5 }),
  app("Self", "https://www.self.inc", ["Credit Builder Loan"], { tags:["installment","bank-link"], cost:25 }),
  app("Kovo", "https://www.kovo.com", ["Installment trade"], { tags:["installment","purchase"], cost:10 }),

  // --- Disputes / cleanup ---
  app("Dovly", "https://www.dovly.com", ["Automated disputes"], { tags:["dispute","automation"], cost:0 }),
  app("DisputeBee", "https://disputebee.com", ["DIY letters"], { tags:["dispute","manual"], cost:20 }),

  // --- Tradelines / secured ---
  app("TomoCard Secured", "https://www.tomocredit.com", ["Secured tradeline"], { tags:["tradeline","secured"], cost:0 }),
  app("Extra Debit", "https://www.extra.app", ["Debit-to-credit"], { tags:["tradeline","debit"], cost:20 }),
];

function app(name, url, features, meta){ return { app_name:name, app_url:url, features, ...meta }; }

function scoreApp(a, answers, stackKey){
  const tags = new Set(a.tags || []);
  let s = 0;

  // timeline: "fast" → utilities/instant; "steady" → installment; "aggressive" → add disputes + 4–5 apps
  const tl = (answers.timeline || "").toLowerCase();
  if (tl.includes("fast") && (tags.has("utilities") || tags.has("instant"))) s += 3;
  if (tl.includes("steady") && tags.has("installment")) s += 2;
  if (tl.includes("aggressive") && (tags.has("dispute") || tags.has("installment") || tags.has("tradeline"))) s += 2;

  // living: "rent" → rent reporters; "own" → utilities/instant
  const lv = (answers.living || "").toLowerCase();
  if (lv.includes("rent") && tags.has("rent")) s += 3;
  if (lv.includes("own") && tags.has("utilities")) s += 2;

  // budget: "$0–$10" prefers cost<=10; "$10–$25" mid; "$25+" open
  const bdg = (answers.budget || "").toLowerCase();
  if (bdg.includes("$0") || bdg.includes("0") || bdg.includes("free")) s += (a.cost <= 5 ? 3 : (a.cost <= 10 ? 2 : 0));
  else if (bdg.includes("10") || bdg.includes("$10")) s += (a.cost <= 15 ? 2 : 0);
  else s += 1;

  // employment: "self employed" → prefer bank-link/low-doc; "w2" → any
  const emp = (answers.employment || "").toLowerCase();
  if (emp.includes("self")) { if (tags.has("utilities") || tags.has("installment")) s += 1; }
  if (emp.includes("w2")) s += 1;

  // rent backdate preference
  if ((answers.rent_backdate || "").toLowerCase().includes("yes") && tags.has("backdate")) s += 2;

  // stack-specific boosts
  if (stackKey === "foundation") {
    if (tags.has("utilities")) s += 2;
    if (tags.has("installment")) s += 1;
  } else if (stackKey === "growth") {
    if (tags.has("installment") || tags.has("rent")) s += 2;
  } else if (stackKey === "accelerator") {
    if (tags.has("dispute") || tags.has("installment")) s += 2;
  } else if (stackKey === "elite") {
    if (tags.has("dispute") || tags.has("tradeline")) s += 2;
  }

  return s;
}

function pickApps(answers, stackKey){
  // Score and sort
  const ranked = CATALOG
    .map(a => ({ a, score: scoreApp(a, answers, stackKey) }))
    .sort((x,y) => y.score - x.score);

  // Ensure category coverage per stack
  const want = (()=>{
    if (stackKey === "foundation") return ["utilities","installment","rent"];
    if (stackKey === "growth") return ["installment","rent","utilities"];
    if (stackKey === "accelerator") return ["dispute","installment","utilities"];
    if (stackKey === "elite") return ["dispute","tradeline","installment"];
    return ["utilities","installment","rent"];
  })();

  const seen = new Set();
  const chosen = [];
  // First pass: take top matches ensuring coverage
  for (const cat of want) {
    const hit = ranked.find(r => !seen.has(r.a.app_name) && (r.a.tags || []).includes(cat));
    if (hit) { chosen.push(hit.a); seen.add(hit.a.app_name); }
  }
  // Second pass: fill to 3–5
  for (const r of ranked) {
    if (chosen.length >= 5) break;
    if (!seen.has(r.a.app_name)) { chosen.push(r.a); seen.add(r.a.app_name); }
  }
  // Guarantee 3
  return chosen.slice(0, Math.max(3, Math.min(5, chosen.length)));
}

export const handler = async (event) => {
  try {
    let stackKey = "foundation";
    let answers = {};

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      stackKey = (body.stackKey || "foundation").toLowerCase();
      answers = body.answers || {};
    } else {
      const params = new URLSearchParams(event.queryStringParameters || {});
      stackKey = (params.get("stackKey") || "foundation").toLowerCase();
      // optional base64 answers for GET: ?a=base64(json)
      const a = params.get("a");
      if (a) {
        try { answers = JSON.parse(Buffer.from(a, "base64").toString("utf8")); } catch {}
      }
    }

    const apps = pickApps(answers, stackKey);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        meta: { stackKey, personalized: true },
        apps,
        steps: [], // UI derives per-app steps client-side
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
};
