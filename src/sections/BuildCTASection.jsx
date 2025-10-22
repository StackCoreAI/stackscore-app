// src/sections/BuildCTASection.jsx
import React from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function BuildCTASection() {
  return (
    <section id="build" className="section py-20 bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:p-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to start? <span className="text-lime-300">6 simple clicks</span> and you’re on your way.
          </h2>
          <p className="mt-3 text-white/80">
            Answer a few quick questions and we’ll assemble your personalized StackScore preview.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {/* Primary CTA → Wizard */}
            <Link to="/wizard?fresh=1" aria-label="Start the 6-step wizard" className="inline-flex">
              <Button size="lg">🚀 Start in 6 clicks</Button>
            </Link>

            {/* Secondary CTA → 6 Simple Clicks explainer */}
            <Link to="/sixsimple" aria-label="See how the 6 clicks work" className="inline-flex">
              <Button variant="secondary" size="lg">📘 See how it works</Button>
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-xs text-white/50">
            Privacy-first. No hard pulls. Cancel anytime before purchase.
          </p>
        </div>
      </div>
    </section>
  );
}
