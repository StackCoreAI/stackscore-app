// netlify/functions/generate-plan.js
// Personalized plan composer (no PII). Accepts POST { stackKey, answers } or GET ?stackKey=...
import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const HAS_KEY = !!process.env.OPENAI_API_KEY;
const client = HAS_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/* ---------- Deterministic fallback catalog + scorer ---------- */
function app(name, url, features, meta = {}) {
  return { app_name: name, app_url: url, features, ...meta };
}

const CATALOG = [
  app("Experian Boost", "https://www.experian.com/boost", ["Utilities reporting", "Streaming bills count"], { tags: ["utilities", "instant", "free"], cost: 0 }),
  app("Grow Credit", "https://www.growcredit.com", ["Stream/Subscriptions builder"], { tags: ["subscriptions", "utilities", "low-cost"], cost: 0 }),
  app("Grain Utility Builder", "https://www.grain.com", ["Utility tradeline"], { tags: ["utilities", "tradeline"], cost: 10 }),
  app("BoomPay Rent", "https://www.boompay.app", ["Monthly + backdate"], { tags: ["rent", "backdate"], cost: 4 }),
  app("RentReporters", "https://www.rentreporters.com", ["Verify landlord", "Backdate eligible"], { tags: ["rent", "backdate", "manual"], cost: 10 }),
  app("Piñata", "https://www.pinata.ai", ["Rewards + rent reporting"], { tags: ["rent", "rewards"], cost: 0 }),
  app("Kikoff", "https://www.kikoff.com", ["Credit account", "Low utilization"], { tags: ["installment", "low-cost", "fast"], cost: 5 }),
  app("Self", "https://www.self.inc", ["Credit Builder Loan"], { tags: ["installment", "bank-link"], cost: 25 }),
  app("Kovo", "https://www.kovo.com", ["Installment trade"], { tags: ["installment", "purchase"], cost: 10 }),
  app("Dovly", "https://www.dovly.com", ["Automated disputes"], { tags: ["dispute", "automation"], cost: 0 }),
  app("DisputeBee", "https://disputebee.com", ["DIY letters"], { tags: ["dispute", "manual"], cost: 20 }),
  app("TomoCard Secured", "https://www.tomocredit.com", ["Secured tradeline"], { tags: ["tradeline", "secured"], cost: 0 }),
  app("Extra Debit", "https://www.extra.app", ["Debit-to-credit"], { tags: ["tradeline", "debit"], cost: 20 }),
];

function scoreApp(a, answers, stackKey) {
  const tags = new Set(a.tags || []);
  let s = 0;
  const tl = (answers.timeline || "").toLowerCase();

  if (tl.includes("fast") && (tags.has("utilities") || tags.has("instant"))) s += 3;
  if (tl.includes("steady") && tags.has("installment")) s += 2;
  if (tl.includes("aggressive") && (tags.has("dispute") || tags.has("installment") || tags.has("tradeline"))) s += 2;

  const lv = (answers.living || "").toLowerCase();
  if (lv.includes("rent") && tags.has("rent")) s += 3;
  if (lv.includes("own") && tags.has("utilities")) s += 2;

  const bdg = (answers.budget || "").toLowerCase();
  if (bdg.includes("$0") || bdg.includes("free") || bdg.includes("0")) {
    s += a.cost <= 5 ? 3 : a.cost <= 10 ? 2 : 0;
  } else if (bdg.includes("10")) {
    s += a.cost <= 15 ? 2 : 0;
  } else {
    s += 1;
  }

  const emp = (answers.employment || "").toLowerCase();
  if (emp.includes("self")) {
    if (tags.has("utilities") || tags.has("installment")) s += 1;
  }
  if (emp.includes("w2") || emp.includes("employ")) s += 1;

  if ((answers.rent_backdate || "").toLowerCase().includes("yes") && tags.has("backdate")) s += 2;

  if (stackKey === "foundation") {
    if (tags.has("utilities")) s += 2;
    if (tags.has("installment")) s += 1;
  }
  if (stackKey === "growth") {
    if (tags.has("installment") || tags.has("rent")) s += 2;
  }
  if (stackKey === "accelerator") {
    if (tags.has("dispute") || tags.has("installment")) s += 2;
  }
  if (stackKey === "elite") {
    if (tags.has("dispute") || tags.has("tradeline")) s += 2;
  }

  return s;
}

