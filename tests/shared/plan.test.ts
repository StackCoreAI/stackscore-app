import { describe, it, expect } from 'vitest';
// stackscore-app/tests/shared/plan.test.ts
import {
  LLMPlansSchema,
  sanitizeLLM,
  fromLLMPlans,
  validateWizardPayload,
  WizardPayloadSchema,
  hashWizardAnswers,
  AdvisorResponseSchema,
} from '../../shared/plan';


const validLLM = {
  PlanA: { apps: [
    { app_name: "GrowCredit", app_category: "Subscription Reporting", app_description: "Reports Netflix/Spotify", app_cost: "Free", app_url: "https://growcredit.com" },
    { app_name: "Experian Boost", app_category: "Tradeline", app_description: "Adds utilities", app_cost: "Free", app_url: "https://www.experian.com/boost" },
    { app_name: "Self", app_category: "Installment Builder", app_description: "CD + installment", app_cost: "$25/mo", app_url: "https://www.self.inc" },
  ]},
  PlanB: { apps: [
    { app_name: "Chime Credit Builder", app_category: "Secured Card", app_description: "No-fee secured card", app_cost: "Free*", app_url: "https://www.chime.com" },
    { app_name: "GrowCredit", app_category: "Subscription Reporting", app_description: "Duplicate URL check", app_cost: "Free", app_url: "https://growcredit.com" }, // dup URL, should be removed
  ]},
  PlanC: { apps: [
    { app_name: "Mint", app_category: "Budgeting", app_description: "Budgeting app", app_cost: "Free", app_url: "https://www.mint.com" },
    { app_name: "Bad Health App", app_category: "Monitoring", app_description: "Track steps and fitness", app_cost: "Free", app_url: "https://example.com/fitness" }, // blocked by keywords
  ]},
  PlanD: { apps: [
    { app_name: "Tomo", app_category: "Unsecured Card", app_description: "No credit check", app_cost: "Free", app_url: "https://www.tomocredit.com" },
  ]},
};

describe('Zod wire shape & sanitizer', () => {
  it('validates LLMPlansSchema', () => {
    const parsed = LLMPlansSchema.parse(validLLM);
    expect(parsed.PlanA.apps.length).toBeGreaterThan(0);
  });

  it('sanitizeLLM removes blocked/duplicates and caps length', () => {
    const cleaned = sanitizeLLM(validLLM as any);
    const a = cleaned.PlanA.apps;
    const b = cleaned.PlanB.apps;
    const c = cleaned.PlanC.apps;

    // duplicate GrowCredit by URL should be deduped in B
    const bUrls = new Set(b.map(x => x.app_url));
    expect(bUrls.size).toBe(b.length);

    // fitness keyword should be removed in C
    expect(c.find(x => /fitness/i.test(x.app_description))).toBeUndefined();

    // allowed categories preserved
    expect(a.every(x => typeof x.app_category === 'string')).toBe(true);
  });
});

describe('Advisor transform', () => {
  it('fromLLMPlans pads to at least 4 apps and validates final contract', () => {
    const cleaned = sanitizeLLM(validLLM as any);
    const advisor = fromLLMPlans(cleaned, { user: { goal: '30', budget: 45 } });

    // contract validation
    const parsed = AdvisorResponseSchema.parse(advisor);
    expect(parsed.plans.length).toBe(4);

    // each plan 4–7 apps
    for (const plan of parsed.plans) {
      expect(plan.apps.length).toBeGreaterThanOrEqual(4);
      expect(plan.apps.length).toBeLessThanOrEqual(7);
      expect(['A','B','C','D']).toContain(plan.id);
      expect(typeof plan.title).toBe('string');
      expect(typeof plan.summary).toBe('string');
    }
  });
});

describe('Wizard payload validation & hashing', () => {
  it('accepts and normalizes wizard payload', () => {
    const payload = {
      housing: 'rent',
      subs: ['Netflix'],
      tools: 'auto',
      employment: 'employed',
      goal: '90',
      budget: '60',
      remix: true,
      topic: 'CREDIT_STACK',
    };
    const parsed = WizardPayloadSchema.parse(payload);
    expect(parsed.budget).toBe(60); // string -> number transform
  });

  it('hashWizardAnswers is stable', async () => {
    const one = await hashWizardAnswers({ a: 1, b: [2,3] });
    const two = await hashWizardAnswers({ a: 1, b: [2,3] });
    const three = await hashWizardAnswers({ a: 1, b: [3,2] });
    expect(one).toBe(two);
    expect(three).not.toBe(one); // order matters in JSON
  });
});
