import { describe, it, expect } from "vitest";
import { buildPrompt, normalizeWizardPayload } from "../../userToPrompt";

describe("buildPrompt", () => {
  it("normalizes and produces stable strings", () => {
    const payload = {
      housing: "rent",
      subs: ["Netflix"],
      tools: "auto",
      employment: "employed",
      goal: "90",
      budget: "45",
      remix: false,
      topic: "CREDIT_STACK",
    };
    const norm = normalizeWizardPayload(payload);
    expect(norm.budget).toBe(45);

    const a = buildPrompt(norm);
    const b = buildPrompt(norm);
    expect(a.system).toBeTruthy();
    expect(a.user).toBeTruthy();
    expect(a.user).toBe(b.user); // deterministic
  });
});

