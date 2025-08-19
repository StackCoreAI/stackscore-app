// src/pages/wizard.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ResetBanner from "./resetbanner.jsx";

// Step model (0..5 are counted as "1..6"; 6 is the summary screen)
const STEPS = [
  { key: "housing", type: "radio", required: true },   // 0
  { key: "subs", type: "checkbox", required: false },   // 1 (optional)
  { key: "tools", type: "radio", required: true },      // 2
  { key: "employment", type: "radio", required: true }, // 3
  { key: "goal", type: "radio", required: true },       // 4
  { key: "budget", type: "range", required: true },     // 5
  { key: "ready", type: "none", required: false },      // 6 (summary, not counted)
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

  const countedSteps = 6; // show "Step X of 6" for idx 0..5

  // Floating numbers config (randomized once)
  const floatTokens = useMemo(() => {
    const tok = (text, top, side, pos, size, hue, baseDelay) => ({
      text,
      top,
      side,
      pos,
      size,
      hue,
      delay: +(baseDelay + Math.random() * 0.6).toFixed(2),
      duration: +(2.8 + Math.random() * 1.6).toFixed(2),
    });

    return [
      tok("+25", 0,  "left",  "33%", "text-xl",  "text-lime-400", 0.10),
      tok("+111", 4, "left",  "25%", "text-2xl", "text-lime-300", 0.55),
      tok("+65",  40, "left", "10%", "text-xl",  "text-lime-400", 1.00),
      tok("+53",  64, "left", "50%", "text-2xl", "text-lime-500", 1.45),
      tok("+77",  24, "right","25%", "text-xl",  "text-lime-400", 1.90),
      tok("+121", 80, "right","8%",  "text-xl",  "text-lime-300", 2.35),
    ];
  }, []);

  // Initial load: handle ?fresh=1, restore from localStorage otherwise
  useEffect(() => {
    const url = new URL(window.location.href);
    const fresh = url.searchParams.get("fresh");

    if (fresh === "1") {
      // silent reset on first arrival (no banner)
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
    } catch {
      // ignore
    }

    setTimeout(() => setIsVisible(true), 60);
  }, []);

  // Auto-hide the success banner if/when it is shown
  useEffect(() => {
    if (!resetMsg) return;
    const t = setTimeout(() => setResetMsg(""), 3500);
    return () => clearTimeout(t);
  }, [resetMsg]);

  // Persist helper (also keeps a plain copy at ss_answers for the Preview API)
  const persist = (data, step = currentStep) => {
    try {
      localStorage.setItem("stackscoreUserData", JSON.stringify({ ...data, step }));
      localStorage.setItem("ss_answers", JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  };

  // finalize & go (saves, clears caches, routes to /preview)
  const finalizeAndGo = () => {
    persist(formData, 6);
    try {
      sessionStorage.removeItem("ss_plan");
      sessionStorage.removeItem("ss_selected");
    } catch {}
    navigate("/preview", { replace: true });
  };

  // Controlled inputs
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

  // Validation
  const stepIsValid = (idx) => {
    const meta = STEPS[idx] || {};
    if (!meta.required) return true;
    if (meta.type === "radio") return Boolean(formData[meta.key]);
    if (meta.type === "range") return formData[meta.key] !== "" && formData[meta.key] != null;
    return true;
  };

  // Navigation helpers
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

  // Reset everything; banner shows only if banner=true
  const hardReset = (banner) => {
    try {
      localStorage.removeItem("stackscoreUserData");
      localStorage.removeItem("ss_answers");
      sessionStorage.removeItem("ss_plan");
      sessionStorage.removeItem("ss_selected");
    } catch {
      // ignore
    }
    setFormData(BLANK);
    setPrevStep(-1);
    setCurrentStep(0);
    if (banner) setResetMsg("Your wizard has been reset.");
  };

  const progressPercent =
    (Math.min(currentStep, countedSteps - 1) / (countedSteps - 1)) * 100;

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

      {/* Brand (now clickable) + Reset */}
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
            StackScore
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

      {/* Non-form container */}
      <div
        role="form"
        ref={formRef}
        className={`w-full max-w-xl space-y-6 pb-20 transition-all duration-900 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
        }`}
        autoComplete="off"
      >
        {/* Greeting */}
        <div className="flex items-center space-x-3">
          <img className="w-8 h-8 rounded-full" src="https://i.pravatar.cc/40?img=68" alt="Avatar" />
          <span className="text-neutral-400 text-sm">Welcome back, Joseph</span>
        </div>

        {/* Step dots (hide on summary) */}
        <div
          className={`flex justify-center gap-2 mt-4 ${
            currentStep >= countedSteps ? "invisible" : ""
          }`}
          aria-hidden="true"
        >
          {Array.from({ length: countedSteps }, (_, i) => (
            <span
              key={`dot-${i}`}
              className={`w-2.5 h-2.5 rounded-full ${
                i === currentStep ? "bg-lime-500" : "bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mt-3" aria-hidden="true">
          <div className="bg-lime-500 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Step label */}
        <p
          className={`text-center text-neutral-400 text-sm ${
            currentStep >= countedSteps ? "invisible" : ""
          }`}
          aria-live="polite"
        >
          Step {Math.min(currentStep + 1, countedSteps)} of {countedSteps}
        </p>

        {/* Panels ... */}

        {/* Step 0 */}
        <Panel idx={0}>
          <h2 className="text-2xl font-semibold mb-3">Living situation</h2>

          {/* NEW: gentle instructions / no-charge notice */}
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

          <div
            className={`space-y-4 p-2 rounded-lg ${
              validationMsg && currentStep === 0 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""
            }`}
          >
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
            <button
              type="button"
              onClick={nextFromStep0}
              className="relative z-30 px-6 py-2 rounded-full text-black font-semibold bg-gradient-to-r from-lime-400 to-lime-500 hover:brightness-110 transition-all pointer-events-auto"
            >
              Next
            </button>
          </div>
        </Panel>

        {/* Step 1 (optional) */}
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
                <span className="w-5 h-5 rounded border-2 border-neutral-600 peer-checked:bg-lime-500 peer-checked:border-lime-500 transition-all duration-200 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white hidden peer-checked:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{sub}</span>
              </label>
            ))}
          </div>

          <div className="mt-10 flex justify-between">
            <button
              type="button"
              onClick={goBack}
              className="relative z-30 px-6 py-2 rounded-full border border-white/30 text-white bg-neutral-900 hover:bg-neutral-800 transition-all pointer-events-auto"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="relative z-30 px-6 py-2 rounded-full text-black font-semibold bg-gradient-to-r from-lime-400 to-lime-500 hover:brightness-110 transition-all pointer-events-auto"
            >
              Next
            </button>
          </div>
        </Panel>

        {/* Step 2 */}
        <Panel idx={2}>
          <h2 className="text-2xl font-semibold mb-6">Tool preference</h2>
          <div
            className={`space-y-4 p-2 rounded-lg ${
              validationMsg && currentStep === 2 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""
            }`}
          >
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
            <button
              type="button"
              onClick={goBack}
              className="relative z-30 px-6 py-2 rounded-full border border-white/30 text-white bg-neutral-900 hover:bg-neutral-800 transition-all pointer-events-auto"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="relative z-30 px-6 py-2 rounded-full text-black font-semibold bg-gradient-to-r from-lime-400 to-lime-500 hover:brightness-110 transition-all pointer-events-auto"
            >
              Next
            </button>
          </div>
        </Panel>

        {/* Step 3 */}
        <Panel idx={3}>
          <h2 className="text-2xl font-semibold mb-6">Employment status</h2>
          <div
            className={`space-y-4 p-2 rounded-lg ${
              validationMsg && currentStep === 3 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""
            }`}
          >
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
            <button
              type="button"
              onClick={goBack}
              className="relative z-30 px-6 py-2 rounded-full border border-white/30 text-white bg-neutral-900 hover:bg-neutral-800 transition-all pointer-events-auto"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="relative z-30 px-6 py-2 rounded-full text-black font-semibold bg-gradient-to-r from-lime-400 to-lime-500 hover:brightness-110 transition-all pointer-events-auto"
            >
              Next
            </button>
          </div>
        </Panel>

        {/* Step 4 */}
        <Panel idx={4}>
          <h2 className="text-2xl font-semibold mb-6">Goal timeline</h2>
          <div
            className={`space-y-4 p-2 rounded-lg ${
              validationMsg && currentStep === 4 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""
            }`}
          >
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
            <button
              type="button"
              onClick={goBack}
              className="relative z-30 px-6 py-2 rounded-full border border-white/30 text-white bg-neutral-900 hover:bg-neutral-800 transition-all pointer-events-auto"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="relative z-30 px-6 py-2 rounded-full text-black font-semibold bg-gradient-to-r from-lime-400 to-lime-500 hover:brightness-110 transition-all pointer-events-auto"
            >
              Next
            </button>
          </div>
        </Panel>

        {/* Step 5 */}
        <Panel idx={5}>
          <h2 className="text-2xl font-semibold mb-6">What's your StackScore budget?</h2>
          <p className="text-neutral-400 mb-8">
            Tell us what you can comfortably invest monthly. We'll customize
            your plan to give you the most boost for your budget.
          </p>
          <div
            className={`p-2 rounded-lg ${
              validationMsg && currentStep === 5 ? "ring-2 ring-amber-400/70 bg-amber-400/5" : ""
            }`}
          >
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
            <p className="mt-4 text-lg font-medium text-center">
              ${formData.budget} / month
            </p>
            <p className="mt-2 text-sm text-neutral-400 text-center">
              {budgetLabel(formData.budget)}
            </p>
            {validationMsg && currentStep === 5 && (
              <p id="step5-error" role="alert" className="mt-3 text-sm text-amber-300 text-center">
                {validationMsg}
              </p>
            )}
          </div>

          <div className="mt-10 flex justify-between">
            <button
              type="button"
              onClick={goBack}
              className="relative z-30 px-6 py-2 rounded-full border border-white/30 text-white bg-neutral-900 hover:bg-neutral-800 transition-all pointer-events-auto"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="relative z-30 px-6 py-2 rounded-full text-black font-semibold bg-gradient-to-r from-lime-400 to-lime-500 hover:brightness-110 transition-all pointer-events-auto"
            >
              Next
            </button>
          </div>
        </Panel>

        {/* Step 6 (summary / ready) */}
        <Panel idx={6}>
          <div className="text-center space-y-10 max-w-md mx-auto">
            {/* Floating numbers banner */}
            <div
              className="pointer-events-none w-full select-none relative"
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

            <h1 className="text-3xl font-bold -mt-2 mb-1">Your Stack is Ready</h1>
            <p className="text-lg text-gray-400 mb-2">
              Here's the custom lineup of apps we've prepared to help you
              boost your credit score.
            </p>

            <div className="flex flex-col gap-4 items-stretch">
              {[
                "SUBSCRIPTION TRACKERS",
                "CREDIT BUILDERS",
                "DISPUTE TOOLS",
                "UTILITY REPORTING",
                "AI INSIGHTS",
              ].map((item, i) => (
                <div
                  key={item}
                  className="h-14 flex items-center justify-center rounded-lg bg-gradient-to-b from-neutral-800 to-neutral-900 border-4 border-lime-500 text-slate-300 font-bold tracking-wider text-sm uppercase animate-pulse shadow-lg shadow-lime-500/25"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {item}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={finalizeAndGo}
              className="relative z-30 inline-block px-6 py-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-semibold rounded-full hover:brightness-110 transition pointer-events-auto"
            >
              🚀 View Your Plans
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
