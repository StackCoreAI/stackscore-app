// src/sections/HeroSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  const GAINS = [
    { key: "foundation", name: "Foundation Stack", badge: { icon: "💰", title: "Best Value" }, points: "+10–30 pts", tone: "lime" },
    { key: "growth", name: "Growth Stack", badge: { icon: "🔥", title: "Popular Choice" }, points: "+40–70 pts", tone: "amber" },
    { key: "accelerator", name: "Accelerator Stack", badge: { icon: "🚀", title: "Power Boost" }, points: "+80–100 pts", tone: "cyan" },
    { key: "elite", name: "Elite Stack", badge: { icon: "💎", title: "Premium" }, points: "100+ pts", tone: "yellow" },
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

  return (
    <section id="hero" className="section pt-16 pb-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-gradient-to-r from-lime-400/10 to-emerald-500/10 px-3 py-1 text-xs text-lime-300">
            <svg width="16" height="16" viewBox="0 0 24 24" className="text-lime-300" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3l2.4 4.9L20 9l-4 3.9.9 5.6L12 16.9 7.1 18.5 8 12.9 4 9l5.6-1.1L12 3z" />
            </svg>
            AI-Powered Financial Stack
          </div>

          <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Build a Better Credit Score
            <br />
            <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 bg-clip-text font-semibold text-transparent">
              in&nbsp;6&nbsp;Clicks
            </span>
          </h1>

          <p className="max-w-md text-lg text-slate-300">
            Discover your personalized AI credit-stacking plan. Verified apps. Instant results. No guesswork.
          </p>

          <div className="flex flex-col gap-4 pt-2 sm:flex-row">
            {/* Primary CTA → Wizard */}
            <Link to="/wizard?fresh=1">
              <Button size="lg">🚀 Build My Stack</Button>
            </Link>

            {/* Secondary CTA → FAQ */}
            <Link to="/faq">
              <Button variant="secondary" size="lg">📘 Learn How It Works</Button>
            </Link>
          </div>
        </div>

        {/* Right column — Gains card */}
        <div className="lg:col-span-6">
          <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6 shadow-md backdrop-blur-sm">
            <h3 className="text-center text-lg font-semibold tracking-tight text-white">StackScore Gains</h3>

            <div className="grid grid-cols-2 gap-3">
              {GAINS.map((g) => (
                <div
                  key={g.key}
                  className={`rounded-lg border p-4 text-center transition hover:bg-white/10 ${toneBorder[g.tone]}`}
                >
                  <p className={`font-semibold ${toneText[g.tone]}`}>{g.name}</p>
                  <p className="text-xs text-slate-300">{g.points}</p>

                  <div
                    className={`mx-auto mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium
                    ${g.tone === "amber" ? "border-amber-400/20 bg-amber-500/15 text-amber-300" : ""}
                    ${g.tone === "lime" ? "border-lime-400/20 bg-lime-500/15 text-lime-300" : ""}
                    ${g.tone === "cyan" ? "border-cyan-400/20 bg-cyan-500/15 text-cyan-300" : ""}
                    ${g.tone === "yellow" ? "border-yellow-300/20 bg-yellow-400/10 text-yellow-300" : ""}`}
                  >
                    <span aria-hidden="true" className="text-sm leading-none">
                      {g.badge.icon}
                    </span>
                    <span className="leading-none">{g.badge.title}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center space-y-1">
              <p className="text-lime-300">Stack Impact: ★★★★★</p>
              <p className="text-emerald-400">Synergy Score: High</p>
              <p className="text-xs text-slate-500">Based on verified user reports. Results may vary.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

