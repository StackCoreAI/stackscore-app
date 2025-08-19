// src/components/PlanGrid.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * Four plans w/ narratives.
 * - R1 enforced: only "growth" may reveal a single anchor app.
 * - No effort meter, no category counts; value-forward copy only.
 * - Selected plan persists in sessionStorage.selectedPlanKey
 */
export default function PlanGrid({ plans, fallbackStack }) {
  const normalized = useNormalizePlans(plans, fallbackStack);
  const [selected, setSelected] = useState(
    () => sessionStorage.getItem("selectedPlanKey") || ""
  );

  useEffect(() => {
    if (selected) sessionStorage.setItem("selectedPlanKey", selected);
  }, [selected]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {normalized.map((p) => (
        <PlanCard
          key={p.key}
          plan={p}
          selected={selected === p.key}
          onSelect={() => setSelected(p.key)}
        />
      ))}
    </div>
  );
}

/* ---------- Card ---------- */

function PlanCard({ plan, selected, onSelect }) {
  const lockCount = computeLockCount(plan);
  const style = subtitleStyles(plan.key);

  return (
    <div
      className={`rounded-2xl border p-5 bg-neutral-900/60 border-white/10 ${
        selected ? "ring-2 ring-lime-400" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-semibold">{plan.label}</h3>
          {plan.subtitle && (
            <span
              className={`mt-1 inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${style.bg} ${style.border} ${style.text}`}
            >
              <span aria-hidden="true">{plan.subtitle.emoji}</span>
              <span>{plan.subtitle.text}</span>
            </span>
          )}
        </div>

        {/* Top-right: impact + time (no Effort) */}
        <div className="text-right text-sm text-neutral-300">
          <div>
            <b>Impact:</b> {plan.projectedGain}
          </div>
          <div>
            <b>Time:</b> {plan.timeToImpactDays} days
          </div>
        </div>
      </div>

      {/* Narrative only – no counts */}
      <p className="mt-3 text-sm text-neutral-300">{plan.narrative}</p>

      {/* Reveal strip (Growth only) */}
      {plan.revealApp && (
        <div className="mt-4 flex items-center gap-2">
          <a
            href={plan.revealApp.url || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2"
          >
            <div className="text-xs text-neutral-400">Revealed app</div>
            <div className="font-medium">{plan.revealApp.name}</div>
          </a>
          {lockCount > 0 && (
            <div className="flex-1 rounded-lg border border-dashed border-white/15 bg-white/2 px-3 py-2 text-neutral-400 text-sm">
              +{lockCount} locked — unlock with StackScore Access
            </div>
          )}
        </div>
      )}

      {/* CTA row */}
      <div className="mt-4 flex items-center justify-between">
        {selected ? (
          <span className="text-lime-300 text-sm">Selected</span>
        ) : (
          <button
            onClick={onSelect}
            className="rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 text-black px-4 py-2 font-semibold hover:brightness-110"
          >
            Select this stack
          </button>
        )}
        <button className="text-xs text-neutral-400 hover:text-neutral-200 underline underline-offset-4">
          Compare details
        </button>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

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
  switch (key) {
    case "growth":
      return { bg: "bg-amber-500/15", border: "border border-amber-400/20", text: "text-amber-300" }; // 🔥
    case "elite":
      return { bg: "bg-cyan-500/15", border: "border border-cyan-400/20", text: "text-cyan-300" }; // 💎
    case "accelerator":
      return { bg: "bg-violet-500/15", border: "border border-violet-400/20", text: "text-violet-300" }; // ⚡
    case "foundation":
    default:
      return { bg: "bg-lime-500/15", border: "border border-lime-400/20", text: "text-lime-300" }; // 🔰
  }
}

function useNormalizePlans(plans, stack) {
  return useMemo(() => {
    const subtitleDefaults = {
      foundation: { emoji: "🔰", text: "Best Value" },
      growth: { emoji: "🔥", text: "Popular Choice" },
      accelerator: { emoji: "⚡", text: "Power Boost" },
      elite: { emoji: "💎", text: "Premium" },
    };

    if (Array.isArray(plans) && plans.length) {
      return plans.map((p) => ({
        key: p.key,
        label: p.label,
        subtitle: p.subtitle || subtitleDefaults[p.key] || null,
        projectedGain: p.projectedGain || "",
        timeToImpactDays: p.timeToImpactDays || "45–75",
        counts: p.counts || undefined, // retained only for lock count calc
        revealApp: p.key === "growth" ? p.revealApp || null : null,
        narrative: enhanceNarrative(p.narrative, p.key),
      }));
    }

    // Fallback synthesis (old mock)
    const s = stack || {};
    const firstBuilder =
      (s.creditBuilders && s.creditBuilders[0]) ||
      (s.subscriptionTrackers && s.subscriptionTrackers[0]) ||
      null;

    return [
      {
        key: "foundation",
        label: "Foundation Stack",
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
        label: "Growth Stack",
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
        label: "Accelerator Stack",
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
        label: "Elite Stack",
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

  switch (key) {
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
