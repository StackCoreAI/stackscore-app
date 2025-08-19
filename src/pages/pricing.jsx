import React, { useState, useEffect } from 'react';
import { Lock, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';

const Pricing = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 120);
    return () => clearTimeout(timer);
  }, []);

  // UPDATED: always start users at step 1 of the wizard
  // by adding ?reset=1 and a state flag your wizard checks.
  const handleGetStackScore = () => {
    navigate('/wizard?reset=1', { state: { from: 'pricing', reset: true } });
  };

  // small mark used next to the CTA
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
      {/* Global header */}
      <SiteHeader />

      {/* Main Pricing Section */}
      <main
        className={`flex-grow flex flex-col items-center text-center space-y-6 max-w-xl mx-auto px-4 sm:px-6 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-3xl md:text-4xl font-semibold text-lime-400 tracking-tight mt-8">
          Simple Pricing
        </h1>

        <p className="text-xl md:text-2xl text-white font-medium">
          One-Time Access — Just $29
        </p>

        <p className="text-center text-sm text-neutral-400 mt-2">
          Your StackScore plan is tailored to you — and always just{' '}
          <span className="text-lime-400 font-semibold">$29</span>.
        </p>

        <div className="mt-2 flex flex-col items-center gap-1 text-sm text-white">
          <span className="text-neutral-400">
            You'll be able to select from one of these four personalized plans.<br />
            Your goals, Your choice.
          </span>

          <ul className="flex flex-wrap justify-center gap-4 text-lime-400 font-medium mt-1">
            <li className="flex items-center gap-1">📦 Foundation</li>
            <li className="flex items-center gap-1">🔗 Builder</li>
            <li className="flex items-center gap-1">⚡ Power Boost</li>
            <li className="flex items-center gap-1">👑 Elite</li>
          </ul>
        </div>

        {/* Button with stacked logos */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <StackScoreLogo className="w-5 h-5 sm:w-6 sm:h-6" />

          <button
            type="button"
            onClick={handleGetStackScore}
            className="bg-lime-400 text-black px-6 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition"
            aria-label="Get your StackScore"
          >
            Get Your StackScore
          </button>

          <StackScoreLogo className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </main>

      {/* Post-Purchase Refresh Offer */}
      <section
        className={`mt-16 border-t border-neutral-800 pt-8 text-center space-y-4 max-w-xl mx-auto px-4 sm:px-6 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: '240ms' }}
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-white flex items-center justify-center gap-2 tracking-tight">
          <RotateCcw className="w-6 h-6 stroke-lime-400" strokeWidth="1.5" />
          Need a Refresh?
        </h2>

        <p className="text-neutral-400">
          Life changes — and your plan should evolve with it. Refresh your StackScore for just{' '}
          <span className="text-lime-400 font-semibold">$14.50</span> starting 120 days after your original purchase.
        </p>

        <div className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg text-sm text-neutral-300 italic max-w-xl mx-auto">
          "Seasons shift. So do your goals. Refresh your StackScore after 4 months to reflect what's next — whether it's a new move, new job, or a bigger goal."
        </div>

        <div className="pt-2">
          <button
            disabled
            className="flex items-center justify-center gap-2 bg-neutral-800 text-neutral-500 px-6 py-2 rounded-full cursor-not-allowed"
          >
            <Lock className="w-4 h-4 stroke-neutral-500" />
            Available in 120 Days
          </button>
        </div>
      </section>

      {/* Brighter, consistent site footer */}
      <SiteFooter />
    </div>
  );
};

export default Pricing;
