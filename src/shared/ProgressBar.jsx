import React from "react";

export default function ProgressBar({ value = 0 }) {
  return (
    <div className="h-2 w-40 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-emerald-600"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
