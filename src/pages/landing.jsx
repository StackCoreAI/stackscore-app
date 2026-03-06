// src/pages/landing.jsx
import React, { useEffect } from "react";
import Button from "@/components/ui/Button";

import Hero from "../pages/hero.jsx";
import SixSimple from "../pages/sixsimple.jsx";
import Pricing from "../pages/pricing.jsx";
import FAQ from "../pages/faq.jsx";

// Minimal ErrorBoundary
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
      {/* Master header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a
            href="#hero"
            className="flex items-center gap-2 font-semibold"
            aria-label="StackScore — go to top"
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
            <span className="tracking-tight">StackScore</span>
          </a>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#features" className="hover:text-lime-300/90">Features</a>
            <a href="#pricing" className="hover:text-lime-300/90">Pricing</a>
            <a href="#faq" className="hover:text-lime-300/90">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/activate" aria-label="Start building your stack" className="hidden sm:block">
              <Button size="sm">🚀 Start my Credit Route</Button>
            </a>

            <a href="#pricing" className="hidden sm:inline-flex">
              <Button variant="secondary" size="sm">Get StackScore</Button>
            </a>

            <a href="/activate" aria-label="Start my Credit Route" className="inline-flex sm:hidden">
              <Button size="sm">Build</Button>
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
    <section id="faq" className="scroll-mt-24 pt-8 md:pt-12">
      <FAQ embedded />
    </section>
  </SectionBoundary>
</main>

      <footer className="border-t border-white/10 py-10 text-center text-white/60">
        <div className="mx-auto max-w-6xl px-4">
          <p>&copy; {new Date().getFullYear()} StackScore. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}