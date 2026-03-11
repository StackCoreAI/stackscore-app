// tailwind.config.js
const fs = require('fs');

function readSafelist(file) {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    return txt
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => !s.startsWith('#')); // allow comments in safelist.txt
  } catch {
    return [];
  }
}

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}',
    './public/guides/**/*.html',            // <-- include 82.html (and future guides)
  ],
  safelist: [
    // keep your current “style DNA” used in the guide
    'bg-gradient-to-br',
    'from-[#101012]', 'via-[#0c0d0e]', 'to-[#08090a]',
    'bg-white/5', 'bg-white/10', 'bg-black/70',
    'border-white/10', 'border-amber-200/30',
    'text-zinc-100', 'text-zinc-200', 'text-zinc-300', 'text-zinc-400',
    'text-lime-300', 'text-emerald-400', 'text-cyan-400', 'text-yellow-300',
    'rounded-md', 'rounded-xl', 'rounded-2xl',
    'max-w-7xl', 'mx-auto', 'px-6',
    'grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-12',
    'pt-20', 'pb-20', 'space-y-6',
    // any short extras you tend to use in the guide
  ].concat(readSafelist('./src/safelist.txt')), // <-- you already have /src/safelist.txt
  theme: { extend: {} },
  plugins: [],
};
