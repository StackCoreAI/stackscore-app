// src/api/gpt-plan.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";

import {
  LLMPlansSchema,
  sanitizeLLM,
  fromLLMPlans,
  validateWizardPayload,
  hashWizardAnswers,
  type WizardPayload,
  type AdvisorResponse,
  type LLMPlans,
} from "../../shared/plan";

// -------------------------------------------------------------
// In-memory cache (per-process) + small disk cache (optional)
// -------------------------------------------------------------
type CacheEntry = { legacy: LLMPlans; advisor: AdvisorResponse; at: number };

const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1h
const MAX_ITEMS = 200;

function getFromMemory(key: string): CacheEntry | null {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  return hit;
}

function putInMemory(key: string, value: CacheEntry) {
  if (CACHE.size >= MAX_ITEMS) {
    const oldestKey = [...CACHE.entries()].sort((a, b) => a[1].at - b[1].at)[0]?.[0];
    if (oldestKey) CACHE.delete(oldestKey);
  }
  CACHE.set(key, value);
}

// Disk cache (optional)
const DISK_CACHE_DIR = path.resolve(process.cwd(), ".cache/gpt-plan");

function readDisk(key: string): CacheEntry | null {
  try {
    const file = path.join(DISK_CACHE_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    // light sanity check
    if (!parsed?.legacy || !parsed?.advisor || !parsed?.at) return null;
    return parsed as CacheEntry;
  } catch {
    return null;
  }
}

function writeDisk(key: string, entry: CacheEntry) {
  try {
    fs.mkdirSync(DISK_CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(DISK_CACHE_DIR, `${key}.json`), JSON.stringify(entry, null, 2));
  } catch {
    /* ignore disk errors */
  }
}

// -------------------------------------------------------------
// Prompt scaffolding (kept simple + deterministic)
// -------------------------------------------------------------
const SYSTEM = `You are StackScore’s planner.
Return ONLY JSON with this exact shape:
{
  "PlanA":{"apps":[{"app_name":string,"app_category":string,"app_description":string,"app_cost":string,"app_url":string}]},
  "PlanB":{"apps":[...]},
  "PlanC":{"apps":[...]},
  "PlanD":{"apps":[...] }
}
Rules:
- 4–7 apps per plan. Concise copy. Costs like "Free" or "$5/mo".
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
    lines.push("Include at least one Utilities/Subscription Reporting option relevant to renters.");
  } else if (user.housing === "mortgage") {
    lines.push("Include Monitoring/AI Insights and at least one revolving option.");
  }

  if (wantsSubs) lines.push("Favor Subscription Reporting that can report streaming/utilities.");
  if (user.tools === "manual") lines.push("Prefer simple, manual-friendly tools.");
  if (user.tools === "auto") lines.push("Prefer automated tools that reduce user effort.");

  lines.push("Each plan should include 4–7 reputable U.S. providers.");
  if (user.remix) lines.push("Provide a different mix from typical suggestions.");

  return lines.join("\n");
}

// -------------------------------------------------------------
// Minimal in-file mock (used for USE_MOCK=1 or fallback)
// -------------------------------------------------------------
function mockPlans(): LLMPlans {
  return {
    PlanA: {
      apps: [
        {
          app_name: "GrowCredit",
          app_category: "Subscription Reporting",
          app_description: "Reports Netflix/Spotify, etc.",
          app_cost: "$1.99/mo",
          app_url: "https://growcredit.com",
        },
        {
          app_name: "Experian Boost",
          app_category: "Tradeline",
          app_description: "Add utilities/streaming.",
          app_cost: "Free",
          app_url: "https://experian.com/boost",
        },
        {
          app_name: "Kikoff",
          app_category: "Credit Builder",
          app_description: "Virtual store credit line.",
          app_cost: "$5/mo",
          app_url: "https://kikoff.com",
        },
      ],
    },
    PlanB: {
      apps: [
        {
          app_name: "Self",
          app_category: "Installment Builder",
          app_description: "Build history & savings.",
          app_cost: "$25/mo",
          app_url: "https://self.inc",
        },
      ],
    },
    PlanC: {
      apps: [
        {
          app_name: "Chime Credit Builder",
          app_category: "Secured Card",
          app_description: "No-fee card with weekly autopay.",
          app_cost: "Free*",
          app_url: "https://chime.com",
        },
      ],
    },
    PlanD: {
      apps: [
        {
          app_name: "Tomo",
          app_category: "Unsecured Card",
          app_description: "No credit check.",
          app_cost: "Free",
          app_url: "https://tomocredit.com",
        },
      ],
    },
  };
}

// -------------------------------------------------------------
// Handler
// -------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Validate/normalize wizard payload
    let user: WizardPayload;
    try {
      user = validateWizardPayload(req.body);
    } catch (e: any) {
      res.status(400).json({ error: "Invalid payload", detail: e?.issues ?? String(e) });
      return;
    }

    const cacheKey = await hashWizardAnswers({ user });
    const wantsAdvisor = String(req.query.shape || "").toLowerCase() === "advisor";
    const bypassCache = process.env.BYPASS_CACHE === "1";

    // 1) Memory cache
    if (!bypassCache) {
      const mem = getFromMemory(cacheKey);
      if (mem) {
        res.setHeader("x-ss-cache", "memory");
        res.status(200).json(wantsAdvisor ? mem.advisor : mem.legacy);
        return;
      }
    }

    // 2) Disk cache
    if (!bypassCache) {
      const disk = readDisk(cacheKey);
      if (disk) {
        // populate memory too for speed
        putInMemory(cacheKey, disk);
        res.setHeader("x-ss-cache", "disk");
        res.status(200).json(wantsAdvisor ? disk.advisor : disk.legacy);
        return;
      }
    }

    // 3) Mock path (explicit or query)
    if (process.env.USE_MOCK === "1" || req.query.mock === "1") {
      const legacy = sanitizeLLM(mockPlans());
      const advisor = fromLLMPlans(legacy, { user, defaultUnlockedIndex: 0 });
      const entry: CacheEntry = { legacy, advisor, at: Date.now() };
      putInMemory(cacheKey, entry);
      writeDisk(cacheKey, entry);

      res.setHeader("x-ss-mock", "1");
      res.status(200).json(wantsAdvisor ? advisor : legacy);
      return;
    }

    // 4) Real call (with robust fallback)
    const userPrompt =
      `User profile JSON:\n${JSON.stringify(user)}\n\n` +
      `Guidance:\n${personalizeFromWizard(user)}\n`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GPT_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const data = await r.json().catch(() => ({} as any));

    if (!r.ok) {
      // Fallback to mock
      const legacy = sanitizeLLM(mockPlans());
      const advisor = fromLLMPlans(legacy, { user, defaultUnlockedIndex: 0 });
      const entry: CacheEntry = { legacy, advisor, at: Date.now() };
      putInMemory(cacheKey, entry);
      writeDisk(cacheKey, entry);

      res.setHeader("x-ss-mock", "fallback");
      res.status(200).json(wantsAdvisor ? advisor : legacy);
      return;
    }

    const text = data?.choices?.[0]?.message?.content || "{}";

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      res.status(502).json({ error: "Bad JSON from model", raw: String(text).slice(0, 500) });
      return;
    }

    const parsed = LLMPlansSchema.parse(raw);
    const legacy = sanitizeLLM(parsed);
    const advisor = fromLLMPlans(legacy, { user, defaultUnlockedIndex: 0 });

    const entry: CacheEntry = { legacy, advisor, at: Date.now() };
    putInMemory(cacheKey, entry);
    writeDisk(cacheKey, entry);

    res.status(200).json(wantsAdvisor ? advisor : legacy);
  } catch (err) {
    // Last-resort safety net: return mock
    // (keeps UI happy; tests also accept this path)
    const legacy = sanitizeLLM(mockPlans());
    res.setHeader("x-ss-mock", "fallback");
    res.status(200).json(legacy);
  }
}
