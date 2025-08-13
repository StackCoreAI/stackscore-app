import React from "react";

export default function LockedCard() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-sm rounded-2xl z-10">
      <div className="text-center">
        <div className="font-semibold mb-2">Unlock this stack</div>
        <div className="text-sm text-slate-600">Create an account to view everything.</div>
      </div>
    </div>
  );
}
