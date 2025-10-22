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

  const checklistItems = [
    { title: "Living Situation", description: "Tell us how you're living so we can report rent or mortgage.", delay: "0.10s" },
    { title: "Entertainment",    description: "Let us know your subscriptions so we can turn them into tradelines.", delay: "0.20s" },
    { title: "Utilities",        description: "Power, water, and gas bills that boost your credit file.", delay: "0.30s" },
    { title: "Phone Plan",       description: "Every on-time payment becomes a credit signal.", delay: "0.40s" },
    { title: "Budget",           description: "Connect your bank and auto-tune your utilization and spending.", delay: "0.50s" },
    { title: "Credit Repair",    description: "Tell the bureaus: \"Fix my report\" with AI-driven disputing tools.", delay: "0.60s" },
  ];

  const barData = [
    { name: "Rent",     height: "h-48", color: "bg-cyan-400",   delay: "0.10s" },
    { name: "Subs",     height: "h-40", color: "bg-green-400",  delay: "0.22s" },
    { name: "Utilities",height: "h-44", color: "bg-pink-500",   delay: "0.34s" },
    { name: "Phone",    height: "h-36", color: "bg-purple-500", delay: "0.46s" },
    { name: "Budget",   height: "h-52", color: "bg-yellow-400", delay: "0.58s" },
    { name: "Repair",   height: "h-48", color: "bg-orange-400", delay: "0.70s" },
  ];

  const legendData = [
    { name: "Rent", color: "bg-cyan-400" },
    { name: "Subs", color: "bg-green-400" },
    { name: "Utilities", color: "bg-pink-500" },
    { name: "Phone", color: "bg-purple-500" },
    { name: "Budget", color: "bg-yellow-400" },
    { name: "Repair", color: "bg-orange-400" },
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
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-lime-400" aria-hidden="true">
            <path d="M4 4h16v3H4z" /><path d="M4 10.5h16v3H4z" /><path d="M4 17h16v3H4z" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">StackScore</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Primary CTA (brand) */}
          <Link to="/wizard" className="hidden sm:inline-flex">
            <Button size="sm">🚀 Build my stack</Button>
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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-8">
              Your StackScore Plan, in <span className="text-cyan-400">6&nbsp;Simple&nbsp;Clicks</span>
            </h1>

            <ul className="space-y-6 text-lg">
              {checklistItems.map((item, index) => (
                <li
                  key={index}
                  className={`flex items-start transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                  style={{ transitionDelay: isVisible ? item.delay : "0s" }}
                >
                  <CheckCircle className="text-green-500 w-7 h-7 mr-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <p><strong>{item.title}</strong> — {item.description}</p>
                </li>
              ))}
            </ul>

            {/* CTAs — prevent dead end */}
            <div className="mt-10 flex items-center gap-4">
              <Link to="/wizard" className="inline-flex">
                <Button size="md">Start the 6 clicks</Button>
              </Link>
              <Link to="/preview" className="inline-flex">
                <Button variant="secondary" size="md">Preview my stacks</Button>
              </Link>
            </div>
          </section>

          {/* Right - Bars */}
          <section className="md:w-1/2 flex flex-col items-center text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Smart StackScore Preview</h2>

            <div className="flex justify-center items-end gap-3 h-64 w-full max-w-md">
              {barData.map((bar, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`${bar.color} ${bar.height} w-6 rounded-t-lg hover:scale-105 hover:drop-shadow-lg transition-all duration-200 origin-bottom ${isVisible ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"}`}
                    style={{ transitionDelay: isVisible ? bar.delay : "0s", transitionDuration: "0.8s", transitionTimingFunction: "ease-out" }}
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
              <p className="text-sm"><span className="font-semibold">Stack Impact:</span><span className="text-green-400 text-xl drop-shadow-md ml-2">★★★★★</span></p>
              <p className="text-sm"><span className="font-semibold">Synergy Score:</span><span className="text-cyan-400 font-semibold ml-2">High</span></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-xs text-neutral-500 text-center px-4 mt-12 pb-6">
        <div className="space-x-4">
          <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition">Terms of Use</Link>
          <Link to="/cookies" className="hover:text-white transition">Cookie Disclaimer</Link>
        </div>
        <p className="mt-2">This site uses cookies to enhance your experience. By continuing, you agree to our use of cookies.</p>
      </footer>
    </div>
  );
};

export default SixSimple;
