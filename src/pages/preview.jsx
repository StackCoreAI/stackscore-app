// src/pages/Preview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useEntryGuard } from "../shared/useEntryGuard.js";
import { getWizardData } from "../shared/useWizardData.js";
import PlanSection from "../shared/PlanSection.jsx";
import LockedCard from "../shared/LockedCard.jsx";

// --- Tiny inline mock used when the API isn't available in Vite dev ---
const INLINE_MOCK = {
  plans: [
    {
      id: "A",
      title: "Fast Start",
      summary: "Quick wins this month with low effort tools.",
      apps: [
        {
          app_name: "Experian Boost",
          app_category: "Tradeline",
          app_cost: "Free",
          app_url: "https://www.experian.com/boost",
          why: "Reports utilities/streaming for an immediate tradeline."
        },
        {
          app_name: "Kikoff",
          app_category: "Credit Builder",
          app_cost: "$5/mo",
          app_url: "https://kikoff.com",
          why: "Low-cost builder that reports monthly."
        },
        {
          app_name: "Grow Credit",
          app_category: "Subscription Reporting",
          app_cost: "$0–$4.99/mo",
          app_url: "https://growcredit.com",
          why: "Reports eligible subscriptions like Netflix/Spotify."
        },
        {
          app_name: "Credit Karma",
          app_category: "Monitoring",
          app_cost: "Free",
          app_url: "https://www.creditkarma.com",
          why: "Ongoing monitoring and alerts."
        }
      ]
    },
    {
      id: "B",
      title: "Builder Track",
      summary: "Focus on steady monthly reporting and utilization.",
      apps: [
        {
          app_name: "Self",
          app_category: "Installment Builder",
          app_cost: "$25+/mo",
          app_url: "https://www.self.inc",
          why: "Build payment history with a CD-backed loan."
        },
        {
          app_name: "Chime Credit Builder",
          app_category: "Secured Card",
          app_cost: "Free*",
          app_url: "https://www.chime.com",
          why: "No-fee secured card with auto-pay features."
        },
        {
          app_name: "Experian",
          app_category: "Monitoring",
          app_cost: "Free",
          app_url: "https://www.experian.com",
          why: "Score tracking and alerts."
        },
        {
          app_name: "Rocket Money",
          app_category: "Budgeting",
          app_cost: "Free",
          app_url: "https://www.rocketmoney.com",
          why: "Budget and subscription tracking."
        }
      ]
    },
    {
      id: "C",
      title: "Subscription Reporter",
      summary: "Max out eligible utilities/subscriptions for reporting.",
      apps: [
        {
          app_name: "Experian Boost",
          app_category: "Tradeline",
          app_cost: "Free",
          app_url: "https://www.experian.com/boost",
          why: "Immediate reporting for eligible bills."
        },
        {
          app_name: "Grow Credit",
          app_category: "Subscription Reporting",
          app_cost: "$0–$4.99/mo",
          app_url: "https://growcredit.com",
          why: "Report streaming services to help build history."
        },
        {
          app_name: "Kikoff",
          app_category: "Credit Builder",
          app_cost: "$5/mo",
          app_url: "https://kikoff.com",
          why: "Low-cost recurring tradeline."
        },
        {
          app_name: "Credit Karma",
          app_category: "Monitoring",
          app_cost: "Free",
          app_url: "https://www.creditkarma.com",
          why: "Monitor the impact over time."
        }
      ]
    },
    {
      id: "D",
      title: "Balanced Mix",
      summary: "Blend of builder, reporting, and monitoring.",
      apps: [
        {
          app_name: "Self",
          app_category: "Installment Builder",
          app_cost: "$25+/mo",
          app_url: "https://www.self.inc",
          why: "Installment history foundation."
        },
        {
          app_name: "Grow Credit",
          app_category: "Subscription Reporting",
          app_cost: "$0–$4.99/mo",
          app_url: "https://growcredit.com",
          why: "Leverage existing subscriptions."
        },
        {
          app_name: "Chime Credit Builder",
          app_category: "Secured Card",
          app_cost: "Free*",
          app_url: "https://www.chime.com",
          why: "Keep utilization healthy with autopay."
        },
        {
          app_name: "Experian",
          app_category: "Monitoring",
          app_cost: "Free",
          app_url: "https://www.experian.com",
          why: "Track progress; catch issues early."
        }
      ]
    }
  ]
};

function safeParseJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  // If the server returned HTML (404 page, etc.), don't try to parse.
  if (trimmed.startsWith("<")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export default function Preview() {
  useEntryGuard(); // if no wizard payload, bounce to /wizard

  const payload = useMemo(() => getWizardData(), []);
  const [plans, setPlans] = useState(null);
  const [meta, setMeta] = useState({ source: "", cacheKey: "" });
  const [status, setStatus] = useState({ loading: true, error: "" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus({ loading: true, error: "" });

      // Try live API first
      try {
        const r = await fetch("/api/gpt-plan?shape=advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await r.text();
        if (cancelled) return;

        const data = safeParseJson(text);
        if (r.ok && data && Array.isArray(data.plans)) {
          setPlans(data.plans);
          setMeta({
            source: r.headers.get("x-ss-source") || "api",
            cacheKey: r.headers.get("x-ss-cache-key") || "",
          });
          setStatus({ loading: false, error: "" });
          return;
        }

        // Not ok or not JSON -> fall through to mock
        throw new Error(`API unavailable (${r.status})`);
      } catch (e) {
        // Mock fallback (works during Vite dev when no serverless route exists)
        try {
          if (cancelled) return;
          setPlans(INLINE_MOCK.plans);
          setMeta({ source: "mock(local)", cacheKey: "" });
          setStatus({ loading: false, error: "" });
        } catch (mockErr) {
          if (cancelled) return;
          setStatus({
            loading: false,
            error: String(mockErr?.message || e?.message || "Failed to load plans"),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (status.loading) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="text-slate-600">Loading your plans…</div>
      </main>
    );
  }

  if (status.error) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-xl bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">We hit a snag</h2>
          <p className="text-slate-600 mb-4">
            {status.error}
          </p>
          <p className="text-sm text-slate-500">
            Try again in a moment or return to the wizard to adjust answers.
          </p>
        </div>
      </main>
    );
  }

  // trial view: show full Plan A; blur-lock the rest card-level
  const hasAccess = false;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Your credit plan</h1>
          <p className="text-slate-600">
            Source: {meta.source || "model/mock"} {meta.cacheKey ? `• cache ${meta.cacheKey}` : ""}
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {plans?.map((p, i) => {
            const lockedCard = i > 0 && !hasAccess;
            return (
              <div key={p.id || i} className="relative">
                {lockedCard && <LockedCard />}
                <PlanSection
                  plan={p}
                  hasAccess={i === 0 ? true : hasAccess}
                  className={lockedCard ? "blur-[2px] select-none" : ""}
                />
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
