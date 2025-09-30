// scripts/generate-safelist.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

// 1) Which files to scan (add more patterns if needed)
const ROOTS = [
  "server/templates",      // your mustache views
  "public/templates",      // (if any)
  "public/assets/guide.js" // JS with dynamic class toggles
];

// 2) Always-keep list (put truly dynamic classes here)
const ALWAYS = [
  // gradients (hex)
  "from-[#a3e635]","via-[#34d399]","to-[#22d3ee]",
  // hero bg
  "from-[#101012]","via-[#0c0d0e]","to-[#08090a]",
  // ring/focus/misc you know you use dynamically
  "focus:outline-none","focus:ring-2","focus:ring-lime-500"
];

// 3) Simple recursive file gather
function walk(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
function collectFiles() {
  const files = [];
  for (const root of ROOTS) {
    try {
      const s = statSync(root);
      if (s.isDirectory()) files.push(...walk(root));
      else files.push(root);
    } catch { /* ignore missing roots */ }
  }
  // only scan text-y files
  return files.filter(p => /\.(mustache|html|js|jsx|ts|tsx|mjs|cjs)$/.test(p));
}

// 4) Extract class names
const CLASS_RE = /class\s*=\s*"([^"]+)"/g;           // HTML/Mustache
const TW_MERGE_RE = /cn\(\s*"([^"]+)"/g;            // simple cn("...") cases
const JS_CLASS_RE = /["'`]([a-z0-9!:\-\[\]\/\.#%]+)["'`]/ig; // fallthrough tokens

const tokens = new Set(ALWAYS);
for (const file of collectFiles()) {
  const src = readFileSync(file, "utf8");

  // a) class="..."
  for (const m of src.matchAll(CLASS_RE)) m[1].split(/\s+/).forEach(c => c && tokens.add(c));

  // b) simple cn("...") or similar helper
  for (const m of src.matchAll(TW_MERGE_RE)) m[1].split(/\s+/).forEach(c => c && tokens.add(c));

  // c) very loose catch-all for standalone tokens (keeps arbitrary values like from-[#hex])
  //    We only keep ones that look like tailwind-ish utilities.
  for (const m of src.matchAll(JS_CLASS_RE)) {
    const c = m[1];
    if (/[a-z]/i.test(c) && (c.includes('-') || c.includes(':') || c.includes('['))) {
      tokens.add(c);
    }
  }
}

// 5) Trim obviously bad captures (commas, templates, etc.)
const CLEAN = [...tokens]
  .map(t => t.trim())
  .filter(Boolean)
  .filter(t => !t.startsWith("${"))       // template leftovers
  .filter(t => !t.endsWith(","))          // accidental commas
  .filter(t => !t.includes("\n"));

// 6) Write safelist (sorted, unique)
const out = CLEAN.sort((a,b) => a.localeCompare(b)).join("\n") + "\n";
const outPath = "public/assets/safelist.txt";
writeFileSync(outPath, out);
console.log(`Safelist: wrote ${CLEAN.length} classes → ${outPath}`);
