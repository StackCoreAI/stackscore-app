// src/pages/hero.jsx
import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function Hero() {
  const navigate = useNavigate();

  useEffect(() => {
    // simple fade-in like the HTML version
    document.querySelectorAll("[data-anim]").forEach((el, i) => {
      setTimeout(() => el.classList.add("show"), 30 + i * 40);
    });
  }, []);

  const goWizard = () => {
    try {
      localStorage.setItem("entryPoint", "hero");
    } catch {}
    navigate("/wizard?fresh=1");
  };

  // Canonical gains tiles
  const GAINS = [
    { key: "foundation", name: "Foundation Route", pts: "+10–30 pts", tone: "lime", badge: { icon: "💰", label: "Best Value" } },
    { key: "growth", name: "Growth Route", pts: "+40–70 pts", tone: "amber", badge: { icon: "🔥", label: "Popular Choice" } },
    { key: "accelerator", name: "Accelerator Route", pts: "+80–100 pts", tone: "cyan", badge: { icon: "🚀", label: "Power Boost" } },
    { key: "elite", name: "Elite Route", pts: "100+ pts", tone: "yellow", badge: { icon: "💎", label: "Premium" } },
  ];
  const toneBorder = { lime: "border-lime-400/30", amber: "border-amber-400/30", cyan: "border-cyan-400/30", yellow: "border-yellow-300/30" };
  const toneText = { lime: "text-lime-300", amber: "text-amber-300", cyan: "text-cyan-300", yellow: "text-yellow-300" };
  const toneBadge = {
    lime: "border-lime-400/20 bg-lime-500/15 text-lime-300",
    amber: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    cyan: "border-cyan-400/20 bg-cyan-500/15 text-cyan-300",
    yellow: "border-yellow-300/20 bg-yellow-400/10 text-yellow-300",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101012] via-[#0c0d0e] to-[#08090a] antialiased text-white">
      {/* NAV */}
      <header
        className="init-opacity mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-6 md:flex-row md:items-center"
        data-anim=""
      >
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-lime-400" aria-hidden="true">
            <path d="M4 4h16v3H4z" />
            <path d="M4 10.5h16v3H4z" />
            <path d="M4 17h16v3H4z" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">StackScore</span>
        </button>

        {/* Links */}
        <nav className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
          <Link to="/" className="text-neutral-300 transition-colors hover:text-white">
            Home
          </Link>
          <Link to="/sixsimple" className="text-neutral-300 transition-colors hover:text-white">
            Features
          </Link>
          <Link to="/preview" className="text-neutral-300 transition-colors hover:text-white">
            Results
          </Link>
          <Link to="/pricing" className="text-neutral-300 transition-colors hover:text-white">
            Pricing
          </Link>
          <Link to="/faq" className="text-neutral-300 transition-colors hover:text-white">
            FAQ
          </Link>

          {/* Build CTA (primary) */}
          <Link to="/wizard?fresh=1" aria-label="Start my credit route" className="mt-1 inline-flex md:mt-0">
  <Button size="sm">🚀 Start My Credit Route</Button>
</Link>
        </nav>
      </header>

      {/* HERO */}
      <section
        id="main"
        className="init-opacity mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pt-20 pb-24 lg:grid-cols-12"
        data-anim=""
      >
        {/* Left */}
        <div className="space-y-6 lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-gradient-to-r from-lime-400/10 to-emerald-500/10 px-3 py-1 text-xs text-lime-300">
            <svg width="16" height="16" viewBox="0 0 24 24" className="text-lime-300" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16v3H4z" />
              <path d="M4 10.5h16v3H4z" />
              <path d="M4 17h16v3H4z" />
            </svg>
            StackScore is <span className="font-semibold text-white">Credit Routing</span>
          </div>

          <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Route your credit score upward.
          </h1>

          <p className="max-w-xl text-lg text-slate-300">
            StackScore maps your highest-impact{" "}
            <span className="text-white font-medium">Point Moves</span>{" "}
            in the right order — with built-in reroutes.
          </p>

          <p className="text-sm text-neutral-400 mt-2">
            Powered by intelligent feature recombination across multiple apps.
          </p>

          {/* CTA block */}
          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-2">
              <Button size="lg" onClick={goWizard} aria-label="Find my first point move">
                🚀 Find My First Point Move
              </Button>
              <p className="text-xs text-slate-500">
                Takes less than 60 seconds · No credit pull · Based on your habits and preferences
              </p>
            </div>

            <Link to="/sixsimple" aria-label="See how credit routing works" className="inline-flex">
              <Button variant="secondary" size="lg">
                📘 See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust line */}
          <p className="text-xs text-slate-500">
            Privacy-first. No sensitive financial data required. Results vary by credit profile and reporting timelines.
          </p>
        </div>

        {/* Right — Gains card */}
        <div className="lg:col-span-6">
          <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6 shadow-md backdrop-blur-sm">
            <h3 className="text-center text-lg font-semibold tracking-tight text-white">
              Possible Credit Routes
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {GAINS.map((g) => (
                <div
                  key={g.key}
                  className={`rounded-lg border p-4 text-center transition hover:bg-white/10 ${toneBorder[g.tone]}`}
                >
                  <p className={`font-semibold ${toneText[g.tone]}`}>{g.name}</p>
                  <p className="text-xs text-slate-300">{g.pts}</p>

                  <span
                    className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${toneBadge[g.tone]}`}
                  >
                    <span aria-hidden="true" className="text-sm leading-none">
                      {g.badge.icon}
                    </span>
                    <span className="leading-none">{g.badge.label}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-center">
              <p className="text-lime-300">Route Strength: ★★★★★</p>
              <p className="text-emerald-400">Synergy Score: High</p>
              <p className="text-xs text-slate-500">Based on verified user reports. Results may vary.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}