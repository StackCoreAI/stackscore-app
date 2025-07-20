import React from "react";

const GainsCard = () => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-md space-y-6">
      <h3 className="text-white font-semibold text-lg text-center tracking-tight">StackScore Gains</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 text-center rounded-lg border border-lime-400/30 hover:bg-white/10 transition">
          <p className="text-lime-400 font-semibold">Lite Stack</p>
          <p className="text-slate-300 text-xs">+10–30 pts</p>
        </div>
        <div className="p-4 text-center rounded-lg border border-emerald-400/30 hover:bg-white/10 transition">
          <p className="text-emerald-400 font-semibold">Core Stack</p>
          <p className="text-slate-300 text-xs">+40–70 pts</p>
        </div>
        <div className="p-4 text-center rounded-lg border border-cyan-400/30 hover:bg-white/10 transition">
          <p className="text-cyan-400 font-semibold">Boosted Stack</p>
          <p className="text-slate-300 text-xs">+80–100 pts</p>
        </div>
        <div className="p-4 text-center rounded-lg border border-yellow-300/30 hover:bg-white/10 transition">
          <p className="text-yellow-300 font-semibold">Max Stack</p>
          <p className="text-slate-300 text-xs">100+ pts</p>
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-lime-300">Stack Impact: ★★★★★</p>
        <p className="text-emerald-400">Synergy Score: High</p>
        <p className="text-xs text-slate-500">Based on verified user reports. Results may vary.</p>
      </div>
    </div>
  );
};

export default GainsCard;
