// shared/plan.ts
// Complete, drop-in file: schemas + sanitizer + LLM→UI transform
// Includes ensureGrowthIncludesExperianBoost for Plan B (Growth)

import { z } from "zod";

/* ---------- Public Types (consumed by the app) ---------- */

export type AppItem = {
  app_id: string;            // slugified from app_name
  app_name: string;
  app_url?: string;
  why?: string;              // short purpose/benefit line
  setup_steps?: string[];    // short, UI-friendly steps (recipes go deeper in /src/recipes)
};

export type PlanItem = {
  key: "A" | "B" | "C" | "D"; // A=Foundation, B=Growth, C=Accelerator, D=Elite
  label: string;              // e.g., "Growth"
  subtitle?: string;
  projectedGain?: string;     // e.g., "+35–70"
  timeToImpactDays?: number;  // e.g., 14
  counts?: { visible?: number; locked?: number };
  revealApp?: string;         // one anchor app we reveal pre-purchase
  narrative?: string;         // persona-aware text
  apps: AppItem[];            // UI-level app items (recipes are separate)
};

export type AdvisorResponseParsed = {
  plans: PlanItem[];
};

/* ---------- LLM Response Schemas ---------- */

export const LLMPlanAppSchema = z.object({
  app_name: z.string().min(1),
  app_url: z.string().url().optional(),
  why: z.string().min(1).optional(),
  setup_steps: z.array(z.string().min(1)).optional(),
});

export const LLMPlanSchema = z.object({
  id: z.enum(["A", "B", "C", "D"]).optional(), // model might omit; we’ll fill sequentially if needed
  label: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  projectedGain: z.string().optional(),
  timeToImpactDays: z.number().int().positive().optional(),
  counts: z
    .object({
      visible: z.number().int().nonnegative().optional(),
      locked: z.number().int().nonnegative().optional(),
    })
    .optional(),
  revealApp: z.string().optional(),
  narrative: z.string().optional(),
  apps: z.array(LLMPlanAppSchema).default([]),
});

export const LLMPlansSchema = z.object({
  plans: z.array(LLMPlanSchema).min(1),
});

/* ---------- Utilities ---------- */

export function slugifyId(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

/** Tiny helper to construct a UI-level AppItem */
function makeAppItem(app_name: string, app_url: string, why: string): AppItem {
  return {
    app_id: slugifyId(app_name),
    app_name,
    app_url,
    why,
    // Keep steps minimal for UI; deep “Activation Recipes” live in /src/recipes/*.json
    setup_steps: [
      `Open ${app_name}`,
      "Create/verify your account",
      "Complete onboarding and link required accounts",
    ],
  };
}

/** Defensive parsing + normalization of the LLM output */
export function sanitizeLLM(raw: unknown) {
  const parsed = LLMPlansSchema.safeParse(raw);
  if (!parsed.success) {
    // Provide a minimal fallback so UI doesn’t crash
    const fallback: z.infer<typeof LLMPlansSchema> = {
      plans: [
        {
          id: "A",
          label: "Foundation",
          subtitle: "Baseline setup",
          narrative: "Get your bearings and stabilize cash flow first.",
          apps: [],
        },
        {
          id: "B",
          label: "Growth",
          subtitle: "Fast lift on a tight budget",
          narrative: "Quick wins with low monthly cost.",
          apps: [],
        },
      ],
    };
    return fallback;
  }

  // Ensure each plan has an id; if missing, assign A/B/C/D in order
  const ids: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
  const seen = new Set<string>();
  let idx = 0;

  const normalized = parsed.data.plans.map((p) => {
    let id = (p.id as "A" | "B" | "C" | "D" | undefined) || ids[Math.min(idx, 3)];
    if (seen.has(id)) {
      // if duplicate, shift to next available
      const next = ids.find((x) => !seen.has(x)) || id;
      id = next;
    }
    seen.add(id);
    idx++;

    const label =
      p.label ||
      (id === "A"
        ? "Foundation"
        : id === "B"
        ? "Growth"
        : id === "C"
        ? "Accelerator"
        : "Elite");

    return {
      ...p,
      id,
      label,
      apps: Array.isArray(p.apps) ? p.apps : [],
    };
  });

  return { plans: normalized };
}

/* ---------- Transform: LLM → App UI ---------- */

export function fromLLMPlans(
  raw: unknown,
  opts?: {
    user?: { goal?: string | null; budget?: number | null };
    defaultUnlockedIndex?: number;
    /** When true, ensure Plan B (Growth) includes Experian Boost even if the LLM omitted it. */
    ensureGrowthIncludesExperianBoost?: boolean;
  }
): AdvisorResponseParsed {
  const data = sanitizeLLM(raw);

  // Map LLM plan → UI plan
  const uiPlans: PlanItem[] = data.plans.map((p) => {
    const id = (p.id as PlanItem["key"]) || "A";

    // Map each LLM app into a UI AppItem with safe defaults
    let items: AppItem[] = (p.apps || []).map((a) => ({
      app_id: slugifyId(a.app_name),
      app_name: a.app_name,
      app_url: a.app_url,
      why: a.why,
      setup_steps: a.setup_steps,
    }));

    // Fill in revealApp if the model didn’t nominate one
    const reveal = p.revealApp || items[0]?.app_name;

    // Cap items to a sane UI maximum first (we’ll inject Boost before final cap)
    const MAX_APPS = 7;
    if (items.length > MAX_APPS) items = items.slice(0, MAX_APPS);

    // === New behavior: guarantee Experian Boost in Growth (Plan B), if requested ===
    if (id === "B" && opts?.ensureGrowthIncludesExperianBoost) {
      const hasBoost = items.some((a) =>
        a.app_name.toLowerCase().includes("experian boost")
      );
      if (!hasBoost) {
        items.push(
          makeAppItem(
            "Experian Boost",
            "https://www.experian.com/consumer/experian-boost.html",
            "Adds eligible utility, phone, and streaming payments to your Experian file for an immediate score lift."
          )
        );
      }
    }

    // Final cap to keep UI predictable
    if (items.length > MAX_APPS) items.length = MAX_APPS;

    // Counts (visible vs locked) – default: 1 visible if reveal exists
    const visibleDefault =
      typeof opts?.defaultUnlockedIndex === "number" ? 1 : reveal ? 1 : 0;
    const counts = {
      visible: p.counts?.visible ?? visibleDefault,
      locked: p.counts?.locked ?? Math.max(0, items.length - (p.counts?.visible ?? visibleDefault)),
    };

    return {
      key: id,
      label: p.label || labelFor(id),
      subtitle: p.subtitle,
      projectedGain: p.projectedGain,
      timeToImpactDays: p.timeToImpactDays,
      counts,
      revealApp: reveal,
      narrative: p.narrative,
      apps: items,
    };
  });

  // Keep plan order A→B→C→D if the model shuffled
  uiPlans.sort((a, b) => orderIndex(a.key) - orderIndex(b.key));

  return { plans: uiPlans };
}

/* ---------- Helpers ---------- */

function labelFor(id: PlanItem["key"]) {
  switch (id) {
    case "A":
      return "Foundation";
    case "B":
      return "Growth";
    case "C":
      return "Accelerator";
    case "D":
    default:
      return "Elite";
  }
}

function orderIndex(id: PlanItem["key"]) {
  return id === "A" ? 0 : id === "B" ? 1 : id === "C" ? 2 : 3;
}
