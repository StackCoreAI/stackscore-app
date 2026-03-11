// src/components/PlanCards.jsx
import { useState } from "react";
import Button from "@/components/ui/Button";

function Group({ title, items = [], onAdd }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-slate-500">{items?.length || 0} picks</span>
      </div>
      <ul className="space-y-2">
        {(items || []).map((it, idx) => (
          <li key={idx} className="flex items-center justify-between rounded-lg border p-3">
            <a
              href={it.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline"
            >
              {it.name}
            </a>

            {/* Brand CTA (light gradient + dark text) */}
            <Button
              size="sm"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => onAdd(it)}
            >
              Add to My Stack
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PlanCards({ plan }) {
  const [selected, setSelected] = useState(() => {
    const raw = sessionStorage.getItem("ss_selected");
    return raw ? JSON.parse(raw) : [];
  });

  const add = (item) => {
    const next = [...selected, item];
    setSelected(next);
    sessionStorage.setItem("ss_selected", JSON.stringify(next));
  };

  if (!plan) return null;
  const { gains, stack = {} } = plan;

  return (
    <div className="space-y-6">
      {gains && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Projected Gains</h2>
          <p className="mt-1 text-sm text-slate-600">
            {/* Map old keys → branded names */}
            Foundation {gains.lite} · Growth {gains.core} · Accelerator {gains.boosted} · Elite {gains.max}
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Group title="Subscription Trackers" items={stack.subscriptionTrackers} onAdd={add} />
        <Group title="Credit Builders" items={stack.creditBuilders} onAdd={add} />
        <Group title="Dispute Tools" items={stack.disputeTools} onAdd={add} />
        <Group title="Utility Reporting" items={stack.utilityReporting} onAdd={add} />
        <Group title="Insights" items={stack.insights} onAdd={add} />
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">My Stack ({selected.length})</h3>
        {selected.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">
            Pick a few apps to build your personalized stack.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {selected.map((s, i) => (
              <li key={i} className="rounded-full border px-3 py-1 text-sm">
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
