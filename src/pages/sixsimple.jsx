// src/pages/sixsimple.jsx
import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";

const SixSimple = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Credit Routing-aligned “6 clicks”
  const checklistItems = [
    {
      title: "Living Situation",
      description: "Rent or own — we route you toward the best reporting options for your situation.",
      delay: "0.10s",
    },
    {
      title: "Subscriptions",
      description: "Tell us what you already pay for — we match Point Moves that can report (when available).",
      delay: "0.20s",
    },
    {
      title: "Utilities",
      description: "Power, water, gas — we prioritize routes that turn on-time payments into credit signals.",
      delay: "0.30s",
    },
    {
      title: "Phone Plan",
      description: "If your carrier can report, that’s a clean Point Move we’ll sequence in the right spot.",
      delay: "0.40s",
    },
    {
      title: "Budget",
      description: "Set your monthly budget — we filter routes so you’re never pushed into the wrong spend level.",
      delay: "0.50s",
    },
    {
      title: "Point Move Style",
      description: "Manual vs automated — you choose the route style that fits your habits.",
      delay: "0.60s",
    },
  ];

  // Keep the bars as a visual metaphor, but rename the labels to match routing language
  const barData = [
    { name: "Rent/Own", height: "h-48", color: "bg-cyan-400", delay: "0.10s" },
    { name: "Subs", height: "h-40", color: "bg-green-400", delay: "0.22s" },
    { name: "Utilities", height: "h-44", color: "bg-pink-500", delay: "0.34s" },
    { name: "Phone", height: "h-36", color: "bg-purple-500", delay: "0.46s" },
    { name: "Budget", height: "h-52", color: "bg-yellow-400", delay: "0.58s" },
    { name: "Style", height: "h-48", color: "bg-orange-400", delay: "0.70s" },
  ];

  const legendData = [
    { name: "Rent/Own", color: "bg-cyan-400" },
    { name: "Subs", color: "bg-green-400" },
    { name: "Utilities", color: "bg-pink-500" },
    { name: "Phone", color: "bg-purple-500" },
    { name: "Budget", color: "bg-yellow-400" },
    { name: "Style", color: "bg-orange-400" },
  ];

  return (
    <div className="bg-neutral-950 text-white min-h-screen flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70"
          aria-label="StackScore — home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            className="text-lime-400"
            aria-hidden="true"
          >
            <path d="M4 4h16v3H4z" />
            <path d="M4 10.5h16v3H4z" />
            <path d="M4 17h16v3H4z" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">StackScore</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Primary CTA */}
          <Link to="/wizard?fresh=1" className="hidden sm:inline-flex">
            <Button size="sm">🚀 Find My First Point Move</Button>
          </Link>
          {/* Secondary: Back */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            aria-label="Back"
          >
            ← Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl flex flex-col md:flex-row gap-12">
          {/* Left - Checklist */}
          <section className="md:w-1/2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              Your Credit Route, in{" "}
              <span className="text-cyan-400">6&nbsp;Simple&nbsp;Clicks</span>
            </h1>

            <p className="max-w-xl text-lg text-slate-300">
  We don’t pull credit and we don’t ask for sensitive financial data.
  No single app has every high-impact feature.
  StackScore identifies the strongest reporting features across multiple apps,
  recombines them intelligently, and sequences them into your personalized
  <span className="text-white font-medium"> Credit Route</span>.
</p>

<p className="mt-4 text-sm text-slate-400">
  The power isn’t in one tool. It’s in how the features are combined.
</p>

            <ul className="space-y-6 text-lg">
              {checklistItems.map((item, index) => (
                <li
                  key={index}
                  className={`flex items-start transition-all duration-700 ease-out ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                  }`}
                  style={{ transitionDelay: isVisible ? item.delay : "0s" }}
                >
                  <CheckCircle
                    className="text-green-500 w-7 h-7 mr-3 shrink-0"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <p>
                    <strong>{item.title}</strong> — {item.description}
                  </p>
                </li>
              ))}
            </ul>

            {/* CTAs — prevent dead end */}
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <Link to="/wizard?fresh=1" className="inline-flex">
                <Button size="md">Start the 6 clicks</Button>
              </Link>
              <Link to="/preview" className="inline-flex">
                <Button variant="secondary" size="md">
                  View my Credit Routes
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-xs text-neutral-500">
              Takes less than 60 seconds · No credit pull · Based on your habits and preferences
            </p>
          </section>

          {/* Right - Bars */}
          <section className="md:w-1/2 flex flex-col items-center text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3">Your routing inputs</h2>
            <p className="text-sm text-neutral-400 mb-6 max-w-md">
              These six inputs help StackScore choose the best Point Moves and sequence them into a clean Credit Route.
            </p>

            <div className="flex justify-center items-end gap-3 h-64 w-full max-w-md">
              {barData.map((bar, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`${bar.color} ${bar.height} w-6 rounded-t-lg hover:scale-105 hover:drop-shadow-lg transition-all duration-200 origin-bottom ${
                      isVisible ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                    }`}
                    style={{
                      transitionDelay: isVisible ? bar.delay : "0s",
                      transitionDuration: "0.8s",
                      transitionTimingFunction: "ease-out",
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-sm mt-2">{bar.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              {legendData.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded-full ${item.color}`} aria-hidden="true" /> {item.name}
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 text-center">
              <p className="text-sm">
                <span className="font-semibold">Route Strength:</span>
                <span className="text-green-400 text-xl drop-shadow-md ml-2">★★★★★</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold">Synergy Score:</span>
                <span className="text-cyan-400 font-semibold ml-2">High</span>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer (use anchors, not router Links, to avoid context edge cases) */}
      <footer className="text-xs text-neutral-500 text-center px-4 mt-12 pb-6">
        <div className="space-x-4">
          <a href="/privacy-policy" className="hover:text-white transition">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-white transition">
            Terms of Use
          </a>
          <a href="/cookies" className="hover:text-white transition">
            Cookie Disclaimer
          </a>
        </div>
        <p className="mt-2">
          This site uses cookies to enhance your experience. By continuing, you agree to our use of cookies.
        </p>
      </footer>
    </div>
  );
};

export default SixSimple;