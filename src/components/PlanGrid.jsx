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
    "Start building your financial future with a solid foundation. Take control of your budget and make every dollar count.",
  growth:
    "Elevate your financial journey with growth-focused strategies. Empower yourself to reach new heights.",
  accelerator:
    "Accelerate your progress with targeted tools designed for your lifestyle. Experience a faster path to financial success.",
  elite:
    "Join the elite tier of financial management. Achieve your goals with advanced strategies tailored to your needs.",
};

const UNLOCK_BULLETS = {
  foundation: [
    "Full app list + direct links",
    "Step-by-step setup checklist",
    "Fallback apps if one isn’t available",
  ],
  growth: [
    "Full app list + direct links",
    "Best-fit builder + tracking combo",
    "Fallback apps + setup checklist",
  ],
  accelerator: [
    "Full app list + direct links",
    "Dispute automation + builder pairing",
    "Fallback apps + setup checklist",
  ],
  elite: [
    "Full app list + direct links",
    "Highest-coverage stack configuration",
    "Fallback apps + setup checklist",
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
    if (!selected || !CANON.includes(selected)) setSelected(DEFAULT_SELECTED);
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    try {
      sessionStorage.setItem("ss_selected", JSON.stringify(selected));
      sessionStorage.setItem("selectedPlanKey", selected);
    } catch {}
  }, [selected]);

  // Split Growth from alternatives (conversion mode)
  const growth = normalized.find((p) => p.key === "growth") || null;
  const others = normalized.filter((p) => p.key !== "growth");

 return (
  <div className="space-y-6">
    {/* Recommended Route */}
    {growth && (
      <>
        <PlanCard
          plan={growth}
          selectedKey={selected}
          onSelect={() => setSelected(growth.key)}
          onUnlock={onUnlock}
        />

        <p className="mt-4 text-sm text-neutral-400">
          This route is optimized for your current profile and timeline.
        </p>
      </>
    )}

    {/* Compare alternatives toggle */}
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
        className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition"
      >
        {open ? "Hide alternative routes" : "View alternative routes"}
      </button>

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
  const bullets = UNLOCK_BULLETS[key] || [];

  const isSelected = selectedKey === key;
  const isGrowth = key === "growth";

  return (
    <div
      className={`rounded-2xl border bg-neutral-900/60 p-5 transition
        ${isSelected
          ? "border-lime-400/40 shadow-lg shadow-lime-500/10 scale-[1.02]"
          : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/20"}`}
      onClick={onSelect}
      role="group"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      {isGrowth && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-500/10 px-3 py-1 text-xs font-medium text-lime-300">
          ★ Recommended Starting Point
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

          {/* Keep Selected badge for non-growth selections only */}
          {isSelected && key !== "growth" && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-lime-400/30 bg-lime-500/15 px-2.5 py-1 text-xs font-medium text-lime-300">
              ✓ Selected
            </div>
          )}
        </div>

        <div className="text-right text-sm text-neutral-300 shrink-0">
          <div>
            <b>Impact:</b> {formatPts(impact)}
          </div>
          <div>
            <b>Time:</b> {String(time).includes("days") ? time : `${time} days`}
          </div>
        </div>
      </div>

      {/* Narrative */}
      {isGrowth && (
  <p className="mt-2 text-xs text-neutral-400">
    Optimized for your current profile and timeline.
  </p>
)}

      {/* What you get panel */}
      <div
        className={`mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition ${
          !isSelected ? "opacity-70" : ""
        }`}
      >
        <div className="text-xs font-semibold text-neutral-200">What you get when you unlock</div>
        <ul className="mt-2 space-y-1 text-sm text-neutral-300 list-disc pl-5">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>

      {/* CTA only (no “Select this stack”) */}
      <div className="mt-4">
        <Button
          size="sm"
          className={`w-full rounded-full bg-gradient-to-r from-lime-500 to-emerald-500 text-neutral-950
            ${key === "growth" ? "py-3 text-base shadow-lg shadow-lime-500/25" : "hover:opacity-95"}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            onUnlock?.(key);
          }}
        >
          🔒 Unlock My Full Credit Route
        </Button>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function badgeClasses(tone) {
  const base = "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border";
  switch (tone) {
    case "amber":
      return `${base} bg-amber-500/15 border-amber-400/20 text-amber-300`;
    case "cyan":
      return `${base} bg-cyan-500/15 border-cyan-400/20 text-cyan-300`;
    case "violet":
      return `${base} bg-violet-500/15 border-violet-400/20 text-violet-300`;
    case "lime":
    default:
      return `${base} bg-lime-500/15 border-lime-400/20 text-lime-300`;
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