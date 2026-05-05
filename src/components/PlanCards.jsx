// src/components/PlanCards.jsx
import { useState } from "react";
import Button from "@/components/ui/Button";

function Group({ title, items = [], onAdd }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-xs text-slate-400">{items?.length || 0} options</span>
      </div>

      <ul className="space-y-2">
        {(items || []).map((it, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
          >
            <a
              href={it.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-white hover:underline"
            >
              {it.name}
            </a>

            <Button
              size="sm"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => onAdd(it)}
            >
              Add to Route
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PlanCards({ plan }) {
  const [selected, setSelected] = useState(() => {
    try {
      const raw = sessionStorage.getItem("ss_selected_tools");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const add = (item) => {
    const exists = selected.some((s) => s?.name === item?.name);
    if (exists) return;

    const next = [...selected, item];
    setSelected(next);

    try {
      sessionStorage.setItem("ss_selected_tools", JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  if (!plan) return null;

  const { gains, stack = {} } = plan;

  return (
    <div className="space-y-6">
      {gains && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-white">CreditRoute Outlook</h2>
          <p className="mt-1 text-sm text-slate-300">
            Foundation {gains.lite} · Growth {gains.core} · Accelerator {gains.boosted} · Elite{" "}
            {gains.max}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            These route ranges are directional estimates. Actual results vary by profile, timing,
            and execution.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Group
          title="Subscription Reporting Options"
          items={stack.subscriptionTrackers}
          onAdd={add}
        />
        <Group
          title="Credit Building Options"
          items={stack.creditBuilders}
          onAdd={add}
        />
        <Group
          title="Dispute Support Options"
          items={stack.disputeTools}
          onAdd={add}
        />
        <Group
          title="Utility Reporting Options"
          items={stack.utilityReporting}
          onAdd={add}
        />
        <Group
          title="Insights + Monitoring Options"
          items={stack.insights}
          onAdd={add}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-white">
          Route Tools You’re Considering ({selected.length})
        </h3>

        {selected.length === 0 ? (
          <p className="mt-1 text-sm text-slate-400">
            Add tools here as you evaluate which options best support your CreditRoute.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {selected.map((s, i) => (
              <li
                key={i}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-white"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
