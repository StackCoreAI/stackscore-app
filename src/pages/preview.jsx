// src/pages/preview.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, BarChart3, Rocket, Crown } from "lucide-react";
import Loader from "../components/Loader.jsx";
import PreviewHeader from "../components/PreviewHeader.jsx";
import PlanGrid from "../components/PlanGrid.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import Button from "@/components/ui/Button";

// ---- Stack metadata (single source for names/icons/accents) ----
const STACKS = [
  { key: "foundation",  name: "Foundation",  icon: Layers,    accent: "ring-lime-400"  },
  { key: "growth",      name: "Growth",      icon: BarChart3, accent: "ring-cyan-400"  },
  { key: "accelerator", name: "Accelerator", icon: Rocket,    accent: "ring-sky-400"   },
  { key: "elite",       name: "Elite",       icon: Crown,     accent: "ring-amber-400" },
];
const STACK_BY_KEY = Object.fromEntries(STACKS.map((s) => [s.key, s]));

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
    return (v?.planKey || v?.key || "growth").toLowerCase();
  } catch {
    return (raw || "growth").toLowerCase();
  }
}

/* ---------- Normalization (canonical 4 stacks, unique keys) ---------- */

const CANON = ["foundation", "growth", "accelerator", "elite"];
const keyMap = { lite: "foundation", core: "growth", boosted: "accelerator", max: "elite" };

function normalizePlanSet(data) {
  if (import.meta.env.DEV) {
    console.log("[normalize] incoming:", Array.isArray(data?.plans) ? data.plans.length : 0);
  }

  const incoming = Array.isArray(data?.plans) ? data.plans : [];

  // Deduplicate by normalized key (first one wins)
  const byKey = new Map();
  for (const p of incoming) {
    const raw = String(p.key || p.planKey || p.slug || "").toLowerCase();
    const k = keyMap[raw] || raw;
    if (!k) continue;
    if (!byKey.has(k)) byKey.set(k, p);
  }

  // Compose final list in canonical order, filling missing entries
  const plans = CANON.map((k) => {
    const src = byKey.get(k) || {};
    const meta = STACK_BY_KEY[k] || {};
    return {
      ...src,
      key: k, // stable, unique
      displayName: meta.name || src.name || friendly(k),
      icon: meta.icon || BarChart3,
      accent: meta.accent || "ring-cyan-400",
    };
  });

  return { ...data, plans };
}

function friendly(k) {
  switch (k) {
    case "foundation": return "Foundation";
    case "growth": return "Growth";
    case "accelerator": return "Accelerator";
    case "elite": return "Elite";
    default: return "Growth";
  }
}

/* -------------------------------------------------------------------- */

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

  // 🔑 Email capture state (persist across sessions)
  const [email, setEmail] = useState(() => localStorage.getItem("ss_email") || "");
  const [showEmail, setShowEmail] = useState(false);
  const [emailErr, setEmailErr] = useState("");

  // --- API helpers (new endpoints) ---
  async function fetchPlanSet() {
    const r = await fetch("/api/plan/any-id");
    if (!r.ok) throw new Error(`API ${r.status}`);
    const j = await r.json();
    if (!j.ok || !j.data) throw new Error(j.error || "Invalid API payload");
    return j.data;
  }

  async function generatePlanSet(profile) {
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
      const rawData = forceGenerate
        ? await generatePlanSet({
            starting_fico: 510,
            monthly_budget_usd: Number(useAnswers?.budget || 45),
            constraints: ["soft pull only"],
          })
        : await fetchPlanSet();

      if (import.meta.env.DEV) {
        console.log("[plan:raw]", rawData?.plans?.map((p) => p.key || p.planKey || p.slug || p.name));
      }

      const normalized = normalizePlanSet(rawData);

      if (import.meta.env.DEV) {
        console.log("[plan:normalized]", normalized.plans.map((p) => p.key));
      }

      setPlanSet(normalized);

      sessionStorage.setItem("ss_plan", JSON.stringify(normalized));
      const t = Date.now();
      setRefreshedAt(t);
      sessionStorage.setItem("ss_refreshed_at", String(t));

      if (import.meta.env.DEV) {
        console.log("[cache:set] ss_plan bytes=", JSON.stringify(normalized).length);
      }

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
        const parsed = JSON.parse(cached);
        const normalized = normalizePlanSet(parsed); // ensure older cache still normalizes
        setPlanSet(normalized);
        const t = Number(sessionStorage.getItem("ss_refreshed_at") || 0);
        if (t) setRefreshedAt(t);
        setStatus("done");
        return;
      } catch {
        // fall through to fetch
      }
    }

    runFetch(a);
  }, []);

  function handleRefresh(updates) {
    const merged = { ...(answers || {}), ...(updates || {}) };
    setAnswers(merged);
    try {
      localStorage.setItem("stackscoreUserData", JSON.stringify({ ...merged, step: 6 }));
      localStorage.setItem("ss_answers", JSON.stringify(merged));
      sessionStorage.removeItem("ss_plan");
    } catch {}
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

  // Basic email validator (single declaration)
  const isValidEmail = (v) => /\S+@\S+\.\S+/.test(String(v || "").trim());

  // Unlock flow: validate, persist, POST, redirect
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

      const planKey = getSelectedPlanKey() || "growth";

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          plan: planKey,            // alias for some backends
          email: clean,             // common name
          customer_email: clean,    // stripe-style
          source: "stackscore-web", // breadcrumb for logs
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
                  if (!isValidEmail(email)) {
                    setEmailErr("Please enter a valid email.");
                    return;
                  }
                  localStorage.setItem("ss_email", String(email || "").trim());
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
