// userToPrompt.ts
// Maps wizard answers to compact, deterministic GPT instructions

import { z } from "zod";
import { WizardPayloadSchema } from "./shared/plan";

// ---- Types -----------------------------------------------------------------

// Back-compat for any older callers
export type WizardInput = {
  housing?: "rent" | "mortgage" | "neither" | null;
  subs?: string[];
  tools?: "auto" | "manual" | "not-sure" | null;
  employment?: "employed" | "self-employed" | "unemployed" | "student" | null;
  goal?: "30" | "60" | "90" | "flexible" | null;
  budget?: number | string | null;
  remix?: boolean | null;
  topic?: string | null;
};

export type WizardPayload = z.infer<typeof WizardPayloadSchema>;

// ---- Normalization ---------------------------------------------------------

/** Coerce/validate external input to the canonical WizardPayload. */
export function normalizeWizardPayload(input: unknown): WizardPayload {
  // WizardPayloadSchema already:
  // - coerces budget string -> number
  // - validates enums and defaults
  return WizardPayloadSchema.parse(input);
}

// ---- Prompt Builders -------------------------------------------------------

const ALLOWED_CATEGORIES = [
  "Budgeting",
  "Credit Monitoring",
  "Credit Builder",
  "Banking",
  "Utilities/Rent Reporting",
  "Identity/Fraud",
  "Dispute/Repair",
  "Subscription Tracking",
] as const;

/** System message with strict, model-friendly constraints (deterministic). */
export function buildSystemMsg(): string {
  const parts = [
    "You are StackScore Planner, a credit-building planning assistant.",
    "Return exactly four plans using keys: PlanA, PlanB, PlanC, PlanD.",
    "Output must be strict JSON only (no markdown, no commentary).",
    "Each plan must include: title, summary, apps (array).",
    "Each plan's apps length must be between 4 and 7.",
    "Each app object must include: app_name, app_category, app_description, app_cost, app_url.",
    `app_category must be one of: ${ALLOWED_CATEGORIES.join(", ")}.`,
    "Prefer reputable US apps; avoid fitness/health/wellness unrelated to credit.",
    "Deduplicate apps across all plans by app_url (case-insensitive).",
    "Keep descriptions concise and actionable.",
  ];
  return parts.join(" ");
}

/**
 * Deterministic user message built from a normalized payload.
 * Accepts either raw WizardInput or a canonical WizardPayload.
 */
export function buildUserMsg(raw: WizardInput | WizardPayload): string {
  const p = "budget" in raw ? (raw as WizardPayload) : normalizeWizardPayload(raw);

  // Deterministic ordering & formatting
  const subs = Array.isArray(p.subs) ? [...p.subs].filter(Boolean).sort() : [];
  const goalDays =
    p.goal === "30" ? 30 :
    p.goal === "60" ? 60 :
    p.goal === "90" ? 90 : null;

  // Compact "persona bits" string; order is stable
  const bits: string[] = [
    `housing=${p.housing ?? "unknown"}`,
    `employment=${p.employment ?? "unknown"}`,
    `budget=${Number.isFinite(p.budget) ? (p.budget as number) : "unknown"}`,
    `goal=${p.goal ?? "unknown"}`,
    `tools=${p.tools ?? "unknown"}`,
    `remix=${p.remix ? "yes" : "no"}`,
  ];

  if (p.topic) bits.push(`topic=${p.topic}`);
  if (subs.length) bits.push(`subs=${subs.join(",")}`);

  const persona = bits.join("; ");

  const prefs: string[] = [];
  if (p.housing === "rent") {
    prefs.push("Prioritize Utilities/Rent Reporting apps.");
  } else if (p.housing === "mortgage") {
    prefs.push("Do not include rent-reporting tools that require renting.");
  }

  if (p.tools === "auto") prefs.push("Favor automated, low-maintenance tools.");
  if (p.tools === "manual") prefs.push("Favor manual-control tools.");
  if (goalDays) prefs.push(`Target noticeable progress in ~${goalDays} days.`);
  if (typeof p.budget === "number") {
    if (p.budget < 50) prefs.push("Emphasize free/low-cost options under $50/mo.");
    prefs.push(`Stay near ~$${p.budget}/mo overall.`);
  }
  if (subs.length) prefs.push("Include Subscription Tracking where useful.");

  // Compose the instruction (stable whitespace)
  const instr = [
    "Create four tailored credit-building plans (PlanA..PlanD) for the persona below.",
    `Persona: ${persona}.`,
    "Mix categories across each plan and make the first app highly actionable.",
    prefs.join(" "),
  ].join(" ");

  return instr.replace(/\s+/g, " ").trim();
}

/** Convenience: both messages + a meta echo of the persona for logging. */
export function buildPrompt(raw: WizardInput | WizardPayload): {
  system: string;
  user: string;
  meta: { persona: string };
} {
  const user = buildUserMsg(raw);

  // Recreate the persona string for meta from the user text (safe, deterministic)
  const personaMatch = user.match(/Persona:\s*([^.]*)\./);
  const persona = personaMatch ? personaMatch[1] : "";

  return {
    system: buildSystemMsg(),
    user,
    meta: { persona },
  };
}
