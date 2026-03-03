// src/pages/preview.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import PreviewHeader from "../components/PreviewHeader.jsx";
import PlanGrid from "../components/PlanGrid.jsx";
import Button from "@/components/ui/Button";

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
    const data = results[i] || {};
    const apps = Array.isArray(data?.apps) ? data.apps.slice(0, 5) : [];
    return { key: k, displayName: k[0].toUpperCase() + k.slice(1), apps };
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
  const [pendingStackKey, setPendingStackKey] = useState("growth");

  // Prevent double checkout session creation
  const checkoutInFlight = useRef(false);

  // ✅ Extra-clean: reset "Redirecting..." when coming back from Stripe (bfcache) or returning to tab
  useEffect(() => {
    const resetUnlockUI = () => {
      checkoutInFlight.current = false;
      setUnlocking(false);
      setUnlockErr("");
    };

    const onPageShow = () => resetUnlockUI(); // back-button restore
    const onVisibility = () => {
      if (!document.hidden) resetUnlockUI();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const runFetch = useCallback(async (useAnswers) => {
    setError("");
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
      setError(e?.message || "Failed to load plan");
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
        if (parsed?.plans) {
          setPlanSet(parsed);
          const t = Number(sessionStorage.getItem("ss_refreshed_at") || 0);
          if (t) setRefreshedAt(t);
          setStatus("done");
          return;
        }
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

  // ✅ Called from per-card unlock buttons (PlanGrid passes stackKey)
  function startUnlock(stackKey = "growth") {
    setPendingStackKey(stackKey);
    beginCheckout(stackKey);
  }

  async function beginCheckout(stackKey = "growth") {
    // Double-fire protection
    if (checkoutInFlight.current) return;
    checkoutInFlight.current = true;

    setUnlocking(true);
    setUnlockErr("");

    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ stackKey }),
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
      checkoutInFlight.current = false; // allow retry
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-white">
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
              <Loader label="Crunching your answers and assembling your routes…" />
            </div>
          )}

          {status === "error" && (
            <div role="alert" className="mt-6 rounded-xl border border-red-200/30 bg-red-500/10 p-4 text-red-300">
              Couldn’t load your routes. <span className="font-medium">Please try again.</span>
              <div className="mt-1 text-xs opacity-80">Details: {error}</div>

              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => runFetch(answers)}>
                  Try again
                </Button>
                <Button variant="secondary" size="sm" onClick={editAnswers}>
                  Edit answers
                </Button>
              </div>
            </div>
          )}

          {status === "done" && planSet && (
            <>
              <div className="mt-6">
                <PlanGrid plans={planSet.plans} fallbackStack={planSet.stack} onUnlock={startUnlock} />
              </div>

              {/* Your Activation Includes */}
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="text-sm font-semibold text-white">Your Activation Includes</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 text-sm text-neutral-300">
                  <ul className="space-y-1 list-disc pl-5">
                    <li>Immediate access to your full Credit Route</li>
                    <li>Smart reroutes if an app isn’t available</li>
                  </ul>
                  <ul className="space-y-1 list-disc pl-5">
                    <li>Step-by-step activation guide</li>
                    <li>Printable execution blueprint</li>
                  </ul>
                </div>
              </div>

              {/* Global CTA */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-lime-500 to-emerald-500 shadow-xl shadow-lime-500/40 transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => startUnlock(pendingStackKey)}
                  disabled={unlocking}
                >
                  {unlocking ? "Opening Stripe…" : "Activate My Full Credit Route — $29"}
                </Button>
                {unlockErr && <span className="text-sm text-red-300">{unlockErr}</span>}
              </div>

              <p className="mt-2 text-xs text-neutral-400">
                Secure checkout • Instant access • No credit check required
              </p>
            </>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={editAnswers}>
              Make changes
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Scroll to top
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}