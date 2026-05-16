import React from "react";

const ROUTES = [
  {
    key: "foundation",
    name: "Foundation Route",
    focus: "Build your base",
    tone: "lime",
    badge: { icon: "💰", label: "Best Value" },
  },
  {
    key: "growth",
    name: "Growth Route",
    focus: "Balanced tool mix",
    tone: "amber",
    badge: { icon: "🔥", label: "Recommended" },
  },
  {
    key: "accelerator",
    name: "Accelerator Route",
    focus: "Higher-impact combination",
    tone: "cyan",
    badge: { icon: "🚀", label: "Power Boost" },
  },
  {
    key: "elite",
    name: "Elite Route",
    focus: "Deeper route options",
    tone: "yellow",
    badge: { icon: "💎", label: "Premium" },
  },
];

const toneBorder = {
  lime: "border-lime-400/30",
  amber: "border-amber-400/30",
  cyan: "border-cyan-400/30",
  yellow: "border-yellow-300/30",
};

const toneText = {
  lime: "text-lime-300",
  amber: "text-amber-300",
  cyan: "text-cyan-300",
  yellow: "text-yellow-300",
};

const toneBadge = {
  lime: "border-lime-400/20 bg-lime-500/15 text-lime-300",
  amber: "border-amber-400/20 bg-amber-500/15 text-amber-300",
  cyan: "border-cyan-400/20 bg-cyan-500/15 text-cyan-300",
  yellow: "border-yellow-300/20 bg-yellow-400/10 text-yellow-300",
};

export default function RouteTierPanel() {
  return (
    <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6 shadow-md backdrop-blur-sm">
      <h3 className="text-center text-lg font-semibold tracking-tight text-white">
        Intelligent Routes Built Around Your Situation
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {ROUTES.map((route) => (
          <div
            key={route.key}
            className={`rounded-lg border p-4 text-center transition hover:bg-white/10 ${toneBorder[route.tone]}`}
          >
            <p className={`font-semibold ${toneText[route.tone]}`}>{route.name}</p>
            <p className="mt-1 text-xs text-slate-300">{route.focus}</p>

            <span
              className={`mt-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${toneBadge[route.tone]}`}
            >
              <span aria-hidden="true" className="text-sm leading-none">
                {route.badge.icon}
              </span>
              <span className="leading-none">{route.badge.label}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">What we analyze</p>
            <p className="mt-1 text-sm text-white">Profile, timeline, budget, goals</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">What we identify</p>
            <p className="mt-1 text-sm text-white">
              High-impact combinations of tools, features, and next steps
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">What you get</p>
            <p className="mt-1 text-sm text-white">An intelligent route, not random app stacking</p>
          </div>
        </div>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-lime-300">Highest-impact combinations first</p>
        <p className="text-emerald-400">Tools and features only where they may help</p>
        <p className="text-xs text-slate-500">Results vary by credit profile and reporting timelines.</p>
      </div>
    </div>
  );
}
