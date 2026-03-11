import React from "react";

export default function StepDots({ total = 3, active = 1 }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${
            i + 1 <= active ? "bg-black" : "bg-slate-300"
          }`}
        />
      ))}
    </div>
  );
}
