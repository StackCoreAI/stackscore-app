import React from "react";

const HeaderNav = () => {
  return (
    <header className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <a href="#" className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" className="text-lime-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 4h16v5H4z" />
          <path d="M4 15h16v5H4z" />
        </svg>
        <span className="text-lg font-semibold tracking-tight">StackScore</span>
      </a>

      <nav className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
        <a href="#main" className="text-neutral-300 hover:text-white transition-colors">Home</a>
        <a href="#features" className="text-neutral-300 hover:text-white transition-colors">Features</a>
        <a href="#results" className="text-neutral-300 hover:text-white transition-colors">Results</a>
        <a href="#faq" className="text-neutral-300 hover:text-white transition-colors">FAQ</a>
        <a href="#wizard" className="flex items-center gap-1 text-lime-300 hover:text-lime-200 transition-colors">
          <i data-lucide="zap" className="w-4 h-4" />
          <span>Build</span>
        </a>
      </nav>
    </header>
  );
};

export default HeaderNav;