function buildFallbackSteps(appName, features = []) {
  const n = String(appName || "").toLowerCase();
  const featureLabel = Array.isArray(features) && features.length
    ? features[0]
    : "core reporting feature";

  if (n.includes("experian") && n.includes("boost")) {
    return {
      step1: "Create your Experian account and enter the Boost setup flow.",
      step2: "Connect the bank account that pays your eligible utility and streaming bills.",
      step3: "Select the utility and streaming bills you want Experian Boost to count and confirm Boost is active.",
      tip: "Focus on bills that are already paid consistently each month.",
    };
  }

  if (n.includes("grow credit")) {
    return {
      step1: "Open your Grow Credit account and complete the starter setup.",
      step2: "Link the eligible subscription payments you want routed through Grow Credit.",
      step3: "Turn on reporting so those subscription payments begin building payment history.",
      tip: "Use recurring subscriptions you already pay every month.",
    };
  }

  if (n.includes("grain")) {
    return {
      step1: "Create your Grain account and complete identity setup.",
      step2: "Link the eligible bill or payment source Grain needs for utility-style reporting.",
      step3: "Turn on the reporting feature tied to that bill so it starts contributing to your route.",
      tip: "Use the bill source that is most stable month to month.",
    };
  }

  if (n.includes("boom")) {
    return {
      step1: "Create your Boom account and start the rent reporting setup.",
      step2: "Enter your landlord or property details and verify your current rent payment method.",
      step3: "Turn on monthly rent reporting and add backdated rent history if eligible.",
      tip: "Backdated rent can be especially valuable if you have solid payment history.",
    };
  }

  if (n.includes("rentreporters")) {
    return {
      step1: "Open your RentReporters account and begin rent verification.",
      step2: "Submit your landlord, lease, and payment details for current and prior rent history.",
      step3: "Activate rent reporting and request backdated history if your profile qualifies.",
      tip: "Have lease and payment records ready before starting.",
    };
  }

  if (n.includes("piñata") || n.includes("pinata")) {
    return {
      step1: "Create your Piñata account and begin the rent setup flow.",
      step2: "Connect your rent payment method or property details for verification.",
      step3: "Turn on the rent reporting feature and confirm your monthly payments are being tracked.",
      tip: "Review any rewards settings only after reporting is active.",
    };
  }

  if (n.includes("kikoff")) {
    return {
      step1: "Open your Kikoff account and activate the credit builder line.",
      step2: "Enable autopay so the monthly payment reports consistently.",
      step3: "Keep utilization low and leave the account active so the tradeline stays healthy.",
      tip: "Low utilization matters more than heavy usage here.",
    };
  }

  if (n.includes("self")) {
    return {
      step1: "Open your Self account and choose the Credit Builder Loan option that fits your budget.",
      step2: "Fund the first payment and enable autopay for on-time reporting.",
      step3: "Keep the loan active until reporting history begins compounding across the bureaus.",
      tip: "Consistency matters more than speed with Self.",
    };
  }

  if (n.includes("kovo")) {
    return {
      step1: "Create your Kovo account and select the credit-building product you want reported.",
      step2: "Complete payment setup so the installment trade can begin reporting properly.",
      step3: "Keep the account in good standing with on-time payments each cycle.",
      tip: "Do not interrupt the reporting cycle once activated.",
    };
  }

  if (n.includes("dovly")) {
    return {
      step1: "Create your Dovly account and import your credit profile.",
      step2: "Run the scan so Dovly can identify negative items and dispute opportunities.",
      step3: "Turn on the automated dispute workflow and monitor for the first update cycle.",
      tip: "Automation is the main feature to use inside Dovly.",
    };
  }

  if (n.includes("disputebee")) {
    return {
      step1: "Open your DisputeBee account and import your credit report details.",
      step2: "Use the letter builder to generate the first dispute round for qualified items.",
      step3: "Send the first dispute set and track responses before starting the next round.",
      tip: "Focus on the clearest dispute opportunities first.",
    };
  }

  if (n.includes("tomo")) {
    return {
      step1: "Open your Tomo account and complete the secured card setup.",
      step2: "Link your bank account and fund the secured component if required.",
      step3: "Enable autopay and keep card usage low so the tradeline reports cleanly.",
      tip: "This tool works best when utilization stays controlled.",
    };
  }

  if (n.includes("extra")) {
    return {
      step1: "Create your Extra account and complete the debit-to-credit setup.",
      step2: "Link the bank account Extra uses to support your card activity.",
      step3: "Use the card lightly and keep the reporting feature active so the tradeline stays strong.",
      tip: "Treat this as a reporting tool, not a spending tool.",
    };
  }

  return {
    step1: `Create your ${appName} account and complete the initial setup flow.`,
    step2: `Connect the payment source, bank account, or verification details required to use the ${featureLabel.toLowerCase()}.`,
    step3: `Turn on the specific reporting or credit-building feature inside ${appName} so it begins contributing to your route.`,
    tip: `Prioritize the main feature inside ${appName} rather than exploring every optional tool first.`,
  };
}

