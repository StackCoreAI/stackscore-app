// src/pages/sixsimple.jsx
import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";

const SixSimple = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const checklistItems = [
    {
      title: "Starting Point",
      description:
        "We identify where you are now — whether you are building from a thin file or working to rebuild around negative items.",
      delay: "0.10s",
    },
    {
      title: "Timeline",
      description:
        "Tell us how quickly you want progress so we can prioritize the moves most likely to matter first.",
      delay: "0.20s",
    },
    {
      title: "Budget",
      description:
        "We keep your route realistic by fitting it to what you can actually spend and sustain.",
      delay: "0.30s",
    },
    {
      title: "Living Situation",
      description:
        "Rent or own — we look for practical reporting opportunities that fit your real setup.",
      delay: "0.40s",
    },
    {
      title: "Employment + Stability",
      description:
        "We use simple profile context to shape a route that feels executable, not theoretical.",
      delay: "0.50s",
    },
    {
      title: "Execution Style",
      description:
        "Manual or automated — CreditRoute helps you follow a route you are actually likely to complete.",
      delay: "0.60s",
    },
  ];

  const barData = [
    { name: "Start", height: "h-44", color: "bg-cyan-400", delay: "0.10s" },
    { name: "Time", height: "h-36", color: "bg-green-400", delay: "0.22s" },
    { name: "Budget", height: "h-40", color: "bg-pink-500", delay: "0.34s" },
    { name: "Living", height: "h-34", color: "bg-purple-500", delay: "0.46s" },
    { name: "Profile", height: "h-48", color: "bg-yellow-400", delay: "0.58s" },
    { name: "Style", height: "h-44", color: "bg-orange-400", delay: "0.70s" },
  ];

  const legendData = [
    { name: "Start", color: "bg-cyan-400" },
    { name: "Time", color: "bg-green-400" },
    { name: "Budget", color: "bg-pink-500" },
    { name: "Living", color: "bg-purple-500" },
    { name: "Profile", color: "bg-yellow-400" },
    { name: "Style", color: "bg-orange-400" },
  ];

  return (
    <div
      id="how-it-works"
      className="flex flex-col bg-neutral-950 text-white"
    >
      {!embedded && (
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6 pb-4">
          <Link
            to="/"
            className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70"
            aria-label="CreditRoute — home"
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
            <span className="text-lg font-semibold tracking-tight">CreditRoute</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/activate" className="hidden sm:inline-flex" aria-label="Start My CreditRoute">
              <Button size="sm">Start My CreditRoute</Button>
            </Link>

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
      )}

      <main className={`flex flex-1 justify-center p-6 ${embedded ? "items-start pt-8" : "items-center"}`}>
        <div className="flex w-full max-w-6xl flex-col gap-12 md:flex-row">
          <section className="md:w-1/2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-lime-500/10 px-3 py-1 text-xs text-lime-300">
              How CreditRoute Works
            </div>

            <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Your CreditRoute, in{" "}
              <span className="text-cyan-400">6 Simple Inputs</span>
            </h1>

            <p className="max-w-xl text-lg text-slate-300">
              CreditRoute does not guess and it does not push random apps. It uses a few simple
              inputs to identify the levers most likely to strengthen your credit profile and then
              organizes them into a smarter route.
            </p>

            <p className="mt-4 text-sm text-slate-400">
              The value is not one product. The value is knowing what to do first, what to do next,
              and where tools actually help.
            </p>

            <ul className="mt-8 space-y-6 text-lg">
              {checklistItems.map((item, index) => (
                <li
                  key={index}
                  className={`flex items-start transition-all duration-700 ease-out ${
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
                  style={{ transitionDelay: isVisible ? item.delay : "0s" }}
                >
                  <CheckCircle
                    className="mr-3 h-7 w-7 shrink-0 text-green-500"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <p>
                    <strong>{item.title}</strong> — {item.description}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-base font-semibold text-white">What happens after the 6 inputs?</h3>
              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">1.</span>
                  <span>We assess your profile and execution reality.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">2.</span>
                  <span>We identify the factors most likely to move your credit profile.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">3.</span>
                  <span>You get a prioritized CreditRoute instead of a random stack of apps.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">4.</span>
                  <span>Tools are shown only where they actually help execute the route.</span>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link to="/activate" className="inline-flex" aria-label="Start My CreditRoute">
                <Button size="md">Start My CreditRoute</Button>
              </Link>
              <Link to="/preview" className="inline-flex" aria-label="View My CreditRoutes">
                <Button variant="secondary" size="md">
                  View My CreditRoutes
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-xs text-neutral-500">
              Takes less than 60 seconds · No credit pull · No sensitive financial data required
            </p>
          </section>

          <section className="flex flex-col items-center text-center md:w-1/2">
            <h2 className="mb-3 text-2xl font-semibold sm:text-3xl">What CreditRoute analyzes</h2>
            <p className="mb-6 max-w-md text-sm text-neutral-400">
              These inputs help CreditRoute decide which levers matter most, what sequence makes the
              most sense, and how to keep your route realistic.
            </p>

            <div className="flex h-64 w-full max-w-md items-end justify-center gap-3">
              {barData.map((bar, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`${bar.color} ${bar.height} w-6 rounded-t-lg origin-bottom transition-all duration-200 hover:scale-105 hover:drop-shadow-lg ${
                      isVisible ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                    }`}
                    style={{
                      transitionDelay: isVisible ? bar.delay : "0s",
                      transitionDuration: "0.8s",
                      transitionTimingFunction: "ease-out",
                    }}
                    aria-hidden="true"
                  />
                  <span className="mt-2 text-sm">{bar.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              {legendData.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className={`h-3 w-3 rounded-full ${item.color}`} aria-hidden="true" /> {item.name}
                </div>
              ))}
            </div>

            <div className="mt-8 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left">
              <h3 className="text-base font-semibold text-white">What you get on the result screen</h3>
              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">✓</span>
                  <span>Your personalized CreditRoute</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">✓</span>
                  <span>Highest-impact moves first</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">✓</span>
                  <span>Step-by-step execution guidance</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">✓</span>
                  <span>Tools only where they actually help</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-center">
              <p className="text-sm">
                <span className="font-semibold">Core principle:</span>
                <span className="ml-2 font-semibold text-cyan-400">Sequence beats randomness</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold">Output:</span>
                <span className="ml-2 text-green-400 drop-shadow-md">A prioritized route</span>
              </p>
            </div>
          </section>
        </div>
      </main>

      {!embedded && (
        <footer className="mt-12 px-4 pb-6 text-center text-xs text-neutral-500">
          <div className="space-x-4">
            <a href="/privacy-policy" className="transition hover:text-white">
              Privacy Policy
            </a>
            <a href="/terms" className="transition hover:text-white">
              Terms of Use
            </a>
            <a href="/cookies" className="transition hover:text-white">
              Cookie Disclaimer
            </a>
          </div>
          <p className="mt-2">
            This site uses cookies to enhance your experience. By continuing, you agree to our use of cookies.
          </p>
        </footer>
      )}
    </div>
  );
};

export default SixSimple;