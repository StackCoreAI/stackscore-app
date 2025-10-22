// src/components/PlanGrid.jsx
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";

const CANON = ["foundation", "growth", "accelerator", "elite"];

/**
 * Four plans with narratives.
 * - Shows cards in canonical order.
 * - Selection persists to sessionStorage["ss_selected"] (JSON string) and legacy "selectedPlanKey".
 * - Growth may reveal a single anchor app (R1 rule).
 */
export default function PlanGrid({ plans, fallbackStack, onUnlock }) {
  const normalized = useNormalizePlans(plans, fallbackStack);

  const [selected, setSelected] = useState(() => {
    const fromNew = safeParse(sessionStorage.getItem("ss_selected"));
    if (typeof fromNew === "string" && fromNew) return fromNew;
    const legacy = sessionStorage.getItem("selectedPlanKey");
    return (legacy || "").toLowerCase();
  });

  useEffect(() => {
    if (!selected) return;
    try {
      sessionStorage.setItem("ss_selected", JSON.stringify(selected)); // canonical
      sessionStorage.setItem("selectedPlanKey", selected);             // legacy
    } catch {}
  }, [selected]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {normalized.map((p, i) => (
        <PlanCard
          key={`${p.key}-${i}`}
          plan={p}
          selected={selected === p.key}
          onSelect={() => setSelected(p.key)}
          onUnlock={onUnlock}
        />
      ))}
    </div>
  );
}

/* ---------- Card ---------- */