function pickApps(answers, stackKey) {
  const ranked = CATALOG
    .map((a) => ({ a, score: scoreApp(a, answers, stackKey) }))
    .sort((x, y) => y.score - x.score);

  const want = (() => {
    if (stackKey === "foundation") return ["utilities", "installment", "rent"];
    if (stackKey === "growth") return ["installment", "rent", "utilities"];
    if (stackKey === "accelerator") return ["dispute", "installment", "utilities"];
    if (stackKey === "elite") return ["dispute", "tradeline", "installment"];
    return ["utilities", "installment", "rent"];
  })();

  const seen = new Set();
  const chosen = [];

  for (const cat of want) {
    const hit = ranked.find(
      (r) => !seen.has(r.a.app_name) && (r.a.tags || []).includes(cat)
    );
    if (hit) {
      chosen.push(hit.a);
      seen.add(hit.a.app_name);
    }
  }

  for (const r of ranked) {
    if (chosen.length >= 5) break;
    if (!seen.has(r.a.app_name)) {
      chosen.push(r.a);
      seen.add(r.a.app_name);
    }
  }

  return chosen.slice(0, Math.max(3, Math.min(5, chosen.length)));
}

function buildFallbackPlan(stackKey, answers) {
  const apps = pickApps(answers, stackKey).map((a) => {
    const steps = buildFallbackSteps(a.app_name, a.features || []);
    return {
      app_name: a.app_name,
      app_url: a.app_url,
      features: a.features || [],
      step1: steps.step1,
      step2: steps.step2,
      step3: steps.step3,
      tip: steps.tip || "",
      execution_insights: [],
      reroutes: [],
    };
  });

  return {
    meta: {
      stackKey,
      personalized: false,
      fallback: true,
      source: "fallback",
    },
    why_overview:
      "This route was selected using StackScore's fallback routing logic based on your profile inputs, cost sensitivity, and the credit-building signals most likely to fit your selected stack.",
    routing_summary:
      "Use the selected tools in sequence, activate the key reporting feature inside each app, and let the accounts season long enough for reporting to register.",
    route_steps: [
      "Start with the first tool and finish setup before moving to the next.",
      "Turn on the reporting or credit-building feature recommended inside each app.",
      "Enable autopay where available to protect on-time reporting.",
      "Give new accounts time to report before adding unnecessary changes.",
    ],
    apps,
    reasoning: "",
  };
}

/* ---------- GPT composer (structured JSON) ---------- */
const JSON_SCHEMA = {
  name: "stack_plan",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      why_overview: { type: "string", minLength: 10, maxLength: 900 },
      assumptions: {
        type: "array",
        minItems: 0,
        maxItems: 8,
        items: { type: "string", minLength: 4, maxLength: 140 },
      },
      routing_summary: { type: "string", minLength: 10, maxLength: 240 },
      route_steps: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: { type: "string", minLength: 4, maxLength: 120 },
      },
      apps: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "website", "features", "step1", "step2", "step3"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 60 },
            website: { type: "string", minLength: 8, maxLength: 200 },
            features: {
              type: "array",
              minItems: 1,
              maxItems: 5,
              items: { type: "string", minLength: 2, maxLength: 120 },
            },
            step1: { type: "string", minLength: 8, maxLength: 180 },
            step2: { type: "string", minLength: 8, maxLength: 180 },
            step3: { type: "string", minLength: 8, maxLength: 180 },
            tip: { type: "string", minLength: 0, maxLength: 200 },
            execution_insights: {
              type: "array",
              minItems: 0,
              maxItems: 5,
              items: { type: "string", minLength: 4, maxLength: 120 },
            },
            reroutes: {
              type: "array",
              minItems: 0,
              maxItems: 6,
              items: { type: "string", minLength: 2, maxLength: 60 },
            },
          },
        },
      },
      reasoning: { type: "string", minLength: 0, maxLength: 800 },
    },
    required: ["apps", "why_overview", "routing_summary", "route_steps"],
  },
};

