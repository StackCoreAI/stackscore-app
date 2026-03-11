// shared/plan.ts
// Phase 2 foundation: contracts + Zod + LLM->Advisor transform

import { z } from "zod";

/* ----------------------------------------------------------------------------
 * 1) Your canonical UI-facing contract
 * --------------------------------------------------------------------------*/

export type AppItem = {
  app_id: string;         // stable slug
  app_name: string;
  app_url: string;
  why: string;            // short rationale
  setup_steps: string[];  // concrete actions
};

export type Plan = {
  id: "A" | "B" | "C" | "D";
  title: string;
  summary: string;             // 2–3 line overview
  apps: AppItem[];             // min 4, max 7 (we’ll enforce in schema)
  unlocked_app_index: number;  // 0-based index (usually 0)
};

export type AdvisorResponse = {
  plans: Plan[];               // exactly 4 plans (A–D)
  notes?: string;
};

/* Zod schema for your contract */

export const AppItemSchema = z.object({
  app_id: z.string().min(1).max(120),
  app_name: z.string().min(1).max(140),
  app_url: z.string().url().max(400),
  why: z.string().min(1).max(400),
  setup_steps: z.array(z.string().min(1)).min(1).max(8),
});

export const PlanSchema = z.object({
  id: z.enum(["A", "B", "C", "D"]),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  apps: z.array(AppItemSchema).min(4).max(7),
  unlocked_app_index: z.number().int().min(0),
});

export const AdvisorResponseSchema = z.object({
  plans: z
    .array(PlanSchema)
    .length(4)
    .refine(
      (arr) => ["A", "B", "C", "D"].every((k) => arr.some((p) => p.id === (k as any))),
      "plans must include exactly one of A, B, C, D"
    ),
  notes: z.string().max(1000).optional(),
});

export type AdvisorResponseParsed = z.infer<typeof AdvisorResponseSchema>;

export function validateAdvisorResponse(input: unknown): AdvisorResponseParsed {
  return AdvisorResponseSchema.parse(input);
}

/* ----------------------------------------------------------------------------
 * 2) LLM wire format (what /api/gpt-plan receives from the model)
 *    — keeps our existing categories + fields, then we map → AdvisorResponse
 * --------------------------------------------------------------------------*/

export const AllowedCategories = [
  "Subscription Reporting",
  "Subscription Trackers",
  "Tradeline",
  "Credit Builder",
  "Credit Builders",
  "Installment Builder",
  "Secured Card",
  "Unsecured Card",
  "Utility Reporting",
  "Dispute Tools",
  "AI Insights",
  "Monitoring",
  "Budgeting",
  "Finance",
  "Banking",
] as const;
const AllowedSet = new Set<string>(AllowedCategories);

export const BlockTerms = [
  "fitness","workout","diet","meal","meditation","sleep","weight","yoga","steps","calorie","coach","health"
] as const;

export const LLMAppSchema = z.object({
  app_name: z.string().min(1).max(140),
  app_category: z.enum(AllowedCategories),
  app_description: z.string().min(1).max(400),
  app_cost: z.string().min(1).max(60),
  app_url: z.string().url().max(400),
});

export const LLMPlanSchema = z.object({
  apps: z.array(LLMAppSchema).min(1).max(8),
});

export const LLMPlansSchema = z.object({
  PlanA: LLMPlanSchema,
  PlanB: LLMPlanSchema,
  PlanC: LLMPlanSchema,
  PlanD: LLMPlanSchema,
});
export type LLMPlans = z.infer<typeof LLMPlansSchema>;

/* ----------------------------------------------------------------------------
 * 3) Helpers: sanitize, slugify, hashing for cache keys
 * --------------------------------------------------------------------------*/

function containsBlocked(a: { app_name: string; app_description: string; app_category: string }) {
  const hay = `${a.app_name} ${a.app_description} ${a.app_category}`.toLowerCase();
  return (BlockTerms as readonly string[]).some((t) => hay.includes(t));
}

