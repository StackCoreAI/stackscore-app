import React from "react";

const CTABlock = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-2">
      <a href="#wizard" aria-label="Start building my credit stack" className="inline-block">
        <button className="bg-gradient-to-r from-lime-400 to-emerald-500 text-black rounded-full font-semibold px-6 py-3 transition hover:scale-105 hover:shadow-md hover:brightness-110">
          🚀 Build My Stack
        </button>
      </a>
      <a href="#how" aria-label="Learn how StackScore works" className="inline-block">
        <button className="border border-slate-600 text-white rounded-full px-6 py-3 transition hover:border-lime-400/60 hover:bg-lime-400/10">
          📘 Learn How It Works
        </button>
      </a>
    </div>
  );
};

export default CTABlock;
