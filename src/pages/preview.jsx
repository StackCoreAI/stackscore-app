// src/pages/preview.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import PreviewHeader from "../components/PreviewHeader.jsx";
import PlanGrid from "../components/PlanGrid.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

// fallback answers shape (used only for header chips)
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
  const [planSet, setPlanSet] = useState(null); // <-- { user_profile, plans: [...] }
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(
    Number(sessionStorage.getItem("ss_refreshed_at") || 0) || undefined
  );
  const [unlocking, setUnlocking] = useState(false);
  const [unlockErr, setUnlockErr] = useState("");

  // --- API helpers (new endpoints) ---
  async function fetchPlanSet() {
    // GET /api/plan/:id → { ok, data }
    const r = await fetch("/api/plan/any-id");
    if (!r.ok) throw new Error(`API ${r.status}`);
    const j = await r.json();
    if (!j.ok || !j.data) throw new Error(j.error || "Invalid API payload");
    return j.data;
  }

  async function generatePlanSet(profile) {
    // POST /api/plan/generate → { ok, plan_id, data }
    const r = await fetch("/api/plan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_profile: profile || {} }),
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const j = await r.json();
    if (!j.ok || !j.data) throw new Error(j.error || "Invalid API payload");
    return j.data;
  }

  async function runFetch(useAnswers, { forceGenerate = false } = {}) {
    setStatus("loading");
    try {
      const data = forceGenerate
        ? await generatePlanSet({
            // map your answers → profile fields as needed
            starting_fico: 510,
            monthly_budget_usd: Number(useAnswers?.budget || 45),
            constraints: ["soft pull only"],
          })
        : await fetchPlanSet();

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
  }

  // Initial load
  useEffect(() => {
    window.scrollTo(0, 0);
    const a = loadAnswers();
    setAnswers(a);

    const cached = sessionStorage.getItem("ss_plan");
    if (cached) {
      try {
        setPlanSet(JSON.parse(cached));
        const t = Number(sessionStorage.getItem("ss_refreshed_at") || 0);
        if (t) setRefreshedAt(t);
        setStatus("done");
        return;
      } catch {}
    }

    runFetch(a); // GET /api/plan/any-id
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
    // call generator (POST) so users feel it "rebuilds"
    runFetch(merged, { forceGenerate: true });
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

  async function handleUnlockClick() {
    setUnlockErr("");
    setUnlocking(true);
    try {
      const planKey = getSelectedPlanKey();
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
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

          {status === "done" && planSet && (
            <>
              <div className="mt-6">
                <PlanGrid
                  plans={planSet.plans}
                  // keep your previous prop if used elsewhere
                  fallbackStack={planSet.stack}
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
