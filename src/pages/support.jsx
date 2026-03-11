import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Support = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-neutral-950 text-white font-sans leading-relaxed tracking-tight selection:bg-lime-400/20 min-h-screen">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between mb-6 pl-4 pt-4 sm:pl-6 sm:pt-6">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-lime-400">
            <path d="M4 4h16v3H4z" /><path d="M4 10.5h16v3H4z" /><path d="M4 17h16v3H4z" />
          </svg>
          <span className="text-lg font-semibold tracking-tight text-white">StackScore</span>
        </Link>
        <button onClick={() => navigate("/")} className="text-sm text-neutral-400 hover:text-white transition duration-150 pr-4 sm:pr-6">← Back</button>
      </nav>

      <hr className="border-neutral-800 my-6" />

      {/* Main */}
      <section className={`max-w-md mx-auto text-center px-4 mt-10 space-y-6 transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <h1 className="text-2xl font-semibold text-lime-400">Need Help?</h1>
        <p className="text-neutral-300">We’re here to support your goals. For questions about your plan, refunds, or anything else—get in touch below.</p>

        <div className="text-sm">
          <p className="mb-1 text-neutral-400">📧 Email us:</p>
          <a href="mailto:resolve@stackscore.ai" className="text-lime-400 font-medium hover:underline hover:text-white transition duration-150" aria-label="Email StackScore support">
            resolve@stackscore.ai
          </a>
        </div>

        <div className="space-y-2 text-sm text-neutral-400 mt-6">
          <p><Link to="/faq" className="text-lime-400 hover:underline hover:text-white transition duration-150">📋 Visit our FAQ</Link></p>
          <p><Link to="/refund-policy" className="text-lime-400 hover:underline hover:text-white transition duration-150">💸 View our Refund Policy</Link></p>
        </div>
      </section>

      {/* Social */}
      <div className={`flex justify-center gap-4 text-neutral-500 mt-10 transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "200ms" }}>
        <a href="https://x.com/stackscoreai" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition" aria-label="Follow StackScore on X">X</a>
        <a href="https://instagram.com/stackscore" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition" aria-label="Follow StackScore on Instagram">IG</a>
      </div>

      {/* Footer */}
      <footer className={`text-xs text-neutral-500 text-center px-4 mt-12 pb-6 transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "400ms" }}>
        <div className="space-x-4">
          <Link to="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
          <Link to="/terms-of-use" className="hover:text-white transition">Terms of Use</Link>
          <Link to="/cookies" className="hover:text-white transition">Cookie Disclaimer</Link>
        </div>
        <p className="mt-2">This site uses cookies to enhance your experience. By continuing, you agree to our use of cookies.</p>
      </footer>
    </div>
  );
};

export default Support;
