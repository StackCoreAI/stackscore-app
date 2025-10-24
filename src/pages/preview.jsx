// src/pages/preview.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, BarChart3, Rocket, Crown, Info } from "lucide-react";
import Loader from "../components/Loader.jsx";
import PreviewHeader from "../components/PreviewHeader.jsx";
import PlanGrid from "../components/PlanGrid.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import Button from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/* Stack metadata (names/icons/accents)                               */
/* ------------------------------------------------------------------ */
const STACKS = [
  { key: "foundation",  name: "Foundation",  icon: Layers,    accent: "ring-lime-400"  },
  { key: "growth",      name: "Growth",      icon: BarChart3, accent: "ring-cyan-400"  },
  { key: "accelerator", name: "Accelerator", icon: Rocket,    accent: "ring-sky-400"   },
  { key: "elite",       name: "Elite",       icon: Crown,     accent: "ring-amber-400" },
];
const STACK_BY_KEY = Object.fromEntries(STACKS.map((s) => [s.key, s]));

/* ------------------------------------------------------------------ */
/* Answers helpers (chips only; no PII)                                */
/* ------------------------------------------------------------------ */
const BLANK = { housing: "", subs: [], tools: "", employment: "", goal: "", budget: "45" };

function loadAnswers() {
  try {
    const raw =
      localStorage.getItem("stackscoreUserData") ||
      localStorage.getItem("ss_answers") ||
      localStorage.getItem("stackscore_answers");
    if (!raw) return null;
    return { ...BLANK, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function answersForApi(a) {
  if (!a) return {};
  return {
    living: a.living || a.housing || "",
    budget: a.budget || "",
    timeline: a.timeline || a.goal || "",
    employment: a.employment || "",
    rent_backdate: a.rent_backdate || "",
  };
}

/* ------------------------------------------------------------------ */
/* “Why these apps” explainer                                          */
/* ------------------------------------------------------------------ */
function rationaleLines(a) {
  const out = [];
  const living = (a?.living || a?.housing || "").toLowerCase();
  const budget = (a?.budget || "").toLowerCase();
  const timeline = (a?.timeline || a?.goal || "").toLowerCase();
  const employment = (a?.employment || "").toLowerCase();
  const backdate = (a?.rent_backdate || "").toLowerCase();

  if (timeline.includes("asap") || timeline.includes("fast"))
    out.push("Fast timeline → we prioritize instant-impact utilities and low-friction builders.");
  else if (timeline.includes("steady"))
    out.push("Steady timeline → we emphasize installment builders that compound over time.");
  else if (timeline.includes("aggressive"))
    out.push("Aggressive goal → we add dispute automation + 4–5 item stacks.");

  if (living.includes("rent"))
    out.push("Renter → rent-reporting options are included, with backdating when available.");
  if (living.includes("own"))
    out.push("Homeowner → utilities/streaming reporting used for quick tradelines.");

  if (budget.includes("$0") || budget.includes("0") || budget.includes("free"))
    out.push("Budget-sensitive → free/low-cost options are ranked higher.");
  else if (budget.includes("10")) out.push("Budget ≈ $10–$25 → mid-tier builders are considered.");
  else out.push("Flexible budget → broader mix of builders is considered.");

  if (employment.includes("self"))
    out.push("Self-employed → prefer low-doc / bank-link friendly builders.");
  if (employment.includes("employ")) out.push("Employed → any builder types are suitable.");

  if (backdate.includes("yes"))
    out.push("Backdate requested → rent reporters that support backdating are prioritized.");

  if (!out.length) out.push("Your answers drive the picks: timeline, living situation, budget, employment, and rent backdate.");
  return out;
}

/* ------------------------------------------------------------------ */
/* API: Netlify Function calls                                         */
/* ------------------------------------------------------------------ */
async function fetchStackPlan(stackKey, answers) {
  const res = await fetch("/.netlify/functions/generate-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ stackKey, answers: answersForApi(answers) }),
  });
  const text = await res.text();
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    console.error("Preview → Plan API returned non-JSON:", text.slice(0, 200));
    throw new Error("Plan API returned HTML/invalid JSON");
  }
  return JSON.parse(text);
}

async function buildPlanSet(answers) {
  const keys = ["foundation", "growth", "accelerator", "elite"];
  const results = await Promise.all(keys.map((k) => fetchStackPlan(k, answers).catch((e) => ({ error: e }))));

  const plans = keys.map((k, i) => {
    const meta = STACK_BY_KEY[k] || {};
    const data = results[i] || {};
    const apps = Array.isArray(data?.apps) ? data.apps.slice(0, 5) : [];
    return {
      key: k,
      displayName: meta.name,
      icon: meta.icon || BarChart3,
      accent: meta.accent || "ring-cyan-400",
      apps,
    };
  });

  return { plans };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function Preview() {
  const nav = useNavigate();

  const [answers, setAnswers] = useState(null);
  const [planSet, setPlanSet] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(
    Number(sessionStorage.getItem("ss_refreshed_at") || 0) || undefined
  );
  const [unlocking, setUnlocking] = useState(false);
  const [unlockErr, setUnlockErr] = useState("");

  // 🔑 Email capture state
  const [email, setEmail] = useState(() => localStorage.getItem("ss_email") || "");
  const [showEmail, setShowEmail] = useState(false);
  const [emailErr, setEmailErr] = useState("");

  const runFetch = useCallback(async (useAnswers) => {
    setStatus("loading");
    try {
      const data = await buildPlanSet(useAnswers);
      setPlanSet(data);

      sessionStorage.setItem("ss_plan", JSON.stringify(data));
      const t = Date.now();
      setRefreshedAt(t);
      sessionStorage.setItem("ss_refreshed_at", String(t));

      setStatus("done");
    } catch (e) {
      console.error("Plan load failed:", e);
      setError(e.message || "Failed to load plan");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const a = loadAnswers();
    setAnswers(a);

    const cached = sessionStorage.getItem("ss_plan");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setPlanSet(parsed);
        const t = Number(sessionStorage.getItem("ss_refreshed_at") || 0);
        if (t) setRefreshedAt(t);
        setStatus("done");
        return;
      } catch {}
    }
    runFetch(a);
  }, [runFetch]);

  function handleRefresh(updates) {
    const merged = { ...(answers || {}), ...(updates || {}) };
    setAnswers(merged);
    try {
      localStorage.setItem("stackscoreUserData", JSON.stringify({ ...merged, step: 6 }));
      localStorage.setItem("ss_answers", JSON.stringify(merged));
      localStorage.setItem("stackscore_answers", JSON.stringify(merged));
      sessionStorage.removeItem("ss_plan");
    } catch {}
    runFetch(merged);
  }

  const editAnswers = () => nav("/wizard", { replace: false });

  const resetAll = () => {
    try {
      localStorage.removeItem("stackscoreUserData");
      localStorage.removeItem("ss_answers");
      localStorage.removeItem("stackscore_answers");
      sessionStorage.removeItem("ss_plan");
      sessionStorage.removeItem("ss_selected");
      sessionStorage.removeItem("ss_refreshed_at");
    } catch {}
    nav("/wizard?fresh=1", { replace: true });
  };

  const isValidEmail = (v) => /\S+@\S+\.\S+/.test(String(v || "").trim());

  async function handleUnlockClick() {
    setUnlockErr("");
    const clean = String(email || "").trim();
    if (!isValidEmail(clean)) {
      setEmailErr("Please enter a valid email.");
      setShowEmail(true);
      return;
    }

    setUnlocking(true);
    try {
      localStorage.setItem("ss_email", clean);
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: "growth",
          plan: "growth",
          email: clean,
          customer_email: clean,
          source: "stackscore-web",
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.url) {
        const msg = payload?.error || `Checkout failed (${res.status}). Please try again.`;
        throw new Error(msg);
      }
      window.location.href = payload.url;
    } catch (e) {
      console.error(e);
      setUnlockErr(e?.message || "Couldn’t start checkout. Please try again.");
      setUnlocking(false);
    }
  }

  const lines = rationaleLines(answers || {});
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-white">
      <SiteHeader />
      <main className="flex-1">
        <PreviewHeader
          answers={answers || {}}
          refreshedAt={refreshedAt}
          onEdit={editAnswers}
          onReset={resetAll}
          onRefresh={handleRefresh}
        />

        <div className="mx-auto max-w-5xl px-4 pb-10">
          {status === "loading" && (
            <div className="mt-6">
              <Loader label="Crunching your answers and assembling your stacks…" />
            </div>
          )}

          {status === "error" && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200/30 bg-red-500/10 p-4 text-red-300"
            >
              Couldn’t load your stacks. <span className="font-medium">Please try again.</span>
              <div className="mt-1 text-xs opacity-80">Details: {error}</div>
            </div>
          )}

          {status === "done" && planSet && (
            <>
              <div className="mt-6">
                <PlanGrid
                  plans={planSet.plans}
                  fallbackStack={planSet.stack}
                  onUnlock={handleUnlockClick}
                />
              </div>

              {/* Why these apps (explainer) */}
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-emerald-300" />
                  <h3 className="text-sm font-semibold text-white">Why these apps</h3>
                </div>
                <p className="text-sm text-neutral-300">
                  Your stack is personalized from your answers. We balance quick impact with durable growth and cost.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-neutral-300 list-disc pl-5">
                  {lines.map((l, i) => (<li key={i}>{l}</li>))}
                </ul>
                <p className="mt-2 text-xs text-neutral-400">
                  Foundation emphasizes utilities + builders, Growth adds installment depth, Accelerator layers dispute automation,
                  and Elite adds higher-leverage tradelines alongside builders.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  onClick={handleUnlockClick}
                  disabled={unlocking}
                  title="Unlock all apps and download your digital brief"
                >
                  {unlocking ? "Redirecting…" : "Unlock your optimized stack"}
                </Button>
                {unlockErr && <span className="text-sm text-red-300">{unlockErr}</span>}
              </div>
            </>
          )}

          {/* Utility actions */}
          <div className="mt-10 flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={editAnswers}>
              Make changes
            </Button>
            <Button
              variant="secondary" size="sm"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Scroll to top
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />

      {/* Email capture modal */}
      {showEmail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-5">
            <h3 className="text-lg font-semibold">Where should we send your link?</h3>
            <p className="mt-1 text-sm text-neutral-400">
              We’ll email your checkout link and a copy of your StackScore brief.
            </p>

            <div className="mt-4">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 outline-none focus:border-emerald-400"
              />
              {emailErr && <div className="mt-2 text-sm text-amber-300">{emailErr}</div>}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowEmail(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  const clean = String(email || "").trim();
                  const ok = /\S+@\S+\.\S+/.test(clean);
                  if (!ok) {
                    setEmailErr("Please enter a valid email.");
                    return;
                  }
                  localStorage.setItem("ss_email", clean);
                  setShowEmail(false);
                  handleUnlockClick();
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
