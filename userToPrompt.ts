// Maps wizard answers to compact, deterministic GPT instructions

export type WizardInput = {
    housing?: "rent" | "mortgage" | "neither" | null;
    subs?: string[];
    tools?: "auto" | "manual" | "not-sure" | null;
    employment?: "employed" | "self-employed" | "unemployed" | "student" | null;
    goal?: "30" | "90" | "flexible" | null;
    budget?: number | string | null;
  };
  
  export function buildSystemMsg() {
    return [
      "You are StackScore Planner.",
      "Return four credit-building plans (A–D).",
      "Output must be strict JSON, no markdown, no commentary.",
      "Each plan includes: title, tagline, boost_range [min,max], expected_time_mins [min,max], monthly_cost_est, apps[].",
      "apps[] items: app_name, app_description, app_category, app_cost, app_url.",
      "Categories to consider: Budgeting, Credit Monitoring, Credit Builder, Banking, Utilities/Rent Reporting, Identity/Fraud, Dispute/Repair, Subscription Tracking.",
      "Prefer reputable US apps. Avoid medical/wellness/fitness content.",
      "Respect user budget: emphasize Free/low-cost if budget < $50.",
    ].join(" ");
  }
  
  export function buildUserMsg(u: WizardInput) {
    const goalDays = u.goal === "30" ? 30 : u.goal === "90" ? 90 : null;
    const budget =
      typeof u.budget === "string" ? Number(u.budget) : (u.budget ?? null);
  
    const prefs: string[] = [];
    if (u.housing === "rent") prefs.push("User rents—prioritize rent/utility reporting apps.");
    if (u.housing === "mortgage") prefs.push("User has a mortgage—rent reporting is not applicable.");
    if (u.subs?.length) prefs.push(`User has subscriptions (${u.subs.join(", ")})—include subscription tracking.`);
    if (u.tools === "auto") prefs.push("Prefers automated, low‑maintenance tools.");
    if (u.tools === "manual") prefs.push("Prefers manual control tools.");
    if (u.employment) prefs.push(`Employment: ${u.employment}.`);
    if (goalDays) prefs.push(`Wants visible results in ~${goalDays} days.`);
    if (budget) prefs.push(`Monthly budget target: ~$${budget}.`);
  
    return [
      "Create four tailored plans (PlanA..PlanD) for this user.",
      prefs.join(" "),
      "Ensure each plan mixes categories and keeps the first app highly actionable.",
    ].join(" ");
  }
  