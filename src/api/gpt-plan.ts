// src/api/gpt-plan.ts
import 'dotenv/config';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  LLMPlansSchema,
  sanitizeLLM,
  fromLLMPlans,
  validateWizardPayload,
  hashWizardAnswers,
  type WizardPayload,
  type AdvisorResponse,
  type LLMPlans,
} from '../../shared/plan';

type CacheEntry = { legacy: LLMPlans; advisor: AdvisorResponse; at: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000;
const MAX_ITEMS = 200;

function getFromCache(key: string): CacheEntry | null {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) { CACHE.delete(key); return null; }
  return hit;
}
function putInCache(key: string, value: CacheEntry) {
  if (CACHE.size >= MAX_ITEMS) {
    const oldestKey = [...CACHE.entries()].sort((a,b)=>a[1].at-b[1].at)[0]?.[0];
    if (oldestKey) CACHE.delete(oldestKey);
  }
  CACHE.set(key, value);
}

const SYSTEM = `You are StackScore’s planner.
Return ONLY JSON with this exact shape:
{
  "PlanA":{"apps":[{"app_name":string,"app_category":string,"app_description":string,"app_cost":string,"app_url":string}]},
  "PlanB":{"apps":[...]},
  "PlanC":{"apps":[...]},
  "PlanD":{"apps":[...] }
}
Rules:
- 3–6 apps per plan. Concise copy. Costs like "Free" or "$5/mo".
- U.S.-relevant, reputable providers ONLY.
- VALID CATEGORIES (must match exactly one of):
  Subscription Reporting, Subscription Trackers, Tradeline, Credit Builder, Credit Builders,
  Installment Builder, Secured Card, Unsecured Card, Utility Reporting, Dispute Tools,
  AI Insights, Monitoring, Budgeting, Finance, Banking
- EXCLUDE ANYTHING unrelated to credit building or reporting (no fitness/health/etc).
- If unsure about a provider, omit it.`;

function personalizeFromWizard(user: WizardPayload): string {
  const wantsSubs = Array.isArray(user.subs) && user.subs.length > 0;
  const lines: string[] = [];

  if (user.goal === "30") lines.push("Optimize for fastest impact within ~30 days.");
  else if (user.goal === "90") lines.push("Balance fast impact with a 90-day horizon.");
  else lines.push("Pace for steady progress.");

  if (typeof user.budget === "number") {
    lines.push(`Keep total monthly costs near $${user.budget}. Prefer Free/$5-$15 options if needed.`);
  }

  if (user.housing === "rent") {
    lines.push("Include at least one Utility/Subscription Reporting option relevant to renters.");
  } else if (user.housing === "mortgage") {
    lines.push("Include Monitoring/AI Insights and at least one revolving option.");
  }

  if (wantsSubs) lines.push("Favor Subscription Reporting that can report streaming/utilities.");
  if (user.tools === "manual") lines.push("Prefer simple, manual-friendly tools.");
  if (user.tools === "auto") lines.push("Prefer automated tools that reduce user effort.");

  lines.push("Each plan should include 3–6 reputable U.S. providers.");
  if (user.remix) lines.push("Provide a different mix from typical suggestions.");

  return lines.join("\n");
}

function mockPlans(): LLMPlans {
  return {
    PlanA:{apps:[
      {app_name:"GrowCredit",app_category:"Subscription Reporting",app_description:"Reports Netflix/Spotify, etc.",app_cost:"$1.99/mo",app_url:"https://growcredit.com"},
      {app_name:"Experian Boost",app_category:"Tradeline",app_description:"Add utilities/streaming.",app_cost:"Free",app_url:"https://experian.com/boost"},
      {app_name:"Kikoff",app_category:"Credit Builder",app_description:"Virtual store credit line.",app_cost:"$5/mo",app_url:"https://kikoff.com"}
    ]},
    PlanB:{apps:[
      {app_name:"Self",app_category:"Installment Builder",app_description:"Build history & savings.",app_cost:"$25/mo",app_url:"https://self.inc"}
    ]},
    PlanC:{apps:[
      {app_name:"Chime Credit Builder",app_category:"Secured Card",app_description:"No-fee card with weekly autopay.",app_cost:"Free*",app_url:"https://chime.com"}
    ]},
    PlanD:{apps:[
      {app_name:"Tomo",app_category:"Unsecured Card",app_description:"No credit check.",app_cost:"Free",app_url:"https://tomocredit.com"}
    ]},
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let user: WizardPayload;
    try { user = validateWizardPayload(req.body); }
    catch (e: any) { return res.status(400).json({ error: 'Invalid payload', detail: e?.issues ?? String(e) }); }

    const cacheKey = await hashWizardAnswers({ user });
    const cached = getFromCache(cacheKey);
    if (cached && process.env.BYPASS_CACHE !== '1') {
      if (String(req.query.shape || '').toLowerCase() === 'advisor') {
        return res.json(cached.advisor);
      }
      return res.json(cached.legacy);
    }

    if (process.env.USE_MOCK === '1' || req.query.mock === '1') {
      const legacy = sanitizeLLM(mockPlans());
      const advisor = fromLLMPlans(legacy, { user, defaultUnlockedIndex: 0 });
      putInCache(cacheKey, { legacy, advisor, at: Date.now() });
      if (String(req.query.shape || '').toLowerCase() === 'advisor') {
        return res.json(advisor);
      }
      return res.json(legacy);
    }

    const userPrompt =
      `User profile JSON:\n${JSON.stringify(user)}\n\n` +
      `Guidance:\n${personalizeFromWizard(user)}\n`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GPT_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('OpenAI error:', data);
      const legacy = sanitizeLLM(mockPlans());
      const advisor = fromLLMPlans(legacy, { user, defaultUnlockedIndex: 0 });
      putInCache(cacheKey, { legacy, advisor, at: Date.now() });
      if (String(req.query.shape || '').toLowerCase() === 'advisor') {
        return res.json(advisor);
      }
      return res.status(200).json(legacy);
    }

    const text = data?.choices?.[0]?.message?.content || '{}';
    let raw;
    try { raw = JSON.parse(text); }
    catch { return res.status(502).json({ error: 'Bad JSON from model', raw: text.slice(0, 500) }); }

    const legacy = sanitizeLLM(LLMPlansSchema.parse(raw));
    const advisor = fromLLMPlans(legacy, { user, defaultUnlockedIndex: 0 });

    putInCache(cacheKey, { legacy, advisor, at: Date.now() });

    if (String(req.query.shape || '').toLowerCase() === 'advisor') {
      return res.json(advisor);
    }

    return res.json(legacy);
  } catch (err) {
    console.error(err);
    const legacy = sanitizeLLM(mockPlans());
    return res.status(200).json(legacy);
  }
}
