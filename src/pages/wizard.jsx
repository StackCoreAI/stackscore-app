// src/pages/wizard.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ResetBanner from "./resetbanner.jsx";
import Button from "@/components/ui/Button";

const STEPS = [
  { key: "housing", type: "radio", required: true },
  { key: "subs", type: "checkbox", required: false },
  { key: "tools", type: "radio", required: true },
  { key: "employment", type: "radio", required: true },
  { key: "goal", type: "radio", required: true },
  { key: "budget", type: "range", required: true },
  { key: "ready", type: "none", required: false },
];

const BLANK = {
  housing: "",
  subs: [],
  tools: "",
  employment: "",
  goal: "",
  budget: "45",
};

export default function Wizard() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [formData, setFormData] = useState(BLANK);
  const [currentStep, setCurrentStep] = useState(0);
  const [prevStep, setPrevStep] = useState(-1);
  const [validationMsg, setValidationMsg] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const countedSteps = 6;

  const floatTokens = useMemo(() => {
    const tok = (text, top, side, pos, size, hue, baseDelay) => ({
      text, top, side, pos, size, hue,
      delay: +(baseDelay + Math.random() * 0.6).toFixed(2),
      duration: +(2.8 + Math.random() * 1.6).toFixed(2),
    });

    return [
      tok("+25", 0,  "left",  "33%", "text-xl",  "text-lime-400", 0.10),
      tok("+109", 4, "left",  "25%", "text-2xl", "text-lime-300", 0.55),  
      tok("+65",  40, "left", "10%", "text-xl",  "text-lime-400", 1.00),
      tok("+53",  64, "left", "50%", "text-2xl", "text-lime-500", 1.45),
      tok("+77",  24, "right","25%", "text-xl",  "text-lime-400", 1.90),
      tok("+121", 80, "right","8%",  "text-xl",  "text-lime-300", 2.35),
    ];
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const reset = url.searchParams.get("reset");
    const fresh = url.searchParams.get("fresh");

    if (reset === "1") {
      hardReset(false);
      url.searchParams.delete("reset");
      window.history.replaceState({}, "", url.toString());
      setTimeout(() => setIsVisible(true), 60);
      return;
    }

    if (fresh === "1") {
      hardReset(false);
      url.searchParams.delete("fresh");
      window.history.replaceState({}, "", url.toString());
      setTimeout(() => setIsVisible(true), 60);
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem("stackscoreUserData") || "{}");
      if (saved && typeof saved === "object") {
        setFormData((p) => ({ ...p, ...saved }));
        if (typeof saved.step === "number") setCurrentStep(saved.step);
      }
    } catch {}

    setTimeout(() => setIsVisible(true), 60);
  }, []);

  useEffect(() => {
    if (!resetMsg) return;
    const t = setTimeout(() => setResetMsg(""), 3500);
    return () => clearTimeout(t);
  }, [resetMsg]);

  const persist = (data, step = currentStep) => {
    try {
      localStorage.setItem("stackscoreUserData", JSON.stringify({ ...data, step }));
      localStorage.setItem("ss_answers", JSON.stringify(data));
    } catch {}
  };

  const finalizeAndGo = () => {
    persist(formData, 6);
    try {
      sessionStorage.removeItem("ss_plan");
      sessionStorage.removeItem("ss_selected");
    } catch {}
    navigate("/preview", { replace: true });
  };

  const handleInputChange = (name, value, isCheckbox = false) => {
    setValidationMsg("");
    setFormData((prev) => {
      let next = prev;
      if (isCheckbox) {
        const s = new Set(prev[name] || []);
        s.has(value) ? s.delete(value) : s.add(value);
        next = { ...prev, [name]: Array.from(s) };
      } else {
        next = { ...prev, [name]: value };
      }
      persist(next);
      return next;
    });
  };

  const stepIsValid = (idx) => {
    const meta = STEPS[idx] || {};
    if (!meta.required) return true;
    if (meta.type === "radio") return Boolean(formData[meta.key]);
    if (meta.type === "range") return formData[meta.key] !== "" && formData[meta.key] != null;
    return true;
  };

  const goToStep = (idx) => {
    setPrevStep(currentStep);
    setCurrentStep(idx);
    persist(formData, idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextFromStep0 = () => {
    if (!formData.housing) {
      setValidationMsg("Please make a selection to continue.");
      formRef.current?.querySelector('input[name="housing"]')?.focus();
      return;
    }
    goToStep(1);
  };

  const nextStep = () => {
    if (!stepIsValid(currentStep)) {
      setValidationMsg("Please make a selection to continue.");
      const stepEl = formRef.current?.querySelector(`[data-step="${currentStep}"]`);
      stepEl?.querySelector("input")?.focus();
      return;
    }
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) goToStep(currentStep - 1);
  };

  const hardReset = (banner) => {
    try {
      localStorage.removeItem("stackscoreUserData");
      localStorage.removeItem("ss_answers");
      sessionStorage.removeItem("ss_plan");
      sessionStorage.removeItem("ss_selected");
    } catch {}
    setFormData(BLANK);
    setPrevStep(-1);
    setCurrentStep(0);
    if (banner) setResetMsg("Your wizard has been reset.");
  };

  const progressPercent = (Math.min(currentStep, countedSteps) / countedSteps) * 100;

  const budgetLabel = (v) => {
    const n = Number(v || 0);
    if (n >= 100) return "Max Stack";
    if (n >= 50) return "Core Stack";
    return "Lite Stack";
  };

  const Panel = ({ idx, children }) => {
    const isActive = idx === currentStep;
    const isExiting = idx === prevStep;
    const cls =
      "wizard-panel " +
      (isActive
        ? "active z-20 pointer-events-auto"
        : isExiting
        ? "exiting z-10 pointer-events-none"
        : "z-0 pointer-events-none");

    return (
      <section className={cls} data-step={idx}>
        {children}
      </section>
    );
  };

  return (
    <div className="h-full bg-gray-900 text-gray-100 flex items-center justify-center min-h-screen p-4 pt-8">
      {resetMsg && <ResetBanner message={resetMsg} />}

      <div className="absolute top-8 left-4 flex items-center gap-3 z-50">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70"
          aria-label="Back to Home"
        >
          <svg
            className="text-lime-400"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M4 4h16v3H4z"></path>
            <path d="M4 10.5h16v3H4z"></path>
            <path d="M4 17h16v3H4z"></path>
          </svg>
          <span className="text-lg font-semibold tracking-tight text-white">
            CreditRoute
          </span>
        </button>

        <button
          type="button"
          onClick={() => hardReset(true)}
          className="ml-4 text-sm underline text-white/70 hover:text-white"
        >
          Reset
        </button>
      </div>

      <div
        role="form"
        ref={formRef}
        className={`w-full max-w-xl space-y-6 pb-20 transition-all duration-900 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
        }`}
        autoComplete="off"
      >
<div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
  <div className="flex flex-wrap items-center gap-2">
    <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-lime-500/10 px-3 py-1 text-xs font-semibold text-lime-300">
      🧭 CreditRoute
    </span>
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
      🧬 Feature Recombination
    </span>
    <span className="ml-auto text-xs text-white/50">
      Takes &lt; 60 seconds • No credit pull
    </span>
  </div>

  <p className="mt-2 text-sm text-white/70">
    We only analyze your habits and preferences — then recombine the strongest reporting features across apps and sequence them into your CreditRoute.
  </p>
</div>

        <div
          className={`flex justify-center gap-2 mt-4 ${currentStep >= countedSteps ? "invisible" : ""}`}
          aria-hidden="true"
        >
          {Array.from({ length: countedSteps }, (_, i) => (
            <span
              key={`dot-${i}`}
              className={`w-2.5 h-2.5 rounded-full ${i === currentStep ? "bg-lime-500" : "bg-gray-600"}`}
            />
          ))}
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mt-3" aria-hidden="true">
          <div className="bg-lime-500 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        <p
          className={`text-center text-neutral-400 text-sm ${currentStep >= countedSteps ? "invisible" : ""}`}
          aria-live="polite"
        >
          Step {Math.min(currentStep + 1, countedSteps)} of {countedSteps}
        </p>

        <Panel idx={0}>
          <h2 className="text-2xl font-semibold mb-3">Living situation</h2>

          <div className="mb-6 rounded-lg border border-neutral-700 bg-neutral-800/60 px-4 py-3 text-sm text-neutral-300">
            <p className="font-medium">How this works</p>
            <ul className="mt-1 ml-5 list-disc space-y-1">
              <li>Complete these 6 quick steps (about a minute).</li>
              <li>
                <span className="font-medium text-lime-400">No charge yet.</span> You’ll only pay if you
                decide to <em>unlock</em> your plan after choosing the Score Impact you want
                (Lite / Core / Max) on the results screen.
              </li>
            </ul>
          </div>

          <div className={`space-y-4 p-2 rounded-lg ${validationMsg && currentStep === 0 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""}`}>
            {["rent", "mortgage", "neither"].map((opt) => (
              <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="housing"
                  value={opt}
                  checked={formData.housing === opt}
                  onChange={() => handleInputChange("housing", opt)}
                  className="sr-only peer"
                  aria-invalid={!!validationMsg && currentStep === 0}
                  aria-describedby={validationMsg && currentStep === 0 ? "step0-error" : undefined}
                />
                <span className="w-5 h-5 rounded-full border-2 border-neutral-600 peer-checked:ring-4 peer-checked:ring-lime-500 peer-checked:bg-lime-500 transition-all duration-200"></span>
                <span className="capitalize">{opt}</span>
              </label>
            ))}
            {validationMsg && currentStep === 0 && (
              <p id="step0-error" role="alert" className="mt-3 text-sm text-amber-300">
                {validationMsg}
              </p>
            )}
          </div>

          <div className="mt-10 flex justify-end">
            <Button size="md" onClick={nextFromStep0}>Next</Button>
          </div>
        </Panel>

        <Panel idx={1}>
          <h2 className="text-2xl font-semibold mb-6">Entertainment subscriptions</h2>
          <div className="space-y-4">
            {["Netflix", "Spotify", "HBO Max", "Disney+"].map((sub) => (
              <label key={sub} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="subs"
                  value={sub}
                  checked={formData.subs.includes(sub)}
                  onChange={(e) => handleInputChange("subs", e.target.value, true)}
                  className="sr-only peer"
                />
                <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-neutral-600 transition-all duration-200 peer-checked:border-lime-500 peer-checked:bg-lime-500">
                  <svg
  className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="3"
>
  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
</svg>
                </span>
                <span>{sub}</span>
              </label>
            ))}
          </div>

          <div className="mt-10 flex justify-between">
            <Button variant="secondary" size="md" onClick={goBack}>Back</Button>
            <Button size="md" onClick={nextStep}>Next</Button>
          </div>
        </Panel>

        <Panel idx={2}>
          <h2 className="text-2xl font-semibold mb-6">Tool preference</h2>
          <div className={`space-y-4 p-2 rounded-lg ${validationMsg && currentStep === 2 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""}`}>
            {[
              { value: "auto", label: "Automated (recommended)" },
              { value: "manual", label: "Manual" },
              { value: "not-sure", label: "Not sure" },
            ].map((o) => (
              <label key={o.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="tools"
                  value={o.value}
                  checked={formData.tools === o.value}
                  onChange={(e) => handleInputChange("tools", e.target.value)}
                  className="sr-only peer"
                  aria-invalid={!!validationMsg && currentStep === 2}
                  aria-describedby={validationMsg && currentStep === 2 ? "step2-error" : undefined}
                />
                <span className="w-5 h-5 rounded-full border-2 border-neutral-600 peer-checked:ring-4 peer-checked:ring-lime-500 peer-checked:bg-lime-500 transition-all duration-200"></span>
                <span>{o.label}</span>
              </label>
            ))}
            {validationMsg && currentStep === 2 && (
              <p id="step2-error" role="alert" className="mt-3 text-sm text-amber-300">
                {validationMsg}
              </p>
            )}
          </div>

          <div className="mt-10 flex justify-between">
            <Button variant="secondary" size="md" onClick={goBack}>Back</Button>
            <Button size="md" onClick={nextStep}>Next</Button>
          </div>
        </Panel>

        <Panel idx={3}>
          <h2 className="text-2xl font-semibold mb-6">Employment status</h2>
          <div className={`space-y-4 p-2 rounded-lg ${validationMsg && currentStep === 3 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""}`}>
            {["employed", "self-employed", "unemployed", "student"].map((s) => (
              <label key={s} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="employment"
                  value={s}
                  checked={formData.employment === s}
                  onChange={(e) => handleInputChange("employment", e.target.value)}
                  className="sr-only peer"
                  aria-invalid={!!validationMsg && currentStep === 3}
                  aria-describedby={validationMsg && currentStep === 3 ? "step3-error" : undefined}
                />
                <span className="w-5 h-5 rounded-full border-2 border-neutral-600 peer-checked:ring-4 peer-checked:ring-lime-500 peer-checked:bg-lime-500 transition-all duration-200"></span>
                <span className="capitalize">{s.replace("-", " ")}</span>
              </label>
            ))}
            {validationMsg && currentStep === 3 && (
              <p id="step3-error" role="alert" className="mt-3 text-sm text-amber-300">
                {validationMsg}
              </p>
            )}
          </div>

          <div className="mt-10 flex justify-between">
            <Button variant="secondary" size="md" onClick={goBack}>Back</Button>
            <Button size="md" onClick={nextStep}>Next</Button>
          </div>
        </Panel>

        <Panel idx={4}>
          <h2 className="text-2xl font-semibold mb-6">Goal timeline</h2>
          <div className={`space-y-4 p-2 rounded-lg ${validationMsg && currentStep === 4 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""}`}>
            {[
              { value: "30", label: "ASAP (30 days)" },
              { value: "90", label: "90 Days" },
              { value: "flexible", label: "Flexible" },
            ].map((g) => (
              <label key={g.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="goal"
                  value={g.value}
                  checked={formData.goal === g.value}
                  onChange={(e) => handleInputChange("goal", e.target.value)}
                  className="sr-only peer"
                  aria-invalid={!!validationMsg && currentStep === 4}
                  aria-describedby={validationMsg && currentStep === 4 ? "step4-error" : undefined}
                />
                <span className="w-5 h-5 rounded-full border-2 border-neutral-600 peer-checked:ring-4 peer-checked:ring-lime-500 peer-checked:bg-lime-500 transition-all duration-200"></span>
                <span>{g.label}</span>
              </label>
            ))}
            {validationMsg && currentStep === 4 && (
              <p id="step4-error" role="alert" className="mt-3 text-sm text-amber-300">
                {validationMsg}
              </p>
            )}
          </div>

          <div className="mt-10 flex justify-between">
            <Button variant="secondary" size="md" onClick={goBack}>Back</Button>
            <Button size="md" onClick={nextStep}>Next</Button>
          </div>
        </Panel>

        <Panel idx={5}>
          <h2 className="text-2xl font-semibold mb-6">What's your CreditRoute budget?</h2>
          <p className="mb-8 text-neutral-400">
            Tell us what you can comfortably invest monthly. We'll customize
            your plan to give you the most boost for your budget.
          </p>
          <div className={`p-2 rounded-lg ${validationMsg && currentStep === 5 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""}`}>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={formData.budget}
              onChange={(e) => handleInputChange("budget", e.target.value)}
              className="w-full accent-lime-500"
              aria-invalid={!!validationMsg && currentStep === 5}
              aria-describedby={validationMsg && currentStep === 5 ? "step5-error" : undefined}
            />
            <p className="mt-4 text-center text-lg font-medium">
              ${formData.budget} / month
            </p>
            <p className="mt-2 text-center text-sm text-neutral-400">
              {budgetLabel(formData.budget)}
            </p>
            {validationMsg && currentStep === 5 && (
              <p id="step5-error" role="alert" className="mt-3 text-center text-sm text-amber-300">
                {validationMsg}
              </p>
            )}
          </div>

          <div className="mt-10 flex justify-between">
            <Button variant="secondary" size="md" onClick={goBack}>Back</Button>
            <Button size="md" onClick={nextStep}>Next</Button>
          </div>
        </Panel>

        <Panel idx={6}>
          <div className="mx-auto max-w-md space-y-10 text-center">
            <div
              className="pointer-events-none relative w-full select-none"
              style={{ margin: "-20px 0", height: "3.5rem" }}
              aria-hidden="true"
            >
              {floatTokens.map((f, i) => {
                const style = {
                  top: `${f.top}px`,
                  [f.side]: f.pos,
                  ["--delay"]: `${f.delay}s`,
                  ["--duration"]: `${f.duration}s`,
                  animationDelay: `${f.delay}s`,
                };
                return (
                  <span
                    key={`float-${i}`}
                    className={`ss-floating-number absolute ${f.size} font-bold ${f.hue}`}
                    style={style}
                  >
                    {f.text}
                  </span>
                );
              })}
            </div>

            <h1 className="mb-1 -mt-2 text-3xl font-bold">Your CreditRoute Is Ready</h1>
<p className="mb-2 text-lg text-gray-400">
  Here's the custom lineup of apps we've prepared to help you boost your credit score.
</p>

            <div className="flex flex-col items-stretch gap-4">
  {[
    "SUBSCRIPTION TRACKERS",
    "CREDIT BUILDERS",
    "DISPUTE TOOLS",
    "UTILITY REPORTING",
    "AI INSIGHTS",
  ].map((item) => (
    <div
      key={item}
      className="flex h-14 items-center justify-center rounded-xl border border-lime-400/60 bg-white/[0.03] text-sm font-semibold uppercase tracking-wider text-white/70 shadow-[0_0_0_1px_rgba(163,230,53,0.15)]"
    >
      {item}
    </div>
  ))}
</div>

            <Button size="lg" onClick={finalizeAndGo}>
  🧭 View My CreditRoutes
</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
