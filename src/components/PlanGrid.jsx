// src/components/PlanGrid.jsx
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";

const CANON = ["growth", "foundation", "accelerator", "elite"];
const DEFAULT_SELECTED = "growth";

const SUBTITLES = {
  foundation: { emoji: "💰", text: "Best Value", tone: "lime" },
  growth: { emoji: "🔥", text: "Recommended", tone: "amber" },
  accelerator: { emoji: "🚀", text: "Power Boost", tone: "violet" },
  elite: { emoji: "💎", text: "Premium", tone: "cyan" },
};

const DEFAULTS = {
  foundation: { impact: "+10–30", time: "30–60" },
  growth: { impact: "+40–70", time: "45–75" },
  accelerator: { impact: "+80–100", time: "45–60" },
  elite: { impact: "100+", time: "30–60" },
};

const NARRATIVE_FALLBACK = {
  foundation:
    "A lower-friction route for building a stronger base and establishing momentum with practical next moves.",
  growth:
    "A balanced route designed to prioritize the actions most likely to move your profile without overcomplicating execution.",
  accelerator:
    "A more aggressive route for users who want higher-impact sequencing and are ready to take on more targeted steps.",
  elite:
    "A deeper route for users who want maximum coverage, stronger execution paths, and more optionality across the marketplace.",
};

const ROUTE_BULLETS = {
  foundation: [
    "Prioritized Credit Route for a lower-friction starting point",
    "Step-by-step execution guidance for your next moves",
    "Reroutes if a tool or reporting path is unavailable",
  ],
  growth: [
    "Prioritized Credit Route built around your highest-impact next steps",
    "Step-by-step execution plan for your profile and timeline",
    "Reroutes and fallback options if a tool or path is unavailable",
  ],
  accelerator: [
    "Higher-intensity Credit Route with stronger sequencing logic",
    "Execution guidance for faster, more focused progress",
    "Reroutes if a tool, path, or feature is unavailable",
  ],
  elite: [
    "Most comprehensive Credit Route with expanded execution options",
    "Deeper route coverage across tools and marketplace paths",
    "Reroutes and backup paths to keep execution moving",
  ],
};

export default function PlanGrid({ plans, fallbackStack, onUnlock }) {
  const normalized = useNormalizePlans(plans, fallbackStack);

  const [selected, setSelected] = useState(() => {
    try {
      const raw = sessionStorage.getItem("ss_selected");
      const v = raw ? JSON.parse(raw) : "";
      if (typeof v === "string" && v) return v.toLowerCase();
    } catch {}
    const legacy = sessionStorage.getItem("selectedPlanKey");
    if (legacy) return String(legacy).toLowerCase();
    return DEFAULT_SELECTED;
  });

  useEffect(() => {
    if (!selected || !CANON.includes(selected)) {
      setSelected(DEFAULT_SELECTED);
    }
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    try {
      sessionStorage.setItem("ss_selected", JSON.stringify(selected));
      sessionStorage.setItem("selectedPlanKey", selected);
    } catch {}
  }, [selected]);

  const growth = normalized.find((p) => p.key === "growth") || null;
  const others = normalized.filter((p) => p.key !== "growth");

  return (
    <div className="space-y-6">
      {growth && (
        <>
          <PlanCard
            plan={growth}
            selectedKey={selected}
            onSelect={() => setSelected(growth.key)}
            onUnlock={onUnlock}
          />

          <p className="mt-4 text-sm text-neutral-400">
            This route is optimized for your current profile, timeline, and budget.
          </p>
        </>
      )}

      <CompareToggle
        others={others}
        selected={selected}
        setSelected={setSelected}
        onUnlock={onUnlock}
      />
    </div>
  );
}

