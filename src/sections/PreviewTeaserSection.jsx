// src/sections/PreviewTeaserSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

// Same icon + wording chips as PlanGrid
const PLANS = [
  {
    key: "foundation",
    label: "Foundation Stack",
    gain: "+10–30 pts",
    emoji: "💰",
    chip: { text: "Best Value",    style: "bg-lime-500/15 border border-lime-400/20 text-lime-300" },
    accent: "ring-lime-400",
  },
  {
    key: "growth",
    label: "Growth Stack",
    gain: "+40–70 pts",
    emoji: "🔥",
    chip: { text: "Popular Choice", style: "bg-amber-500/15 border border-amber-400/20 text-amber-300" },
    accent: "ring-cyan-400",
  },
  {
    key: "accelerator",
    label: "Accelerator Stack",
    gain: "+80–100 pts",
    emoji: "🚀",
    chip: { text: "Power Boost",   style: "bg-violet-500/15 border border-violet-400/20 text-violet-300" },
    accent: "ring-violet-400",
  },
  {
    key: "elite",
    label: "Elite Stack",
    gain: "100+ pts",
    emoji: "💎",
    chip: { text: "Premium",       style: "bg-cyan-500/15 border border-cyan-400/20 text-cyan-300" },
    accent: "ring-amber-400",
  },
];

export default function PreviewTeaserSection() {
  return (
    <section id="results" className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-3xl md:text-4xl font-black tracking-tight">
        Preview Your <span className="text-lime-400">Stacks</span>
      </h2>
      <p className="mt-2 text-white/70">
        Here’s a peek at what your AI-assembled stacks look like. We reveal the first app in the full preview.
      </p>

      <div className="mt-8 grid gap-7 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
        {PLANS.map(({ key, label, gain, emoji, chip, accent }) => (
          <article
            key={key}
            className={`rounded-2xl border border-white/10 bg-white/5 p-5 ring-1 ${accent} transition hover:bg-white/[0.06]`}
          >
            <header className="mb-3 text-center">
              <h3 className="font-semibold leading-tight">{label}</h3>
              <p className="text-sm text-white/80">{gain}</p>

              {/* Centered wording chip with BIG icon bubble */}
              <div className="-mt-0.5 flex justify-center">
                <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 ${chip.style}`}>
                  <span
                    className="grid h-8 w-8 place-items-center rounded-md bg-white/6 border border-white/10 text-base"
                    aria-hidden="true"
                  >
                    {emoji}
                  </span>
                  <span className="text-xs sm:text-[13px] font-medium">{chip.text}</span>
                </span>
              </div>
            </header>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/70">
              <div className="mb-1 text-xs">App 1</div>
              <div className="font-medium">…</div>
            </div>

            <ul className="mt-3 space-y-2">
              <li className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-white/60">
                🔒 App 2 is hidden — unlock with StackScore Access
              </li>
              <li className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-white/60">
                🔒 App 3 is hidden — unlock with StackScore Access
              </li>
            </ul>

            <div className="mt-4">
              <Link to="/preview" aria-label={`Open full preview for ${label}`} className="inline-flex w-full">
                <Button size="sm" className="w-full">Open full preview</Button>
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Section-level CTAs */}
      <div className="mt-6 flex gap-4">
        <Link to="/wizard" className="inline-flex">
          <Button variant="secondary">Edit answers</Button>
        </Link>
        <Link to="/preview" className="inline-flex">
          <Button>Compare all apps</Button>
        </Link>
      </div>
    </section>
  );
}
