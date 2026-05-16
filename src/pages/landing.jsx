// src/pages/landing.jsx
import React, { useEffect } from "react";
import Button from "@/components/ui/Button";

import Hero from "../pages/hero.jsx";
import SixSimple from "../pages/sixsimple.jsx";
import Pricing from "../pages/pricing.jsx";
import FAQ from "../pages/faq.jsx";

function TrustStrip() {
  const items = [
    "Built by a founder who lived this",
    "100% private — no credit pull required",
    "Educational planning, not financial advice",
    "No credit card to begin",
  ];

  return (
    <div className="border-y border-white/[0.06] bg-neutral-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 py-3 text-center text-xs text-neutral-500 sm:flex-row sm:flex-wrap sm:gap-3">
        {items.map((item, index) => (
          <React.Fragment key={item}>
            {index > 0 && (
              <span className="hidden h-3 w-px bg-white/10 sm:inline-block" aria-hidden="true" />
            )}
            <span>{item}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function FounderBridge() {
  return (
    <section className="bg-neutral-950 px-4 py-8 md:py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.055] p-6 text-center shadow-xl shadow-black/20 md:flex-row md:items-center md:gap-8 md:p-8 md:text-left">
        <img
          src="/assets/founder-e-joseph-martin.jpg"
          alt="E. Joseph Martin, founder of CreditRoute"
          className="aspect-square h-[88px] w-[88px] shrink-0 rounded-full border border-lime-400/25 object-cover object-top shadow-lg shadow-lime-500/10 md:h-24 md:w-24"
        />

        <div>
          <blockquote className="text-2xl font-light leading-snug tracking-tight text-white md:text-3xl">
            “I went from being told ‘no’ by a three-digit number to here. I built CreditRoute so
            you wouldn’t have to figure it out alone.”
          </blockquote>

          <p className="mt-5 text-sm font-semibold text-neutral-300">E. Joseph Martin, Founder</p>

          <a
            href="#founder-story"
            className="mt-5 inline-flex text-sm font-semibold text-lime-300 transition-colors hover:text-lime-200"
          >
            Read my full story →
          </a>
        </div>
      </div>
    </section>
  );
}

class SectionBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }
  componentDidCatch(err, info) {
    console.error("[Section crash]", this.props.label, err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-6xl rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-12">
          <p className="font-semibold text-red-300">
            Section failed to render: {this.props.label}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Landing() {
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, []);

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-neutral-950 text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a
            href="#hero"
            className="flex items-center gap-2 font-semibold"
            aria-label="CreditRoute — go to top"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-lime-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 4h16v3H4z" />
              <path d="M4 10.5h16v3H4z" />
              <path d="M4 17h16v3H4z" />
            </svg>
            <span className="tracking-tight">CreditRoute</span>
          </a>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#features" className="hover:text-lime-300/90">Features</a>
            <a href="#pricing" className="hover:text-lime-300/90">Pricing</a>
            <a href="#faq" className="hover:text-lime-300/90">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/activate" aria-label="Start My CreditRoute" className="hidden sm:block">
              <Button size="sm">🚀 Start My CreditRoute</Button>
            </a>

            <a href="#pricing" className="hidden sm:inline-flex">
              <Button variant="secondary" size="sm">Start My CreditRoute</Button>
            </a>

            <a href="/activate" aria-label="Start My CreditRoute" className="inline-flex sm:hidden">
              <Button size="sm">Start</Button>
            </a>
          </div>
        </div>
      </header>

      <main className="pt-24">
        <SectionBoundary label="Hero">
          <section id="hero" className="scroll-mt-24 pb-8 md:pb-12">
            <Hero embedded />
          </section>
        </SectionBoundary>

        <SectionBoundary label="TrustStrip">
          <TrustStrip />
        </SectionBoundary>

        <SectionBoundary label="FounderBridge">
          <FounderBridge />
        </SectionBoundary>

        <SectionBoundary label="SixSimple">
          <section id="features" className="scroll-mt-24 py-8 md:py-12">
            <SixSimple embedded />
          </section>
        </SectionBoundary>

        <SectionBoundary label="Pricing">
          <section id="pricing" className="scroll-mt-24 py-8 md:py-12">
            <Pricing embedded />
          </section>
        </SectionBoundary>

        <SectionBoundary label="FAQ">
          <section className="pt-8 md:pt-12">
            <FAQ embedded />
          </section>
        </SectionBoundary>
      </main>

      <footer className="border-t border-white/10 py-10 text-center text-white/60">
        <div className="mx-auto max-w-6xl px-4">
          <p>&copy; {new Date().getFullYear()} CreditRoute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