async function gptPlan(stackKey, answers) {
  if (!HAS_KEY) throw new Error("no_openai_key");

  const sys = `
You are an expert credit-building coach for US consumers.

Return ONLY JSON matching the provided schema.

Create a personalized Credit Route plan with:

• 3–5 real credit-building apps that best fit the user's profile
• A short explanation of why the route was selected
• A routing summary explaining the strategy
• 3–6 route steps showing the correct sequence
• For each app, return exactly 3 directive activation steps
• Each step must name the feature the user should turn on, connect, or use inside the app
• Do not write generic steps like "create account" unless the step also points to the specific feature to activate
• Focus on execution inside the app, not broad advice
• 2–3 execution insights where useful
• Alternate reroutes if one tool becomes unavailable

Stacks:

foundation
Low friction + instant impact + basic builders

growth
Installment depth + rent reporting

accelerator
Add dispute automation + momentum

elite
Dispute + tradelines + best-in-class builders

Rules:

• Use real products with correct URLs
• Tailor to timeline, living situation, budget, employment, and rent backdate
• Prefer lower cost tools when budget is tight
• Each app must include step1, step2, and step3
• Steps should be short, clear, and action-oriented
• Mention the specific feature to use whenever possible
• Return only valid JSON matching the schema
`;

  const user = {
    stackKey,
    answers: {
      living: answers.living || "",
      budget: answers.budget || "",
      timeline: answers.timeline || "",
      employment: answers.employment || "",
      rent_backdate: answers.rent_backdate || "",
    },
  };

  const resp = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 900,
    response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify(user) },
    ],
    timeout: 15_000,
  });

  const raw = resp.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);

  const apps = (parsed?.apps || [])
    .map((a) => ({
      app_name: a.name,
      app_url: a.website,
      features: a.features || [],
      step1: a.step1 || "",
      step2: a.step2 || "",
      step3: a.step3 || "",
      tip: a.tip || "",
      execution_insights: a.execution_insights || [],
      reroutes: a.reroutes || [],
    }))
    .slice(0, 5);

  if (apps.length < 3) throw new Error("insufficient_apps");

  return {
    meta: {
      stackKey,
      personalized: true,
      model: MODEL,
      source: "gpt",
    },
    why_overview: parsed?.why_overview || "",
    assumptions: Array.isArray(parsed?.assumptions) ? parsed.assumptions : [],
    routing_summary: parsed?.routing_summary || "",
    route_steps: Array.isArray(parsed?.route_steps) ? parsed.route_steps : [],
    apps,
    reasoning: parsed?.reasoning || "",
  };
}

/* ---------- Handler ---------- */
export const handler = async (event) => {
  try {
    let stackKey = "foundation";
    let answers = {};

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      stackKey = (body.stackKey || "foundation").toLowerCase();
      answers = body.answers || {};
    } else {
      const params = event.queryStringParameters || {};
      stackKey = (params.stackKey || "foundation").toLowerCase();

      const a = params.a;
      if (a) {
        try {
          answers = JSON.parse(Buffer.from(a, "base64").toString("utf8"));
        } catch {
          answers = {};
        }
      }
    }

    try {
      const plan = await gptPlan(stackKey, answers);
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "x-plan-source": "gpt",
        },
        body: JSON.stringify(plan),
      };
    } catch (err) {
      const fallback = buildFallbackPlan(stackKey, answers);
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "x-plan-source": "fallback",
        },
        body: JSON.stringify(fallback),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
};