function CompareToggle({ others, selected, setSelected, onUnlock }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-300"
      >
        {open ? "Hide other route options" : "Compare other route options"}
      </button>

      {open && (
        <div className="mt-3 mb-2 text-sm text-neutral-400">
          Your recommended route is above. These are alternative paths if you want a different approach.
        </div>
      )}

      {open && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {others.map((p) => (
            <PlanCard
              key={p.key}
              plan={p}
              selectedKey={selected}
              onSelect={() => setSelected(p.key)}
              onUnlock={onUnlock}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Card ---------- */

function PlanCard({ plan, selectedKey, onSelect, onUnlock }) {
  const key = plan.key;
  const label = plan.displayName || friendlyLabel(key);

  const sub = plan.subtitle || SUBTITLES[key];
  const impact = plan.projectedGain || DEFAULTS[key]?.impact || "";
  const time = plan.timeToImpactDays || DEFAULTS[key]?.time || "";
  const narrative = plan.narrative || NARRATIVE_FALLBACK[key] || "";
  const bullets = ROUTE_BULLETS[key] || [];

  const isSelected = selectedKey === key;
  const isGrowth = key === "growth";

  return (
    <div
      className={`rounded-2xl border bg-neutral-900/60 p-5 transition ${
        isSelected
          ? "scale-[1.02] border-lime-400/40 shadow-lg shadow-lime-500/10"
          : "border-white/10 opacity-70 hover:border-white/20 hover:opacity-100"
      }`}
      onClick={onSelect}
      role="group"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      {isGrowth && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-500/10 px-3 py-1 text-xs font-medium text-lime-300">
          ✓ Your Recommended Credit Route
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold">{label}</h3>

          {sub && (
            <span className={badgeClasses(sub.tone)}>
              <span aria-hidden="true">{sub.emoji}</span>
              <span>{sub.text}</span>
            </span>
          )}

          {key === "growth" && (
            <div className="mt-2 text-sm font-medium text-lime-300">
              This is the route most aligned with your profile.
            </div>
          )}

          {isSelected && key !== "growth" && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-lime-400/30 bg-lime-500/15 px-2.5 py-1 text-xs font-medium text-lime-300">
              ✓ Selected
            </div>
          )}
        </div>

        <div className="shrink-0 text-right text-sm text-neutral-300">
          <div>
            <b>Impact:</b> {formatPts(impact)}
          </div>
          <div>
            <b>Time:</b> {String(time).includes("days") ? time : `${time} days`}
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div className="mt-4">
        {isGrowth && (
          <div className="mb-2 text-xs text-neutral-400">
            Optimized for your current profile and timeline.
          </div>
        )}

        <p className="text-sm leading-relaxed text-neutral-300">{narrative}</p>
      </div>

      {/* What you unlock */}
      <div
        className={`mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition ${
          !isSelected ? "opacity-70" : ""
        }`}
      >
        <div className="text-xs font-semibold text-neutral-200">What you unlock</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-4">
        <Button
          size="sm"
          className={`w-full rounded-full bg-gradient-to-r from-lime-500 to-emerald-500 text-neutral-950 ${
            key === "growth" ? "py-3 text-base shadow-lg shadow-lime-500/25" : "hover:opacity-95"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            onUnlock?.(key);
          }}
        >
          Activate My Credit Route — $29
        </Button>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function badgeClasses(tone) {
  const base = "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs";
  switch (tone) {
    case "amber":
      return `${base} border-amber-400/20 bg-amber-500/15 text-amber-300`;
    case "cyan":
      return `${base} border-cyan-400/20 bg-cyan-500/15 text-cyan-300`;
    case "violet":
      return `${base} border-violet-400/20 bg-violet-500/15 text-violet-300`;
    case "lime":
    default:
      return `${base} border-lime-400/20 bg-lime-500/15 text-lime-300`;
  }
}

function friendlyLabel(key) {
  switch ((key || "").toLowerCase()) {
    case "foundation":
      return "Foundation";
    case "growth":
      return "Growth";
    case "accelerator":
      return "Accelerator";
    case "elite":
      return "Elite";
    default:
      return "Recommended";
  }
}

function formatPts(v) {
  const s = String(v || "").trim();
  return /pts$/i.test(s) ? s : `${s} pts`;
}

function useNormalizePlans(plans, stack) {
  return useMemo(() => {
    if (Array.isArray(plans) && plans.length) {
      const byKey = new Map();

      for (const p of plans) {
        const key = String(p.key || p.planKey || "").toLowerCase();
        if (!byKey.has(key)) byKey.set(key, p);
      }

      return CANON.map((k) => {
        const src = byKey.get(k) || {};
        return {
          key: k,
          displayName: src.displayName || src.label || src.name || friendlyLabel(k),
          projectedGain: src.projectedGain || DEFAULTS[k]?.impact || "",
          timeToImpactDays: src.timeToImpactDays || DEFAULTS[k]?.time || "",
          narrative: src.narrative || "",
          subtitle: src.subtitle || SUBTITLES[k],
        };
      });
    }

    return CANON.map((k) => ({
      key: k,
      displayName: friendlyLabel(k),
      projectedGain: DEFAULTS[k]?.impact || "",
      timeToImpactDays: DEFAULTS[k]?.time || "",
      narrative: NARRATIVE_FALLBACK[k] || "",
      subtitle: SUBTITLES[k],
    }));
  }, [plans, stack]);
}