export function sanitizeLLM(plans: LLMPlans): LLMPlans {
  const out: any = {};
  (["PlanA","PlanB","PlanC","PlanD"] as const).forEach((k) => {
    const apps = Array.isArray(plans[k]?.apps) ? plans[k].apps : [];
    const filtered = apps.filter(
      (a) => AllowedSet.has(a.app_category) && !containsBlocked(a)
    );
    // De-dupe by URL/name, cap to 6
    const seen = new Set<string>();
    const unique = filtered.filter((a) => {
      const key = (a.app_url || a.app_name).trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
    out[k] = { apps: unique };
  });
  return LLMPlansSchema.parse(out); // ensure we still match wire schema
}

export function slugifyId(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Node + modern browsers: tiny wrapper around SubtleCrypto/crypto. */
export async function hashWizardAnswers(obj: unknown): Promise<string> {
  const json = typeof obj === "string" ? obj : JSON.stringify(obj || {});
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const enc = new TextEncoder().encode(json);
    const buf = await window.crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map((b)=>b.toString(16).padStart(2,"0")).join("");
  } else {
    // Node
    const { createHash } = await import("node:crypto");
    return createHash("sha256").update(json).digest("hex");
  }
}

/* ----------------------------------------------------------------------------
 * 4) Transform LLM → AdvisorResponse (your contract)
 *    - Builds titles/summaries and maps app fields into your shape
 *    - Guarantees 4 plans, 4–7 apps each by padding when necessary
 * --------------------------------------------------------------------------*/

type TitleSummaryInput = {
  id: "A" | "B" | "C" | "D";
  // You can pass wizard data if you want to personalize summaries later
  user?: { goal?: string | null; budget?: number | null };
};

function titleFor(id: "A" | "B" | "C" | "D") {
  switch (id) {
    case "A": return "Plan A — Foundation Stack";
    case "B": return "Plan B — Growth Stack";
    case "C": return "Plan C — Accelerator Stack";
    case "D": return "Plan D — Elite Stack";
  }
}

function summaryFor({ id, user }: TitleSummaryInput) {
  const base = {
    A: "Low-cost starter picks to establish momentum and quick wins.",
    B: "Balanced upgrades that add depth while keeping cost reasonable.",
    C: "Stronger mix of revolving + installment to accelerate gains.",
    D: "Premium options for maximum impact and long-term strength."
  } as const;

  const when =
    user?.goal === "30" ? "aimed at 30‑day improvements"
    : user?.goal === "90" ? "shaped for a 90‑day horizon"
    : "paced for steady progress";

  const budget =
    typeof user?.budget === "number" ? ` within a ~$${user!.budget}/mo budget` : "";

  return `${base[id]} ${when}${budget}.`.trim();
}

function sanitizeApp(a: z.infer<typeof LLMAppSchema>): AppItem {
  return {
    app_id: slugifyId(a.app_name),
    app_name: a.app_name.trim(),
    app_url: a.app_url.trim(),
    why: a.app_description.trim(), // concise rationale from model
    setup_steps: [
      `Open ${a.app_name}`,
      "Create/verify your account",
      "Complete onboarding and link required accounts",
    ],
  };
}

/**
 * Map LLM wire format → your AdvisorResponse, enforcing your counts.
 * If a plan has <4 apps, we pad with locked-ready placeholders (simple “Coming soon” steps).
 */
export function fromLLMPlans(
  raw: unknown,
  opts?: { user?: { goal?: string | null; budget?: number | null }; defaultUnlockedIndex?: number }
): AdvisorResponseParsed {
  // 1) Validate & sanitize LLM first
  const llm = sanitizeLLM(LLMPlansSchema.parse(raw));

  // 2) Build your four plans
  const ids: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
  const plans: Plan[] = ids.map((id) => {
    const key = (`Plan${id}` as const);
    const appsLLM = llm[key].apps.map(sanitizeApp);

    // Ensure 4–7 apps by padding (keeps UI stable)
    const padded: AppItem[] = [...appsLLM];
    while (padded.length < 4) {
      const idx = padded.length + 1;
      padded.push({
        app_id: `locked-${id.toLowerCase()}-${idx}`,
        app_name: "Locked app",
        app_url: "https://stacksco.re/locked",
        why: "This slot is reserved for premium suggestions.",
        setup_steps: ["Unlock StackScore Access to reveal this app."],
      });
    }
    if (padded.length > 7) padded.length = 7;

    const unlockedIndex = Math.min(
      typeof opts?.defaultUnlockedIndex === "number" ? opts!.defaultUnlockedIndex : 0,
      Math.max(0, padded.length - 1)
    );

    return {
      id,
      title: titleFor(id),
      summary: summaryFor({ id, user: opts?.user }),
      apps: padded,
      unlocked_app_index: unlockedIndex,
    };
  });

  // 3) Validate against your contract before returning
  return AdvisorResponseSchema.parse({ plans });
}

/* ----------------------------------------------------------------------------
 * 5) Wizard payload validation (for hashing/caching)
 * --------------------------------------------------------------------------*/

export const WizardPayloadSchema = z.object({
  housing: z.enum(["rent","mortgage","neither"]).nullable().optional(),
  subs: z.array(z.string()).default([]),
  tools: z.enum(["auto","manual","not-sure"]).nullable().optional(),
  employment: z.enum(["employed","self-employed","unemployed","student"]).nullable().optional(),
  goal: z.enum(["30","90","flexible"]).nullable().optional(),
  budget: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).nullable().optional(),
  remix: z.boolean().optional(),
  topic: z.string().optional(),
  require_categories: z.array(z.enum(AllowedCategories)).optional(),
}).passthrough();

export type WizardPayload = z.infer<typeof WizardPayloadSchema>;
export function validateWizardPayload(input: unknown): WizardPayload {
  return WizardPayloadSchema.parse(input);
}
