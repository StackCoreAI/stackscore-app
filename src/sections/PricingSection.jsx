// src/sections/PricingSection.jsx
import React, { useState, useEffect } from "react";
import { Lock, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function PricingSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  // tiny logo mark next to CTA
  const StackScoreLogo = ({ className = "w-6 h-6" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`text-lime-400 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 4h16v3H4z" />
      <path d="M4 10.5h16v3H4z" />
      <path d="M4 17h16v3H4z" />
    </svg>
  );

  return (
    <section id="pricing" className="section py-20 bg-neutral-950 text-neutral-400">
      {/* Main Pricing */}
      <div
        className={`flex flex-col items-center text-center space-y-6 max-w-xl mx-auto px-4 sm:px-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h2 className="text-3xl md:text-4xl font-semibold text-lime-400 tracking-tight">
          Simple Pricing
        </h2>

        <p className="text-xl md:text-2xl text-white font-medium">
          One-Time Access — Just $29
        </p>

        <p className="text-sm text-neutral-400">
          Your StackScore plan is tailored to you — and always just{" "}
          <span className="text-lime-400 font-semibold">$29</span>.
        </p>

        <div className="mt-2 flex flex-col items-center gap-1 text-sm text-white">
          <span className="text-neutral-400">
            You’ll be able to select from one of these four personalized plans.
            <br />
            Your goals, your choice.
          </span>

          {/* Canonical stack names */}
          <ul className="flex flex-wrap justify-center gap-4 text-lime-400 font-medium mt-1">
            <li className="flex items-center gap-1">📦 Foundation</li>
            <li className="flex items-center gap-1">📈 Growth</li>
            <li className="flex items-center gap-1">⚡ Accelerator</li>
            <li className="flex items-center gap-1">👑 Elite</li>
          </ul>
        </div>

        {/* CTAs with stacked logos */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <div className="hidden sm:block">
            <StackScoreLogo className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <Link to="/wizard?reset=1">
            <Button size="lg">Get Your StackScore</Button>
          </Link>

          <Link to="/faq">
            <Button variant="secondary" size="lg">Learn How It Works</Button>
          </Link>

          <div className="hidden sm:block">
            <StackScoreLogo className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Post-Purchase Refresh Offer */}
      <div
        className={`mt-16 border-t border-neutral-800 pt-8 text-center space-y-4 max-w-xl mx-auto px-4 sm:px-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionDelay: "240ms" }}
      >
        <h3 className="text-2xl md:text-3xl font-semibold text-white flex items-center justify-center gap-2 tracking-tight">
          <RotateCcw className="w-6 h-6 stroke-lime-400" strokeWidth="1.5" />
          Need a Refresh?
        </h3>

        <p className="text-neutral-400">
          Life changes — and your plan should evolve with it. Refresh your StackScore for just{" "}
          <span className="text-lime-400 font-semibold">$14.50</span> starting 120 days after your original purchase.
        </p>

        <div className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg text-sm text-neutral-300 italic max-w-xl mx-auto">
          “Seasons shift. So do your goals. Refresh your StackScore after 4 months to reflect what’s next —
          whether it’s a new move, new job, or a bigger goal.”
        </div>

        <div className="pt-2">
          <Button variant="secondary" size="md" disabled>
            <Lock className="w-4 h-4 mr-2" />
            Available in 120 Days
          </Button>
        </div>
      </div>
    </section>
  );
}
