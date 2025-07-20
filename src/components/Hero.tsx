import React from "react";
import HeaderNav from "./HeaderNav";
import GainsCard from "./GainsCard";
import CTABlock from "./CTABlock";

const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-[#101012] via-[#0c0d0e] to-[#08090a] text-white min-h-screen">
      <HeaderNav />
      <section
        id="main"
        className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-20 pb-24"
      >
        {/* Left */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime-400/30 bg-gradient-to-r from-lime-400/10 to-emerald-500/10 text-xs text-lime-300">
            <i data-lucide="sparkles" className="w-4 h-4" />
            AI‑Powered Financial Stack
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
            Build a Better Credit Score<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 font-semibold">
              in 6 Clicks
            </span>
          </h1>
          <p className="text-slate-300 text-lg max-w-md">
            Discover your personalized AI credit‑stacking plan. Verified apps. Instant results. No guesswork.
          </p>
          <CTABlock />
        </div>

        {/* Right */}
        <div className="lg:col-span-6">
          <GainsCard />
        </div>
      </section>
    </div>
  );
};

export default Hero;
