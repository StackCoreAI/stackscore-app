// src/components/PreviewHeader.jsx
import { useMemo, useState } from "react";

export default function PreviewHeader({
  answers = {},
  refreshedAt,
  onEdit, onReset, onRefresh,
}) {
  const [open, setOpen] = useState(false);

  const lastRef = useMemo(() => {
    if (!refreshedAt) return "now";
    const diff = Date.now() - refreshedAt;
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    return `${hrs}h ago`;
  }, [refreshedAt]);

  return (
    <div className="bg-gray-900 text-gray-100">
      {/* brand + actions */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="text-lime-400" xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4h16v3H4z"></path>
            <path d="M4 10.5h16v3H4z"></path>
            <path d="M4 17h16v3H4z"></path>
          </svg>
          <span className="text-lg font-semibold tracking-tight">StackScore</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="px-4 py-2 rounded-full border border-white/30 text-white/90 hover:text-white hover:bg-white/5 transition">Edit answers</button>
          <button onClick={onReset} className="px-4 py-2 rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-semibold hover:brightness-110 transition">Start over</button>
        </div>
      </div>

      {/* hero */}
      <div className="max-w-5xl mx-auto px-4 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold">Your Personalized <span className="text-lime-400">Stacks</span></h1>
        <p className="mt-3 text-neutral-300">
          Based on your answers, we’re assembling the optimal plans to maximize your credit gains with minimal friction.
        </p>

        {/* chips — same order/labels as wizard */}
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <Chip label="Living Situation" value={pretty(answers?.housing)} />
          <Chip label="Subscriptions, entertainment" value={answers?.subs?.length ? answers.subs.join(", ") : "None"} />
          <Chip label="Tool preference" value={prettyTools(answers?.tools)} />
          <Chip label="Employment, status" value={pretty(answers?.employment)} />
          <Chip label="Goal, timeline" value={prettyGoal(answers?.goal)} />
          <Chip label="Budget" value={answers?.budget ? `$${answers.budget}/mo` : "—"} />

          <span className="ml-auto text-xs text-neutral-400">
            Last refreshed <span className="text-neutral-300">{lastRef}</span>
          </span>
          <button onClick={() => setOpen(true)} className="ml-1 rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/5">
            Refresh plan
          </button>
        </div>
      </div>

      {/* mini refresh overlay */}
      {open && (
        <MiniRefresh
          initial={answers}
          onClose={() => setOpen(false)}
          onApply={(updates) => { onRefresh?.(updates); setOpen(false); }}
        />
      )}
    </div>
  );
}

function Chip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1">
      <span className="text-neutral-400">{label}:</span>
      <span className="text-neutral-100 font-medium">{value ?? "—"}</span>
    </span>
  );
}

function MiniRefresh({ initial = {}, onApply, onClose }) {
  const [budget, setBudget] = useState(String(initial.budget ?? "45"));
  const [goal, setGoal] = useState(String(initial.goal ?? "90"));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 p-5">
        <h2 className="text-lg font-semibold">Quick refresh</h2>
        <p className="text-sm text-neutral-400 mt-1">Adjust these and we’ll rebuild your four stacks.</p>

        <div className="mt-5 space-y-6">
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Monthly budget</label>
            <input type="range" min="20" max="200" step="5" value={budget}
              onChange={(e) => setBudget(e.target.value)} className="w-full accent-lime-500" />
            <div className="text-center mt-2 font-medium">${budget}/mo</div>
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-2">Goal timeline</label>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {[
                { v: "30", label: "ASAP (30d)" },
                { v: "90", label: "90 Days" },
                { v: "flexible", label: "Flexible" },
              ].map((g) => (
                <button key={g.v} onClick={() => setGoal(g.v)}
                  className={`rounded-lg border px-3 py-2 ${goal === g.v ? "bg-white/10 border-white/30" : "border-white/10 hover:bg-white/5"}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-white/20 px-4 py-1.5 text-sm hover:bg-white/5">Cancel</button>
          <button onClick={() => onApply?.({ budget, goal })}
            className="rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 text-black px-4 py-1.5 text-sm font-semibold hover:brightness-110">
            Apply & refresh
          </button>
        </div>
      </div>
    </div>
  );
}

/* helpers */
function pretty(x) { if (!x) return "—"; return x.replace(/-/g, " ").replace(/\b\w/g, m => m.toUpperCase()); }
function prettyTools(x) { if (x === "auto") return "Automated (recommended)"; if (x === "manual") return "Manual"; if (x === "not-sure") return "Not sure"; return "—"; }
function prettyGoal(x) { if (x === "30") return "ASAP (30 days)"; if (x === "90") return "90 Days"; if (x === "flexible") return "Flexible"; return "—"; }
