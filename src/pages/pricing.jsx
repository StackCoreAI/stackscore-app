// src/pages/pricing.jsx
import React, { useState, useEffect } from "react";
import { Lock, RotateCcw } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import Button from "@/components/ui/Button";

const Pricing = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStackScore = () => {
    navigate("/wizard?reset=1", { state: { from: "pricing", reset: true } });
  };

  const StackScoreLogo = ({ className = "w-6 h-6" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
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
    <div className="bg-neutral-950 font-sans text-neutral-400 flex flex-col min-h-screen">
      <SiteHeader />

      <main
        className={`flex-grow flex flex-col items-center text-center space-y-6 max-w-xl mx-auto px-4 sm:px-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl md:text-4xl font-semibold text-lime-400 tracking-tight mt-8">
          One Credit Route. One Price. $29
        </h1>

        <p className="text-xl md:text-2xl text-white font-medium">
          One-Time Access — Just $29
        </p>

        <p className="text-center text-sm text-neutral-400 mt-2">
          You’re not buying “an app list.” You’re unlocking a{" "}
          <span className="text-white font-semibold">Credit Route</span>: the
          highest-impact <span className="text-white font-semibold">Point Moves</span>{" "}
          sequenced for your situation — with built-in reroutes (substitutes).
        </p>

        <div className="mt-2 flex flex-col items-center gap-1 text-sm text-white">
          <span className="text-neutral-400">
            You’ll see four possible Credit Routes — then unlock the one you want.
          </span>

          <ul className="flex flex-wrap justify-center gap-3 sm:gap-4 text-lime-300 font-medium mt-2">
            <li className="px-2 py-1 rounded-full bg-white/5 border border-white/10">🔰 Foundation Route</li>
            <li className="px-2 py-1 rounded-full bg-white/5 border border-white/10">📈 Growth Route</li>
            <li className="px-2 py-1 rounded-full bg-white/5 border border-white/10">⚡ Accelerator Route</li>
            <li className="px-2 py-1 rounded-full bg-white/5 border border-white/10">👑 Elite Route</li>
          </ul>

          <p className="mt-3 text-xs text-neutral-500">
            No credit pull. No sensitive financial data required. Point movement depends on your credit profile and reporting timelines.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <StackScoreLogo className="w-5 h-5 sm:w-6 sm:h-6" />

          <Button size="lg" onClick={handleGetStackScore} aria-label="Build my credit route">
            Build My Credit Route
          </Button>

          <StackScoreLogo className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <div className="mt-2 flex gap-3">
          <Link to="/preview" className="inline-flex">
            <Button variant="secondary" size="md">Preview my Credit Routes</Button>
          </Link>
          <Link to="/sixsimple" className="inline-flex">
            <Button variant="secondary" size="md">See how it works</Button>
          </Link>
        </div>

        {/* What’s included */}
        <div className="mt-8 w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left">
  <h3 className="text-base font-semibold text-white mb-4">
    What You Unlock Inside Your Credit Route
  </h3>

  <ul className="space-y-3 text-sm text-neutral-300">
    <li>• Your fully mapped Credit Route</li>
    <li>• Recombined high-impact reporting features across multiple apps</li>
    <li>• Step-by-step Point Move sequence (in the correct order)</li>
    <li>• Built-in reroutes if a tool isn’t available or doesn’t report</li>
    <li>• Printable Credit Route blueprint</li>
  </ul>

  <p className="mt-4 text-xs text-neutral-500">
    The power isn’t in one tool. It’s in how the features are combined.
  </p>
</div>
      </main>

      {/* Post-Purchase Refresh Offer */}
      <section
        className={`mt-16 border-t border-neutral-800 pt-8 text-center space-y-4 max-w-xl mx-auto px-4 sm:px-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionDelay: "240ms" }}
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-white flex items-center justify-center gap-2 tracking-tight">
          <RotateCcw className="w-6 h-6 stroke-lime-400" strokeWidth="1.5" />
          Need a Refresh?
        </h2>

        <p className="text-neutral-400">
          Life changes — and your Credit Route should evolve with it. Refresh your StackScore for just{" "}
          <span className="text-lime-400 font-semibold">$14.50</span> starting 120 days after your original purchase.
        </p>

        <div className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg text-sm text-neutral-300 italic max-w-xl mx-auto">
          “Seasons shift. So do your goals. Refresh your StackScore after 4 months to reflect what’s next — whether it’s a new move,
          new job, or a bigger goal.”
        </div>

        <div className="pt-2">
          <Button variant="secondary" size="md" disabled>
            <Lock className="w-4 h-4 mr-2" />
            Available in 120 Days
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Pricing;