// src/sections/StacksSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

const PLANS = [
  {
    key: "foundation",
    title: "Foundation Route",
    blurb: "Baseline credit route for quick wins.",
    ring: "ring-lime-400",
    points: "+10–30 pts",
    to: "/preview?plan=foundation",
  },
  {
    key: "growth",
    title: "Growth Route",
    blurb: "Broader reporting + stabilization.",
    ring: "ring-cyan-400",
    points: "+40–70 pts",
    to: "/preview?plan=growth",
  },
  {
    key: "accelerator",
    title: "Accelerator Route",
    blurb: "Faster pacing for bigger gains.",
    ring: "ring-violet-400",
    points: "+80–100 pts",
    to: "/preview?plan=accelerator",
  },
  {
    key: "elite",
    title: "Elite Route",
    blurb: "Premium substitutes + polish.",
    ring: "ring-amber-400",
    points: "100+ pts",
    to: "/preview?plan=elite",
  },
];

export default function StacksSection() {
  return (
    <section id="plans" className="section py-20 bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Choose your Credit Route</h2>

        <div className="grid md:grid-cols-4 gap-6">
          {PLANS.map((p) => (
            <article
              key={p.key}
              className={`rounded-2xl border border-white/10 bg-white/[0.04] p-6 ring-1 ${p.ring}`}
            >
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-white/70 mt-2">{p.blurb}</p>

              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/60">Projected gain</div>
                <div className="text-lg font-semibold">{p.points}</div>
              </div>

              <div className="mt-4">
                <Link to={p.to} className="inline-flex w-full">
                  <Button size="sm" className="w-full">Open full route preview</Button>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Section-level CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link to="/wizard?fresh=1" className="inline-flex">
            <Button size="lg">🚀 Find My First Point Move</Button>
          </Link>
          <Link to="/faq" className="inline-flex">
            <Button variant="secondary" size="lg">📘 See How It Works</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}