function PlanCard({ plan, selected, onSelect, onUnlock }) {
  const lockCount = computeLockCount(plan);
  const style = subtitleStyles(plan.key);
  const label = plan.displayName || plan.label || friendlyLabel(plan.key);

  return (
    <div
      className={`rounded-2xl border p-5 bg-neutral-900/60 border-white/10 transition ${
        selected ? "ring-2 ring-lime-400" : "hover:border-white/20"
      }`}
      role="group"
      aria-label={`${label} card`}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-semibold">{label}</h3>
          {plan.subtitle && (
            <span
              className={`mt-1 inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${style.bg} ${style.border} ${style.text}`}
            >
              <span aria-hidden="true">{plan.subtitle.emoji}</span>
              <span>{plan.subtitle.text}</span>
            </span>
          )}
        </div>

        {/* Top-right: impact + time */}
        <div className="text-right text-sm text-neutral-300">
          {plan.projectedGain && (
            <div>
              <b>Impact:</b> {formatPts(plan.projectedGain)}
            </div>
          )}
          {plan.timeToImpactDays && (
            <div>
              <b>Time:</b> {plan.timeToImpactDays} days
            </div>
          )}
        </div>
      </div>

      {/* Narrative only – no counts */}
      {plan.narrative && (
        <p className="mt-3 text-sm text-neutral-300">{plan.narrative}</p>
      )}

      {/* Reveal strip (Growth only) */}
      {plan.revealApp && (
        <div className="mt-4 flex items-center gap-2">
          <a
            href={plan.revealApp.url || "#"}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2"
          >
            <div className="text-xs text-neutral-400">Revealed app</div>
            <div className="font-medium">{plan.revealApp.name}</div>
          </a>
          {lockCount > 0 && (
            <div className="flex-1 rounded-lg border border-dashed border-white/15 bg-white/5 px-3 py-2 text-sm text-neutral-400">
              +{lockCount} locked — unlock with StackScore Access
            </div>
          )}
        </div>
      )}

      {/* CTA row */}
    {/* CTA row */}
<div className="mt-4 flex items-center justify-between gap-3">
  {selected ? (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/30 bg-lime-500/15 px-2.5 py-1 text-sm font-medium text-lime-300"
      aria-label={`${label} selected`}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      Selected
    </span>
  ) : (
    <Button
      variant="secondary"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      Select this stack
    </Button>
  )}

  <button
    onClick={(e) => e.stopPropagation()}
    className="text-xs text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
    type="button"
    aria-label={`Compare details for ${label}`}
  >
    Compare details
  </button>
</div>


      {/* Per-card unlock (if provided) */}
      {typeof onUnlock === "function" && (
        <div className="mt-3">
          <Button
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              // selection first, then unlock
              onSelect?.();
              onUnlock();
            }}
          >
            Unlock with this stack
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Helpers ---------- */

function safeParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function friendlyLabel(key) {
  switch ((key || "").toLowerCase()) {
    case "foundation":
      return "Foundation Stack";
    case "growth":
      return "Growth Stack";
    case "accelerator":
      return "Accelerator Stack";
    case "elite":
      return "Elite Stack";
    default:
      return "Recommended Stack";
  }
}

function formatPts(v) {
  const s = String(v || "").trim();
  return /pts$/i.test(s) ? s : `${s} pts`;
}

function computeLockCount(p) {
  const totalFromCounts = p.counts
    ? (p.counts.creditBuilders || 0) +
      (p.counts.subscriptionTrackers || 0) +
      (p.counts.utilityReporting || 0) +
      (p.counts.disputeTools || 0) +
      (p.counts.insights || 0)
    : null;

  const total = totalFromCounts ?? (p.key === "growth" ? 5 : 0);
  const revealed = p.revealApp ? 1 : 0;
  return Math.max(0, total - revealed);
}

function subtitleStyles(key) {
  switch ((key || "").toLowerCase()) {
    case "growth":
      return { bg: "bg-amber-500/15", border: "border border-amber-400/20", text: "text-amber-300" };
    case "elite":
      return { bg: "bg-cyan-500/15", border: "border border-cyan-400/20", text: "text-cyan-300" };
    case "accelerator":
      return { bg: "bg-violet-500/15", border: "border border-violet-400/20", text: "text-violet-300" };
    case "foundation":
    default:
      return { bg: "bg-lime-500/15", border: "border border-lime-400/20", text: "text-lime-300" };
  }
}

function useNormalizePlans(plans, stack) {
  return useMemo(() => {
    // Canonical badges
    const subtitleDefaults = {
      foundation: { emoji: "💰", text: "Best Value" },
      growth: { emoji: "🔥", text: "Popular Choice" },
      accelerator: { emoji: "🚀", text: "Power Boost" },
      elite: { emoji: "💎", text: "Premium" },
    };

    const timeDefaults = {
      foundation: "30–60",
      growth: "45–75",
      accelerator: "45–60",
      elite: "30–60",
    };
    const ptsDefaults = {
      foundation: "+10–30",
      growth: "+40–70",
      accelerator: "+80–100",
      elite: "100+",
    };

    if (Array.isArray(plans) && plans.length) {
      // Put incoming plans into a map, then emit in canonical order
      const byKey = new Map();
      for (const p of plans) {
        const key = String(p.key || p.planKey || "").toLowerCase();
        if (!byKey.has(key)) byKey.set(key, p);
      }
      return CANON.map((k) => {
        const src = byKey.get(k) || {};
        return {
          key: k,
          label: src.label || src.name || undefined,
          displayName: src.displayName || src.label || src.name || friendlyLabel(k),
          subtitle: src.subtitle || subtitleDefaults[k] || null,
          projectedGain: src.projectedGain || ptsDefaults[k] || "",
          timeToImpactDays: src.timeToImpactDays || timeDefaults[k] || "45–75",
          counts: src.counts || undefined,
          revealApp: k === "growth" ? src.revealApp || null : null, // Growth only
          narrative: enhanceNarrative(src.narrative, k),
        };
      });
    }

    // Fallback synthesis (legacy)
    const s = stack || {};
    const firstBuilder =
      (s.creditBuilders && s.creditBuilders[0]) ||
      (s.subscriptionTrackers && s.subscriptionTrackers[0]) ||
      null;

    return [
      {
        key: "foundation",
        displayName: "Foundation Stack",
        subtitle: subtitleDefaults.foundation,
        projectedGain: "+10–30",
        timeToImpactDays: "30–60",
        counts: { creditBuilders: 1, subscriptionTrackers: 1, utilityReporting: 1, disputeTools: 0, insights: 1 },
        revealApp: null,
        narrative: enhanceNarrative(
          "A chef’s-kiss starter: low-lift essentials that quietly build history, add continuous reporting, and block common gotchas.",
          "foundation"
        ),
      },
      {
        key: "growth",
        displayName: "Growth Stack",
        subtitle: subtitleDefaults.growth,
        projectedGain: "+40–70",
        timeToImpactDays: "45–75",
        counts: { creditBuilders: 2, subscriptionTrackers: 1, utilityReporting: 1, disputeTools: 1, insights: 1 },
        revealApp: firstBuilder ? { name: firstBuilder.name, url: firstBuilder.url } : null,
        narrative: enhanceNarrative(
          "Our crowd-pleaser: a balanced stack that pairs builders with smart tracking so gains show up fast—and keep compounding.",
          "growth"
        ),
      },
      {
        key: "accelerator",
        displayName: "Accelerator Stack",
        subtitle: subtitleDefaults.accelerator,
        projectedGain: "+80–100",
        timeToImpactDays: "45–60",
        counts: { creditBuilders: 2, subscriptionTrackers: 1, utilityReporting: 1, disputeTools: 1, insights: 1 },
        revealApp: null,
        narrative: enhanceNarrative(
          "Built for momentum: higher-intensity pairing with proactive automation to turn weeks into visible progress.",
          "accelerator"
        ),
      },
      {
        key: "elite",
        displayName: "Elite Stack",
        subtitle: subtitleDefaults.elite,
        projectedGain: "100+",
        timeToImpactDays: "30–60",
        counts: { creditBuilders: 2, subscriptionTrackers: 1, utilityReporting: 1, disputeTools: 1, insights: 1 },
        revealApp: null,
        narrative: enhanceNarrative(
          "Everything working in concert: widest coverage and redundancy for the fastest, most durable climb when timing matters.",
          "elite"
        ),
      },
    ];
  }, [plans, stack]);
}

function enhanceNarrative(n, key) {
  const trimmed = (n || "").trim();
  if (trimmed) return trimmed;

  switch ((key || "").toLowerCase()) {
    case "foundation":
      return "A chef’s-kiss starter: low-lift essentials that quietly build history, add continuous reporting, and block common gotchas.";
    case "growth":
      return "Our crowd-pleaser: a balanced stack that pairs builders with smart tracking so gains show up fast—and keep compounding.";
    case "accelerator":
      return "Built for momentum: higher-intensity pairing with proactive automation to turn weeks into visible progress.";
    case "elite":
      return "Everything working in concert: widest coverage and redundancy for the fastest, most durable climb when timing matters.";
    default:
      return "Curated, high-leverage lineup tuned to your answers for maximum lift with minimal friction.";
  }
}
