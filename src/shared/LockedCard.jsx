import React from "react";

export default function LockedCard() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-sm rounded-2xl z-10">
      <div className="text-center">
        <div className="font-semibold mb-2">Unlock this Credit Route</div>
        <div className="text-sm text-slate-600">
          Unlock StackScore Access to view the full route and step-by-step Point Moves.
        </div>
      </div>
    </div>
  );
}