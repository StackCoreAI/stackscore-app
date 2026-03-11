import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingDown, Briefcase, GraduationCap, Rocket } from "lucide-react";

const About = () => {
  const navigate = useNavigate();
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    const total = 7;
    Array.from({ length: total }, (_, i) => setTimeout(() => setAnimationStage(i + 1), 150 + i * 120));
  }, []);

  const reveal = (n) => (animationStage >= n ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-4 blur-sm");

  const targetAudience = [
    { icon: TrendingDown, text: "Credit rebuilders who need a fast lift" },
    { icon: Briefcase, text: "Entrepreneurs building fundable profiles" },
    { icon: GraduationCap, text: "Young professionals starting from scratch" },
    { icon: Rocket, text: "Anyone aiming for higher credit scores to unlock more approvals at lower interest rates" }
  ];

  return (
    <div className="bg-neutral-950 text-white font-sans scroll-smooth px-6 py-12 md:py-16 space-y-16 max-w-3xl mx-auto min-h-screen">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" className="text-lime-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 4h16v5H4z" /><path d="M4 15h16v5H4z" />
        </svg>
        <span className="text-lg font-semibold tracking-tight">StackScore</span>
      </Link>

      {/* Title */}
      <header className={`space-y-4 text-center transition-all duration-700 ease-out ${reveal(1)}`}>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-lime-400">About StackScore</h1>
        <p className="text-neutral-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          Discover how StackScore helps you build credit faster, smarter, and with real results — powered by verified data and tailored stacks.
        </p>
      </header>

      <div className="border-t border-neutral-800/60" />

      <section className={`space-y-3 transition-all duration-700 ease-out ${reveal(2)}`}>
        <h2 className="text-2xl font-medium tracking-tight text-lime-300">What is StackScore?</h2>
        <p className="text-neutral-300 text-sm leading-relaxed">
          StackScore is an AI-powered tool that builds customized credit-building stacks using verified apps — matched to your goals, timeline, and budget.
        </p>
      </section>

      <section className={`space-y-3 transition-all duration-700 ease-out ${reveal(3)}`}>
        <h2 className="text-2xl font-medium tracking-tight text-lime-300">Why stacks &gt; individual apps?</h2>
        <p className="text-neutral-300 text-sm leading-relaxed">
          Single apps give a partial lift. Smart sequences (stacks) create synergy across mix, speed, and reporting visibility for higher FICO potential.
        </p>
      </section>

      <section className={`space-y-4 transition-all duration-700 ease-out ${reveal(4)}`}>
        <h2 className="text-2xl font-medium tracking-tight text-lime-300">Who is StackScore for?</h2>
        <ul className="space-y-3">
          {targetAudience.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={i} className="flex items-start gap-3 text-neutral-300 text-sm">
                <Icon className="w-4 h-4 mt-0.5 text-lime-400 shrink-0" strokeWidth={1.5} />
                <span>{item.text}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`space-y-3 transition-all duration-700 ease-out ${reveal(5)}`}>
        <h2 className="text-2xl font-medium tracking-tight text-lime-300">The Verified Database Edge</h2>
        <p className="text-neutral-300 text-sm leading-relaxed">
          We track, verify, and score credit-building tools continuously, so your plan stays relevant and high-performing.
        </p>
      </section>

      <section className={`space-y-3 transition-all duration-700 ease-out ${reveal(6)}`}>
        <h2 className="text-2xl font-medium tracking-tight text-lime-300">Our Mission</h2>
        <p className="text-neutral-300 text-sm leading-relaxed">
          Unlock financial mobility for everyone—no gatekeepers, no guessing. Strong credit is a right; StackScore puts you in control.
        </p>
      </section>

      <footer className={`pt-10 text-center transition-all duration-700 ease-out ${reveal(7)}`}>
        <button onClick={() => navigate("/")} className="text-sm text-lime-400 underline hover:text-lime-300 transition-colors">
          ← Back to your dashboard
        </button>
      </footer>
    </div>
  );
};

export default About;
