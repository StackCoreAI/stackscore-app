import React, { useMemo } from "react";
// reuse Phase-1 logic (Vite can import TS)
import {
  computeRowStates,
} from "../../shared/visibility.ts";

export default function PlanSection({ plan, hasAccess, className = "" }) {
  const apps = Array.isArray(plan?.apps) ? plan.apps : [];
  const unlockedIndex =
    Number.isFinite(plan?.unlocked_app_index) ? plan.unlocked_app_index : -1;

  const states = useMemo(
    () =>
      computeRowStates({
        hasAccess: !!hasAccess,
        unlockedIndex,
        appsCount: apps.length,
      }),
    [hasAccess, unlockedIndex, apps.length]
  );

  return (
    <article className={`bg-white rounded-2xl shadow p-5 ${className}`}>
      <header className="mb-3">
        <h3 className="text-xl font-semibold">
          {plan?.id ? `Plan ${plan.id}` : "Plan"}
          {plan?.title ? ` — ${plan.title}` : ""}
        </h3>
        {plan?.summary && (
          <p className="text-slate-600">{plan.summary}</p>
        )}
      </header>

      <ol className="space-y-3">
        {apps.map((a, i) => {
          const unlocked = states[i] === "unlocked";
          const why = a?.why || a?.app_description || a?.description || "";
          return (
            <li
              key={i}
              className={`rounded-xl border p-3 ${
                unlocked ? "bg-white" : "bg-slate-100 opacity-60"
              }`}
            >
              <div className="font-medium">{a?.app_name || "App"}</div>
              {why && <div className="text-sm text-slate-600">{why}</div>}
              {a?.app_cost && (
                <div className="text-xs text-slate-500 mt-1">Cost: {a.app_cost}</div>
              )}
            </li>
          );
        })}
      </ol>
    </article>
  );
}
