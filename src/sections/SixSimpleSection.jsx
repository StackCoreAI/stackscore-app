// src/sections/SixSimpleSection.jsx
import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function SixSimpleSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const checklistItems = [
    { title: "Living Situation", description: "Tell us how you're living so we can report rent or mortgage.", delay: "0.1s" },
    { title: "Entertainment",   description: "Let us know your subscriptions so we can turn them into tradelines.", delay: "0.3s" },
    { title: "Utilities",       description: "Power, water, and gas bills that boost your credit file.", delay: "0.5s" },
    { title: "Phone Plan",      description: "Every on-time payment becomes a credit signal.", delay: "0.7s" },
    { title: "Budget",          description: "Connect your bank and auto-tune your utilization and spending.", delay: "0.9s" },
    { title: "Credit Repair",   description: 'Tell the bureaus: "Fix my report" with AI-driven disputing tools.', delay: "1.1s" }
  ];

  const barData = [
    { name: "Rent",      height: "h-48", color: "bg-cyan-400",   delay: "0.1s"  },
    { name: "Subs",      height: "h-40", color: "bg-green-400",  delay: "0.25s" },
    { name: "Utilities", height: "h-44", color: "bg-pink-500",   delay: "0.4s"  },
    { name: "Phone",     height: "h-36", color: "bg-purple-500", delay: "0.55s" },
    { name: "Budget",    height: "h-52", color: "bg-yellow-400", delay: "0.7s"  },
    { name: "Repair",    height: "h-48", color: "bg-orange-400", delay: "0.85s" }
  ];

  const legendData = [
    { name: "Rent",      color: "bg-cyan-400"   },
    { name: "Subs",      color: "bg-green-400"  },
    { name: "Utilities", color: "bg-pink-500"   },
    { name: "Phone",     color: "bg-purple-500" },
    { name: "Budget",    color: "bg-yellow-400" },
    { name: "Repair",    color: "bg-orange-400" }
  ];

  // Keep the anchor id as "features" so existing header links (#features) still work.
  return (
    <section id="features" className="section py-20 bg-neutral-950 text-white">
      <div className="w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-12 items-start">
        {/* Left — Checklist */}
        <div className="md:w-1/2">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-8">
            Your Credit Route, in <span className="text-cyan-400">6&nbsp;Simple&nbsp;Clicks</span>
          </h2>

          <ul className="space-y-6 text-lg">
            {checklistItems.map((item, i) => (
              <li
                key={i}
                className={`flex items-start transition-all duration-600 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
                style={{ transitionDelay: isVisible ? item.delay : "0s" }}
              >
                <CheckCircle
                  className="text-green-500 w-7 h-7 mr-3 shrink-0 hover:animate-pulse"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <p>
                  <strong>{item.title}</strong> — {item.description}
                </p>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/wizard?fresh=1">
              <Button size="md">Start in 6 clicks</Button>
            </Link>
            <Link to="/faq">
              <Button variant="secondary" size="md">Learn how it works</Button>
            </Link>
          </div>
        </div>

        {/* Right — Bars + legend */}
        <div className="md:w-1/2 flex flex-col items-center text-center">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-6">Smart Credit Route Preview</h3>

          <div className="flex justify-center items-end gap-3 h-64 w-full max-w-md">
            {barData.map((bar, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`${bar.color} ${bar.height} w-6 rounded-t-lg origin-bottom transition-all duration-700 ease-out ${
                    isVisible ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                  }`}
                  style={{ transitionDelay: isVisible ? bar.delay : "0s" }}
                />
                <span className="text-sm mt-2">{bar.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            {legendData.map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded-full ${item.color}`} /> {item.name}
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
        </div>
      </div>
    </section>
  );
}