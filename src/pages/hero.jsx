// src/pages/hero.jsx
import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  useEffect(() => {
    // simple fade-in like the HTML version
    document.querySelectorAll("[data-anim]").forEach((el, i) => {
      setTimeout(() => el.classList.add("show"), 30 + i * 40);
    });
  }, []);

  const goWizard = () => {
    try { localStorage.setItem("entryPoint", "hero"); } catch {}
    navigate("/wizard?fresh=1");
  };

  return (
    <div className="bg-gradient-to-br from-[#101012] via-[#0c0d0e] to-[#08090a] text-white min-h-screen antialiased">
      {/* NAV */}
      <header
        className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 init-opacity"
        data-anim=""
      >
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-lime-400" aria-hidden="true">
            <path d="M4 4h16v3H4z"></path>
            <path d="M4 10.5h16v3H4z"></path>
            <path d="M4 17h16v3H4z"></path>
          </svg>
          <span className="text-lg font-semibold tracking-tight text-white">StackScore</span>
        </button>

        {/* Links (now real routes via <Link>) */}
        <nav className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
          <Link to="/" className="text-neutral-300 hover:text-white transition-colors">Home</Link>
          <Link to="/sixsimple" className="text-neutral-300 hover:text-white transition-colors">Features</Link>
          <Link to="/preview" className="text-neutral-300 hover:text-white transition-colors">Results</Link>

          {/* NEW: Pricing link */}
          <Link to="/pricing" className="text-neutral-300 hover:text-white transition-colors">Pricing</Link>

          <Link to="/faq" className="text-neutral-300 hover:text-white transition-colors">FAQ</Link>
          <button
            type="button"
            onClick={goWizard}
            className="flex items-center gap-1 text-lime-300 hover:text-lime-200 transition-colors"
            title="Build"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" className="text-lime-300" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h6l3 9 4-18 3 9h6" />
            </svg>
            <span>Build</span>
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section
        id="main"
        className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-20 pb-24 init-opacity"
        data-anim=""
      >
        {/* Left */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime-400/30 bg-gradient-to-r from-lime-400/10 to-emerald-500/10 text-xs text-lime-300">
            <svg width="16" height="16" viewBox="0 0 24 24" className="text-lime-300" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l2.4 4.9L20 9l-4 3.9.9 5.6L12 16.9 7.1 18.5 8 12.9 4 9l5.6-1.1L12 3z" />
            </svg>
            AI-Powered Financial Stack
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
            Build a Better Credit Score<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 font-semibold">
              in&nbsp;6&nbsp;Clicks
            </span>
          </h1>

          <p className="text-slate-300 text-lg max-w-md">
            Discover your personalized AI credit-stacking plan. Verified apps. Instant results. No guesswork.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              type="button"
              onClick={goWizard}
              aria-label="Start building my credit stack"
              className="bg-gradient-to-r from-lime-400 to-emerald-500 text-black rounded-full font-semibold px-6 py-3 transition hover:scale-105 hover:shadow-md hover:brightness-110"
            >
              🚀 Build My Stack
            </button>

            <Link
              to="/faq"
              aria-label="Learn how StackScore works"
              className="border border-slate-600 text-white rounded-full px-6 py-3 transition hover:border-lime-400/60 hover:bg-lime-400/10 inline-flex items-center justify-center"
            >
              📘 Learn How It Works
            </Link>
          </div>
        </div>

        {/* Right — Gains card */}
        <div className="lg:col-span-6">
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
        </div>
      </section>
    </div>
  );
}
