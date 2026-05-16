// src/pages/hero.jsx
import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function Hero({ embedded = false }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.querySelectorAll("[data-anim]").forEach((el, i) => {
      setTimeout(() => el.classList.add("show"), 30 + i * 40);
    });
  }, []);

  const goWizard = () => {
    try {
      localStorage.setItem("entryPoint", "hero");
    } catch {
      // ignore storage errors
    }
    navigate("/activate");
  };

  return (
    <div className="bg-gradient-to-br from-[#101012] via-[#0c0d0e] to-[#08090a] antialiased text-white">
      {!embedded && (
        <header
          className="init-opacity mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-6 md:flex-row md:items-center"
          data-anim=""
        >
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70"
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
          </button>

          <nav className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
            <a href="#main" className="text-neutral-300 transition-colors hover:text-white">
              Home
            </a>
            <a href="#how-it-works" className="text-neutral-300 transition-colors hover:text-white">
              How It Works
            </a>
            <a href="#pricing" className="text-neutral-300 transition-colors hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="text-neutral-300 transition-colors hover:text-white">
              FAQ
            </a>

            <Link to="/activate" aria-label="Start My CreditRoute" className="mt-1 inline-flex md:mt-0">
              <Button size="sm">Start My CreditRoute</Button>
            </Link>
          </nav>
        </header>
      )}

      <section
        id="main"
        className={`init-opacity mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 ${
          embedded ? "pt-8 pb-16" : "pt-20 pb-24"
        } lg:grid-cols-12`}
        data-anim=""
      >
        <div className="space-y-6 lg:col-span-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-gradient-to-r from-lime-400/10 to-emerald-500/10 px-3 py-1 text-xs text-lime-300">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="text-lime-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4h16v3H4z" />
              <path d="M4 10.5h16v3H4z" />
              <path d="M4 17h16v3H4z" />
            </svg>
            Personalized <span className="font-semibold text-white">CreditRoute</span>
          </div>

          <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Your personalized route to a higher credit score.
          </h1>

          <p className="max-w-2xl text-lg text-slate-300">
            CreditRoute helps organize the highest-impact combination of tools, features, and next steps into one intelligent route.
          </p>

          <p className="max-w-2xl text-sm text-neutral-400">
            We tell you which credit-building apps to use, in what order, and when.
          </p>

          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-2">
              <Button size="lg" onClick={goWizard} aria-label="Start My CreditRoute">
                Start My CreditRoute
              </Button>
              <p className="text-xs text-slate-500">
                Quick questions → personalized route → see your plan
              </p>
            </div>

            <a href="#how-it-works" aria-label="See how CreditRoute works" className="inline-flex">
              <Button variant="secondary" size="lg">
                See How It Works
              </Button>
            </a>
          </div>

          <p className="max-w-2xl text-xs text-slate-500">
            CreditRoute does not guarantee approval. It is an educational planning tool that helps you focus on next steps based on where you are now.
          </p>

          <p className="text-xs text-slate-500">
            No credit pull • No sensitive financial data • Takes less than 60 seconds
          </p>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-xl border border-dashed border-lime-400/25 bg-white/[0.055] p-6 shadow-xl shadow-lime-500/10 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-lime-300">
                  Sample route preview
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  Example next-step sequence
                </h3>
              </div>

              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-400">
                Illustrative only
              </span>
            </div>

            <div className="space-y-3">
              {[
                "Optimize utilization on card X",
                "Add a credit-builder loan",
                "Time your reporting cycle",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/25 p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-lime-400/25 bg-lime-500/10 text-sm font-semibold text-lime-300">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{step}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Your real route depends on your inputs and credit profile.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-slate-300">
                CreditRoute sequences practical moves so you know what to do first, what to do next,
                and where tools may help.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
