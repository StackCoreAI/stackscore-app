// src/pages/landing.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

import HeroSection from "../sections/HeroSection.jsx";
import SixSimpleSection from "../sections/SixSimpleSection.jsx";
import PreviewTeaserSection from "../sections/PreviewTeaserSection.jsx";
import PricingSection from "../sections/PricingSection.jsx";
import FAQSection from "../sections/FAQSection.jsx";
import BuildCTASection from "../sections/BuildCTASection.jsx";

// Minimal ErrorBoundary (unchanged)
class SectionBoundary extends React.Component {
  constructor(p){ super(p); this.state={hasError:false, err:null}; }
  static getDerivedStateFromError(err){ return {hasError:true, err}; }
  componentDidCatch(err, info){ console.error("[Section crash]", this.props.label, err, info); }
  render(){
    if(this.state.hasError){
      return (
        <div className="mx-auto max-w-6xl px-4 py-12 border border-red-500/40 rounded-xl bg-red-500/5">
          <p className="text-red-300 font-semibold">Section failed to render: {this.props.label}</p>
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
    <div className="min-h-[100svh] bg-neutral-950 text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="#hero" className="flex items-center gap-2 font-semibold" aria-label="StackScore — go to top">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-lime-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 4h16v3H4z" /><path d="M4 10.5h16v3H4z" /><path d="M4 17h16v3H4z" />
            </svg>
            <span className="tracking-tight">StackScore</span>
          </a>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#features" className="hover:text-lime-300/90">Features</a>
            <a href="#results"  className="hover:text-lime-300/90">Results</a>
            <a href="#pricing"  className="hover:text-lime-300/90">Pricing</a>
            <a href="#faq"      className="hover:text-lime-300/90">FAQ</a>
            <a href="#build"    className="hover:text-lime-300/90">Build</a>
          </nav>

          {/* Top-right CTAs (universal button) */}
          <div className="flex items-center gap-3">
            {/* Desktop primary */}
            <Link to="/wizard?fresh=1" aria-label="Start building your stack" className="hidden sm:block">
              <Button size="sm">🚀 Build my stack</Button>
            </Link>

            {/* Desktop secondary */}
            <a href="#pricing" className="hidden sm:inline-flex">
              <Button variant="secondary" size="sm">Get StackScore</Button>
            </a>

            {/* Mobile primary (compact) */}
            <Link to="/wizard?fresh=1" aria-label="Build my stack" className="sm:hidden inline-flex">
              <Button size="sm">Build</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24">
        <SectionBoundary label="Hero">
          <section id="hero"><HeroSection /></section>
        </SectionBoundary>
        <div className="sr-only" data-sentinel="after-hero" />

        <SectionBoundary label="SixSimple">
          <section id="features"><SixSimpleSection /></section>
        </SectionBoundary>
        <div className="sr-only" data-sentinel="after-features" />

        <SectionBoundary label="PreviewTeaser">
          <section id="results"><PreviewTeaserSection /></section>
        </SectionBoundary>
        <div className="sr-only" data-sentinel="after-results" />

        <SectionBoundary label="Pricing">
          <section id="pricing"><PricingSection /></section>
        </SectionBoundary>
        <div className="sr-only" data-sentinel="after-pricing" />

        <SectionBoundary label="FAQ">
          <section id="faq"><FAQSection /></section>
        </SectionBoundary>
        <div className="sr-only" data-sentinel="after-faq" />

        <SectionBoundary label="BuildCTA">
          <section id="build"><BuildCTASection /></section>
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
