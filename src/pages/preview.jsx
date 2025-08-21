// src/pages/preview.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import PreviewHeader from "../components/PreviewHeader.jsx";
import PlanGrid from "../components/PlanGrid.jsx";

// NEW: global header/footer (logo is a home link on every page)
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

const BLANK = { housing: "", subs: [], tools: "", employment: "", goal: "", budget: "45" };

function loadAnswers() {
  try {
    const raw =
      localStorage.getItem("stackscoreUserData") ||
      localStorage.getItem("ss_answers");
    if (!raw) return null;
    return { ...BLANK, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function getSelectedPlanKey() {
  const raw = sessionStorage.getItem("ss_selected");
  if (!raw) return "growth";
  try {
    const v = JSON.parse(raw);
    if (typeof v === "string") return v || "growth";
    return v?.planKey || v?.key || "growth";
  } catch {
    return raw || "growth";
  }
}

export default function Preview() {
  const nav = useNavigate();

  const [answers, setAnswers] = useState(null);
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState("idle"); 
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(
    Number(sessionStorage.getItem("ss_refreshed_at") || 0) || undefined
  );
  const [unlocking, setUnlocking] = useState(false);
  const [unlockErr, setUnlockErr] = useState("");

  async function runFetch(useAnswers, tryMock = true) {
    setStatus("loading");
    const payload = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: useAnswers || {} }),
    };

    try {
      const r = await fetch("/api/gpt-plan", payload);
      if (!r.ok) throw new Error(`API ${r.status}`);
      const data = await r.json();
      setPlan(data);
      sessionStorage.setItem("ss_plan", JSON.stringify(data));
      const t = Date.now();
      setRefreshedAt(t);
      sessionStorage.setItem("ss_refreshed_at", String(t));
      setStatus("done");
    } catch (e) {
      console.error("Live plan failed:", e);
      if (tryMock) {
        try {
          const r2 = await fetch("/api/gpt-plan?mock=1", payload);
          if (!r2.ok) throw new Error(`Mock API ${r2.status}`);
          const data2 = await r2.json();
          setPlan(data2);
          sessionStorage.setItem("ss_plan", JSON.stringify(data2));
          const t2 = Date.now();
          setRefreshedAt(t2);
          sessionStorage.setItem("ss_refreshed_at", String(t2));
          setStatus("done");
          return;
        } catch (e2) {
          console.error("Mock fallback failed:", e2);
        }
      }
      setError(e.message || "Failed to build plan");
      setStatus("error");
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    const a = loadAnswers();
    setAnswers(a);

    const cached = sessionStorage.getItem("ss_plan");
    if (cached) {
      try {
        setPlan(JSON.parse(cached));
        const t = Number(sessionStorage.getItem("ss_refreshed_at") || 0);
        if (t) setRefreshedAt(t);
        setStatus("done");
        return;
      } catch {}
    }

    runFetch(a);
  }, []);

  function handleRefresh(updates) {
    const merged = { ...(answers || {}), ...(updates || {}) };
    setAnswers(merged);
    try {
      localStorage.setItem(
        "stackscoreUserData",
        JSON.stringify({ ...merged, step: 6 })
      );
      localStorage.setItem("ss_answers", JSON.stringify(merged));
      sessionStorage.removeItem("ss_plan");
    } catch {}
    runFetch(merged);
  }

  const resetAll = () => {
    try {
      localStorage.removeItem("stackscoreUserData");
      localStorage.removeItem("ss_answers");
      sessionStorage.removeItem("ss_plan");
      sessionStorage.removeItem("ss_selected");
      sessionStorage.removeItem("ss_refreshed_at");
    } catch {}
    nav("/wizard?fresh=1", { replace: true });
  };

  const editAnswers = () => nav("/wizard", { replace: false });

  // ✅ No localhost — relative path works in dev & prod
  async function handleUnlockClick() {
    setUnlockErr("");
    setUnlocking(true);
    try {
      const planKey = getSelectedPlanKey();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey })
      });
      const { url, error } = await res.json().catch(() => ({}));
      if (!res.ok || !url) throw new Error(error || "No checkout URL returned");
      window.location.href = url; 
    } catch (e) {
      console.error(e);
      setUnlockErr(e?.message || "Couldn’t start checkout. Please try again.");
      setUnlocking(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PreviewHeader
          answers={answers || {}}
          refreshedAt={refreshedAt}
          onEdit={editAnswers}
          onReset={resetAll}
          onRefresh={handleRefresh}
        />

        <div className="max-w-5xl mx-auto px-4 pb-10">
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

          {status === "done" && plan && (
            <>
              <div className="mt-6">
                <PlanGrid
                  plans={plan.plans}
                  fallbackStack={plan.stack}
                  onUnlock={handleUnlockClick}
                />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  onClick={handleUnlockClick}
                  disabled={unlocking}
                  className={`px-5 py-2 rounded-full text-gray-900 font-semibold transition
                    ${unlocking ? "bg-lime-300 cursor-wait" : "bg-lime-400 hover:bg-lime-300"}`}
                  title="Unlock all apps and download your digital brief"
                >
                  {unlocking ? "Redirecting to checkout…" : "Unlock your optimized stack"}
                </button>
                {unlockErr && (
                  <span className="text-red-300 text-sm">{unlockErr}</span>
                )}
              </div>
            </>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={editAnswers}
              className="px-5 py-2 rounded-full border border-white/30 text-white/90 hover:text-white hover:bg-white/5 transition"
            >
              Make changes
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-5 py-2 rounded-full bg-neutral-800 text-white/90 hover:bg-neutral-700 transition"
            >
              Scroll to top
            </button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
