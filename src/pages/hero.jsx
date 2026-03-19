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

  const ROUTES = [
    {
      key: "foundation",
      name: "Foundation Route",
      focus: "Build your base",
      tone: "lime",
      badge: { icon: "💰", label: "Best Value" },
    },
    {
      key: "growth",
      name: "Growth Route",
      focus: "Balanced next moves",
      tone: "amber",
      badge: { icon: "🔥", label: "Recommended" },
    },
    {
      key: "accelerator",
      name: "Accelerator Route",
      focus: "Higher-impact sequencing",
      tone: "cyan",
      badge: { icon: "🚀", label: "Power Boost" },
    },
    {
      key: "elite",
      name: "Elite Route",
      focus: "Maximum route depth",
      tone: "yellow",
      badge: { icon: "💎", label: "Premium" },
    },
  ];

  const toneBorder = {
    lime: "border-lime-400/30",
    amber: "border-amber-400/30",
    cyan: "border-cyan-400/30",
    yellow: "border-yellow-300/30",
  };

  const toneText = {
    lime: "text-lime-300",
    amber: "text-amber-300",
    cyan: "text-cyan-300",
    yellow: "text-yellow-300",
  };

  const toneBadge = {
    lime: "border-lime-400/20 bg-lime-500/15 text-lime-300",
    amber: "border-amber-400/20 bg-amber-500/15 text-amber-300",
    cyan: "border-cyan-400/20 bg-cyan-500/15 text-cyan-300",
    yellow: "border-yellow-300/20 bg-yellow-400/10 text-yellow-300",
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
            <span className="text-lg font-semibold tracking-tight">StackScore</span>
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

            <Link to="/activate" aria-label="Get my credit route" className="mt-1 inline-flex md:mt-0">
              <Button size="sm">Get My Credit Route</Button>
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
            Personalized <span className="font-semibold text-white">Credit Routing</span>
          </div>

          <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            No single app fixes credit.
            <span className="block bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 bg-clip-text font-semibold text-transparent">
              StackScore shows you what actually moves it.
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-slate-300">
            StackScore analyzes your situation and maps the highest-impact moves for your credit profile in the
            right order. Because improving credit is not about one app. It is about the right actions,
            sequenced correctly.
          </p>

          <p className="text-sm text-neutral-400">
            Personalized credit routing based on your profile, timeline, budget, and goals.
          </p>

          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-2">
              <Button size="lg" onClick={goWizard} aria-label="Get my credit route">
                Get My Credit Route
              </Button>
              <p className="text-xs text-slate-500">
                Quick questions → personalized routes → unlock when you’re ready
              </p>
            </div>

            <a href="#how-it-works" aria-label="See how StackScore works" className="inline-flex">
              <Button variant="secondary" size="lg">
                See How It Works
              </Button>
            </a>
          </div>

          <p className="max-w-2xl text-xs text-slate-500">
            StackScore does not guarantee approval. It helps you focus on the moves most likely to strengthen
            your credit profile based on where you are now.
          </p>

          <p className="text-xs text-slate-500">
            No credit pull • No sensitive financial data required • Results vary by credit profile and reporting
            timelines
          </p>
        </div>

        <div className="lg:col-span-6">
          <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6 shadow-md backdrop-blur-sm">
            <h3 className="text-center text-lg font-semibold tracking-tight text-white">
              Credit Routes Built Around Your Situation
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {ROUTES.map((route) => (
                <div
                  key={route.key}
                  className={`rounded-lg border p-4 text-center transition hover:bg-white/10 ${toneBorder[route.tone]}`}
                >
                  <p className={`font-semibold ${toneText[route.tone]}`}>{route.name}</p>
                  <p className="mt-1 text-xs text-slate-300">{route.focus}</p>

                  <span
                    className={`mt-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${toneBadge[route.tone]}`}
                  >
                    <span aria-hidden="true" className="text-sm leading-none">
                      {route.badge.icon}
                    </span>
                    <span className="leading-none">{route.badge.label}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">What we analyze</p>
                  <p className="mt-1 text-sm text-white">Profile, timeline, budget, goals</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">What we identify</p>
                  <p className="mt-1 text-sm text-white">The levers most likely to move your profile</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">What you get</p>
                  <p className="mt-1 text-sm text-white">A prioritized route, not a random stack of apps</p>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-center">
              <p className="text-lime-300">Highest-impact moves first</p>
              <p className="text-emerald-400">Tools only where they actually help</p>
              <p className="text-xs text-slate-500">Results vary by credit profile and reporting timelines.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}