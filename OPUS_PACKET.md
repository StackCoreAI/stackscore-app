# OPUS_PACKET
Generated: 2026-02-20T22:25:27.663Z
Branch: feat/frontend-architecture-reset
Commit: 75caa6d

**Notes:**
- Netlify dev/prod is authoritative for redirects + functions.
- Vite preview is NOT authoritative for redirects/functions.

---
## netlify.toml

```toml
# netlify.toml (at repo root)
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["openai"]

[[redirects]]
  from = "/guide/:id"
  to   = "/guides/:id.html"
  status = 200


[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200

```

---
## package.json (scripts only)

```json
{
  "sanity": "node server/scripts/sanity.js",
  "seed": "node server/scripts/seed_xata.js",
  "seed:pg": "node server/scripts/seed_pg.js",
  "build:js": "esbuild scripts/plan.runtime.src.js --bundle --minify --sourcemap --outfile=public/assets/plan.runtime.js",
  "watch:js": "esbuild scripts/plan.runtime.src.js --bundle --minify --sourcemap --outfile=public/assets/plan.runtime.js --watch",
  "smoke:api": "curl -s http://localhost:3001/api/health && echo && curl -s 'http://localhost:3001/api/gpt-plan?stackKey=foundation'",
  "patch:foundation": "node server/scripts/patch_foundation_plan.js",
  "dev:api": "nodemon --watch server --ext js,json --signal SIGTERM server/index.js",
  "dev:web": "vite",
  "dev": "concurrently -n API,WEB -c green,cyan \"npm:dev:api\" \"npm:dev:web\"",
  "start:api": "NODE_ENV=production node server/index.js",
  "build:opus": "node scripts/build-opus-packet.mjs",
  "lint:case": "git grep -nE 'from \"\\.\\./pages/.*[A-Z]' src && echo '❌ Uppercase import path found' && exit 1 || echo '✅ imports case clean'",
  "lint:imports-case": "git grep -nE 'from \"\\.\\/pages/.*[A-Z]' src && echo '❌ Uppercase import path found' && exit 1 || echo '✅ imports case clean'",
  "prebuild": "npm run lint:case && npm run lint:imports-case",
  "generate-safelist": "node scripts/generate-safelist.mjs",
  "prebuild:css": "node scripts/generate-safelist.mjs",
  "css:dev": "tailwindcss -i ./src/app.src.css -o ./public/assets/app.css --watch --minify --content './public/**/*.html' --content './public/templates/**/*.mustache' --content './server/templates/**/*.mustache' --content './src/**/*.{html,js,jsx,ts,tsx}' --content './**/*.{html,js,jsx,ts,tsx,mustache}' --content '!./node_modules/**/*' --content '!./dist/**/*'",
  "css:build": "tailwindcss -i ./src/app.src.css -o ./public/assets/app.css --minify --content './public/**/*.html' --content './public/templates/**/*.mustache' --content './server/templates/**/*.mustache' --content './src/**/*.{html,js,jsx,ts,tsx}' --content './**/*.{html,js,jsx,ts,tsx,mustache}' --content '!./node_modules/**/*' --content '!./dist/**/*'",
  "build": "npm run prebuild:css && npm run css:build && npm run build:guide && npm run build:js && vite build",
  "build:prod": "npm run build",
  "build:guide": "scripts/bin/tailwindcss -i public/assets/guide.src.css -o public/assets/guide.css --minify",
  "watch:guide": "scripts/bin/tailwindcss -i public/assets/guide.src.css -o public/assets/guide.css --watch",
  "preview": "vite preview",
  "plan:json:elite": "curl -sS -X POST http://localhost:3001/api/gpt-plan -H \"Content-Type: application/json\" -d '{\"stackKey\":\"elite\"}' | tee plan.json",
  "plan:json:accelerator": "curl -sS -X POST http://localhost:3001/api/gpt-plan -H \"Content-Type: application/json\" -d '{\"stackKey\":\"accelerator\"}' | tee plan.json",
  "plan:json:growth": "curl -sS -X POST http://localhost:3001/api/gpt-plan -H \"Content-Type: application/json\" -d '{\"stackKey\":\"growth\"}' | tee plan.json",
  "plan:json:foundation": "curl -sS -X POST http://localhost:3001/api/gpt-plan -H \"Content-Type: application/json\" -d '{\"stackKey\":\"foundation\"}' | tee plan.json",
  "plan:pdf": "curl -sS -X POST http://localhost:3001/api/plan/pdf -H \"Content-Type: application/json\" --data-binary @plan.json -o StackScore-plan.pdf && (open StackScore-plan.pdf || true)",
  "plan:pdf:elite": "curl -sS -X POST http://localhost:3001/api/plan/pdf -H \"Content-Type: application/json\" --data-binary @plan.json -o StackScore-elite.pdf && (open StackScore-elite.pdf || true)",
  "plan:pdf:accelerator": "curl -sS -X POST http://localhost:3001/api/plan/pdf -H \"Content-Type: application/json\" --data-binary @plan.json -o StackScore-accelerator.pdf && (open StackScore-accelerator.pdf || true)",
  "plan:pdf:growth": "curl -sS -X POST http://localhost:3001/api/plan/pdf -H \"Content-Type: application/json\" --data-binary @plan.json -o StackScore-growth.pdf && (open StackScore-growth.pdf || true)",
  "plan:pdf:foundation": "curl -sS -X POST http://localhost:3001/api/plan/pdf -H \"Content-Type: application/json\" --data-binary @plan.json -o StackScore-foundation.pdf && (open StackScore-foundation.pdf || true)",
  "test:pdf:elite": "npm run plan:json:elite && npm run plan:pdf:elite",
  "test:pdf:accelerator": "npm run plan:json:accelerator && npm run plan:pdf:accelerator",
  "test:pdf:growth": "npm run plan:json:growth && npm run plan:pdf:growth",
  "test:pdf:foundation": "npm run plan:json:foundation && npm run plan:pdf:foundation",
  "dev:api:chrome": "PUPPETEER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' nodemon --watch server --ext js,json --signal SIGTERM server/index.js",
  "tw:bin": "mkdir -p scripts/bin && ARCH=$(uname -m) && OS=$(uname -s) && if [ \"$OS\" = \"Darwin\" ]; then if [ \"$ARCH\" = \"arm64\" ]; then URL=https://github.com/tailwindlabs/tailwindcss/releases/download/v4.1.12/tailwindcss-macos-arm64; else URL=https://github.com/tailwindlabs/tailwindcss/releases/download/v4.1.12/tailwindcss-macos-x64; fi; else URL=https://github.com/tailwindlabs/tailwindcss/releases/download/v4.1.12/tailwindcss-linux-x64; fi; curl -L -o scripts/bin/tailwindcss \"$URL\" && chmod +x scripts/bin/tailwindcss && (xattr -d com.apple.quarantine scripts/bin/tailwindcss 2>/dev/null || true)",
  "tw:verify": "scripts/bin/tailwindcss -v",
  "build:pdfcss": "scripts/bin/tailwindcss -i ./public/templates/input.css -o ./public/templates/stack.css --minify --content ./public/templates/stacktemplate.html",
  "postinstall": "npm run tw:bin && npm run tw:verify",
  "dev:nlx": "netlify dev"
}
```

---
## vite.config.ts

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' },
  },
})

```

---
## index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <title>StackScore</title>
    <meta name="description" content="Build a smarter credit-improvement stack in minutes. StackScore recommends proven apps and step-by-step actions tailored to your budget and goals." />
    <meta name="theme-color" content="#A6FF66" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="/" />

    <!-- Favicons -->
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.png" sizes="any" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

    <!-- Social -->
    <meta property="og:title" content="StackScore" />
    <meta property="og:description" content="Build a smarter credit-improvement stack in minutes." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="/" />
    <meta property="og:image" content="/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="StackScore" />
    <meta name="twitter:description" content="Build a smarter credit-improvement stack in minutes." />
    <meta name="twitter:image" content="/og-image.png" />

    <!-- SPA base -->
    <base href="/" />

    <!-- Tiny pre-CSS hardening -->
    <style>
      html, body, #root { min-height: 100%; }
      html { scroll-behavior: smooth; }
    </style>
  </head>

  <body class="bg-neutral-950 text-white antialiased font-sans">
    <!-- React mount point -->
    <div id="root"></div>

    <noscript>
      <div style="padding:1rem;max-width:720px;margin:2rem auto;background:#111;border:1px solid #222;border-radius:12px;color:#ddd;font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif;">
        <strong>JavaScript is required.</strong> Please enable JavaScript to use StackScore.
      </div>
    </noscript>

    <!-- Vite entry (direct, with cache-bust) -->
    <script type="module" src="/src/main.jsx?v=boot1"></script>

    <!-- Defensive bootstrap: runs even if something strips the tag above -->
    <script type="module">
      console.debug("[Vite] inline bootstrap start");
      try {
        let mount = document.getElementById("root");
        if (!mount) {
          mount = document.createElement("div");
          mount.id = "root";
          document.body.appendChild(mount);
        }
        await import("/src/main.jsx?v=boot1");
        console.debug("[Vite] inline bootstrap imported /src/main.jsx");
      } catch (e) {
        console.error("[Vite] bootstrap import failed", e);
      }
    </script>
  </body>
</html>

```

---
## Guide: public/guides/82.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>StackScore – Build & Compose</title>

  <!-- PROD: built Tailwind bundle -->
  <link rel="stylesheet" href="/assets/app.css?v=boot1" />

  <!-- small guide overrides (must load AFTER global) -->
  <link rel="stylesheet" href="/assets/guide.css?v=2" />

  <!-- scripts -->
  <script defer src="/assets/lucide.min.js"></script>
  <script defer src="/assets/guide.js"></script>
  <script defer src="/assets/plan.runtime.js?v=5"></script>

  <style>
    html { scroll-behavior:smooth }
    body { font-family: Inter, ui-sans-serif, system-ui, sans-serif }
    @keyframes fadeInUp { 0% { opacity:0; transform: translateY(28px) } 100% { opacity:1; transform: translate Y(0) } }
    .init-opacity { opacity:0 }
    .show { animation: fadeInUp .9s cubic-bezier(.22,1,.36,1) forwards }
    svg.lucide { stroke: currentColor; stroke-width: 1.5 }
    details summary::-webkit-details-marker { display:none }
    details[open] summary .chev { transform: rotate(180deg) }
    details summary .chev { transition: transform .2s ease }

    /* --- Print styles --- */
    @media print {
      .no-print, nav, header, .site-nav, .builder, .sticky-cta, .footer-cta { display:none !important; }
      html, body { background:#fff !important; color:#000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .deck-safe, .container, .content, .guide-inner { max-width:100% !important; width:100% !important; padding:0 !important; margin:0 !important; box-shadow:none !important; background:transparent !important; }
      .card, .app, .section, .panel, .grid > * { break-inside: avoid; page-break-inside: avoid; }
      .page-break { break-before: page; page-break-before: always; }
    }
    @page { size: Letter; margin: 12mm; }

    .no-print {}
    @media print { .no-print { display:none !important; } }
    .print-only { display:none !important; }
    @media print { .print-only { display:block !important; } }
  </style>
</head>

<body class="bg-gradient-to-br from-[#101012] via-[#0c0d0e] to-[#08090a] text-white antialiased">
  <!-- Floating print button -->
  <button id="print-plan" class="no-print"
    aria-label="Print this plan"
    style="position:fixed; right:16px; top:16px; z-index:9999; padding:10px 14px; border-radius:9999px;
           background:#16e263; color:#0a0a0a; border:0; font-weight:600; box-shadow:0 8px 20px rgba(0,0,0,.25); cursor:pointer;">
    Print Plan
  </button>

  <!-- ================= NAV ================= -->
  <header class="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 init-opacity" data-anim>
    <a href="/" class="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="text-lime-400" aria-hidden="true">
        <path d="M4 4h16v3H4z"></path><path d="M4 10.5h16v3H4z"></path><path d="M4 17h16v3H4z"></path>
      </svg>
      <span class="text-lg font-semibold tracking-tight text-white">StackScore</span>
    </a>

    <nav class="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
      <a href="#main" class="text-neutral-300 hover:text-white transition-colors">Home</a>
      <a href="#features" class="text-neutral-300 hover:text-white transition-colors">Features</a>
      <a href="#results" class="text-neutral-300 hover:text-white transition-colors">Results</a>
      <a href="#faq" class="text-neutral-300 hover:text-white transition-colors">FAQ</a>
      <a href="#wizard" class="flex items-center gap-1 text-lime-300 hover:text-lime-200 transition-colors">
        <i data-lucide="zap" class="w-4 h-4"></i><span>Build</span>
      </a>
    </nav>
  </header>

  <!-- ================= HERO ================= -->
  <section id="main" class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-20 pb-20 init-opacity" data-anim>
    <div class="lg:col-span-6 space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime-400/30 bg-gradient-to-r from-lime-400/10 to-emerald-500/10 text-xs text-lime-300">
        <i data-lucide="sparkles" class="w-4 h-4"></i> AI-Powered Financial Stack
      </div>

      <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
        Your Elite <span class="bg-clip-text text-transparent bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 font-semibold">Stack.</span>
      </h1>

      <p class="mt-2 text-xl md:text-2xl italic text-white tracking-tight">
        Shhh… Stacking is the new <span class="not-italic font-semibold">take charge of your credit score</span>
      </p>
    </div>

    <div class="lg:col-span-6">
      <div class="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-md space-y-6">
        <h3 class="text-white font-semibold text-lg text-center tracking-tight">Your Potential Gains</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-4 text-center rounded-lg border border-lime-400/30 hover:bg-white/10 transition">
            <p class="text-lime-400 font-semibold">Utilities</p><p class="text-slate-300 text-xs">+10–20 pts</p>
          </div>
          <div class="p-4 text-center rounded-lg border border-emerald-400/30 hover:bg-white/10 transition">
            <p class="text-emerald-400 font-semibold">Installments</p><p class="text-slate-300 text-xs">+20–40 pts</p>
          </div>
          <div class="p-4 text-center rounded-lg border border-cyan-400/30 hover:bg-white/10 transition">
            <p class="text-cyan-400 font-semibold">Disputes</p><p class="text-slate-300 text-xs">+15–30 pts</p>
          </div>
          <div class="p-4 text-center rounded-lg border border-yellow-300/30 hover:bg-white/10 transition">
            <p class="text-yellow-300 font-semibold">Tradelines</p><p class="text-slate-300 text-xs">+25–50 pts</p>
          </div>
        </div>
        <div class="text-center space-y-1">
          <p class="text-lime-300">Stack Impact: ★★★★★</p>
          <p class="text-emerald-400">Synergy Score: High</p>
          <p class="text-xs text-slate-500">Based on verified user reports. Results may vary.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ======= FULL-WIDTH NAV HIGHLIGHT ======= -->
  <div class="max-w-7xl mx-auto px-6 relative mb-12">
    <div class="h-1 w-full bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 rounded-full"></div>
    <nav class="flex justify-center space-x-8 -mt-3">
      <a href="#main" class="flex items-center space-x-2 px-4 py-1.5 bg-black/70 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition">
        <i data-lucide="zap" class="w-4 h-4 text-lime-400"></i><span>Quick Start</span>
      </a>
      <a href="#compose" class="flex items-center space-x-2 px-4 py-1.5 bg-black/70 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition">
        <i data-lucide="layers" class="w-4 h-4 text-emerald-400"></i><span>Your Stack</span>
      </a>
      <a href="#instructions" class="flex items-center space-x-2 px-4 py-1.5 bg-black/70 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition">
        <i data-lucide="clipboard-list" class="w-4 h-4 text-cyan-400"></i><span>Instructions</span>
      </a>
    </nav>
  </div>

  <!-- =============== YOUR STACK (COMPOSE) =============== -->
  <section id="compose" class="max-w-7xl mx-auto px-6 pb-24 init-opacity" data-anim>
    <div class="bg-white/5 border border-white/10 shadow-xl rounded-xl overflow-hidden">
      <!-- header -->
      <header class="flex flex-col md:flex-row items-start md:items-center justify-between md:px-6 bg-gradient-to-b from-white/5 via-white/0 to-white/5 border-b border-white/10 pt-4 pr-4 pb-4 pl-4">
        <a href="#compose" class="inline-block">
          <button class="bg-gradient-to-r from-lime-400 to-emerald-500 text-black rounded-full font-semibold px-6 py-3 transition hover:scale-105 hover:shadow-md hover:brightness-110">
            Your Stack — Start Here
          </button>
        </a>
      </header>

      <!-- AI-powered Feature Specific Instructions -->
      <div class="mt-4 bg-amber-50/5 border border-amber-200/30 rounded-xl shadow p-5">
        <div class="flex items-center gap-2 mb-2">
          <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-300"></i>
          <h4 class="text-amber-200 font-semibold">Important: Feature-specific Instructions</h4>
        </div>
        <p class="text-zinc-200/90">
          Behind your guide is AI intelligence that searched through
          <span class="font-semibold text-white">hundreds of features across dozens of apps</span>
          to find what works best for you. We don’t give everyone the same setup — even with the same app, different people get different features.
          Based on your answers to our six questions, the AI curated this <span class="font-semibold text-white">specific combination of apps and features</span>
          to create the most impact for your credit journey.
        </p>
        <details class="mt-3">
          <summary class="cursor-pointer underline text-amber-200 hover:text-amber-100 text-sm">
            Learn more ▾
          </summary>
          <div class="mt-2 text-zinc-300">
            Apps include many capabilities, but only certain features move the needle for your profile. Follow the features we highlighted to unlock the full benefit of your plan.
          </div>
        </details>
      </div>

      <!-- content grid -->
      <section class="grid grid-cols-1 lg:grid-cols-12 min-h-[60vh]">
        <!-- Sidebar -->
        <aside class="page-break col-span-1 lg:col-span-3 lg:p-6 bg-gradient-to-b from-white/5 to-white/10 border-r border-white/10 pt-4 pr-4 pb-4 pl-4">
          <div class="space-y-3 mb-6">
            <h3 class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Apps in Your Stack.</h3>
            <!-- container the runtime will populate -->
            <div class="space-y-2" id="sidebar-slot" data-hook="app-list"></div>
          </div>

          <!-- Resources -->
          <div class="space-y-3">
            <h3 class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Resources &amp; Support.</h3>
            <div class="space-y-1">
              <button class="w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors group">
                <div class="flex items-center space-x-2">
                  <div class="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">S</div>
                  <div class="flex-1 min-w-0"><p class="text-xs font-medium text-zinc-100 truncate">StackScore Support</p></div>
                  <i data-lucide="plus" class="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
              </button>
              <button class="w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors group">
                <div class="flex items-center space-x-2">
                  <div class="w-5 h-5 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-medium">C</div>
                  <div class="flex-1 min-w-0"><p class="text-xs font-medium text-zinc-100 truncate">Credit Resources</p></div>
                  <i data-lucide="plus" class="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
              </button>
              <button class="w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors group">
                <div class="flex items-center space-x-2">
                  <div class="w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-medium">F</div>
                  <div class="flex-1 min-w-0"><p class="text-xs font-medium text-zinc-100 truncate">Community Forum</p></div>
                  <i data-lucide="plus" class="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <!-- Right panel -->
        <main id="instructions" class="page-break col-span-1 lg:col-span-9 lg:p-8 space-y-5">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-lg font-semibold text-white">App Instructions</h1>
          </div>

          <!-- Form the runtime hydrates -->
          <form class="space-y-4">
            <!-- Website -->
            <label class="block">
              <span class="text-xs text-zinc-400">Website:</span>
              <input
                type="url"
                placeholder="https://"
                data-hook="field-website"
                class="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40"
              />
            </label>

            <!-- Steps: vertical & multiline -->
            <label class="block">
              <span class="text-xs text-zinc-400">1st:</span>
              <textarea
                rows="3"
                placeholder="First step"
                data-hook="field-step1"
                class="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40"
              ></textarea>
            </label>

            <label class="block">
              <span class="text-xs text-zinc-400">2nd:</span>
              <textarea
                rows="3"
                placeholder="Second step"
                data-hook="field-step2"
                class="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40"
              ></textarea>
            </label>

            <label class="block">
              <span class="text-xs text-zinc-400">3rd:</span>
              <textarea
                rows="3"
                placeholder="Third step"
                data-hook="field-step3"
                class="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40"
              ></textarea>
            </label>

            <!-- Pro tip -->
            <label class="block">
              <span class="text-xs text-zinc-400">Pro tip / Notes:</span>
              <textarea
                rows="4"
                placeholder="Any specific feature, toggle, or caveat to watch for…"
                data-hook="field-protip"
                class="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40"
              ></textarea>
            </label>

            <div class="flex gap-3">
              <button type="button" class="px-3 py-2 rounded-md bg-white/10 border border-white/10 hover:bg-white/15 text-sm">Save Progress</button>
              <button type="button" class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-black text-sm">Mark Complete</button>
            </div>
          </form>
        </main>
      </section>
    </div>
  </section>

  <!-- Legal Disclaimer -->
  <footer class="max-w-7xl mx-auto px-6 pb-12 text-xs text-zinc-400">
    <div class="bg-white/5 border border-white/10 rounded-lg p-4 leading-relaxed">
      <strong class="text-zinc-300">Disclaimer:</strong>
      We are not financial advisors, credit advisors, or credit counseling providers. The information in this guide is
      <span class="font-semibold text-zinc-200">educational only</span> and should not be taken as financial advice,
      credit advice, or credit counseling advice. Results from using apps and features will vary, and there is no guarantee
      that your credit score will increase.
    </div>
  </footer>

  <!-- Compose the page using the Netlify Function, if present -->
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      const u = new URL(location.href);
      const stackKey = u.searchParams.get('stackKey') || 'foundation';
      if (window.composeGuide) {
        // Optional legacy bootstrap (guide.js). Safe no-op if not defined.
        window.composeGuide(stackKey);
      }
    });
  </script>
</body>
</html>

```

---
## Guide runtime: public/assets/guide.js

```js
// public/assets/guide.js

// Mark <html> as JS-enabled (so .js .init-opacity rules can apply safely)
document.documentElement.classList.add('js');

/** ────────────────────────────────────────────────────────────────────────────
 * Icons + Reveal
 * ─────────────────────────────────────────────────────────────────────────── */
function initIconsAndAnim() {
  try {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  } catch {}

  const anim = document.querySelectorAll('[data-anim]');
  anim.forEach((el, i) => {
    if (!el.classList.contains('show')) {
      setTimeout(() => el.classList.add('show'), i * 120);
    }
  });

  document.querySelectorAll('.init-opacity').forEach(el => el.classList.add('show'));
}

/** ────────────────────────────────────────────────────────────────────────────
 * Local Progress (checkbox persistence)
 * ─────────────────────────────────────────────────────────────────────────── */
function initLocalProgress() {
  const params = new URLSearchParams(location.search);
  const token = params.get("t") || "anon";
  const prefix = `ss:${token}:`;

  document.querySelectorAll('input[type="checkbox"]').forEach((cb, idx) => {
    const key = prefix + "cb:" + idx;
    cb.checked = localStorage.getItem(key) === "1";
    cb.addEventListener("change", () => {
      localStorage.setItem(key, cb.checked ? "1" : "0");
    });
  });

  const saveBtn = [...document.querySelectorAll("button")]
    .find(b => /save progress/i.test(b.textContent || ""));
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      localStorage.setItem(prefix + "progress-saved", Date.now().toString());
      alert("Progress saved locally!");
    });
  }

  const completeBtn = [...document.querySelectorAll("button")]
    .find(b => /mark complete/i.test(b.textContent || ""));
  if (completeBtn) {
    const completeKey = prefix + "completed";
    if (localStorage.getItem(completeKey) === "1") {
      completeBtn.textContent = "Completed ✔";
      completeBtn.classList.add("bg-emerald-600");
    }
    completeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.setItem(completeKey, "1");
      completeBtn.textContent = "Completed ✔";
      completeBtn.classList.add("bg-emerald-600");
    });
  }
}

/** ────────────────────────────────────────────────────────────────────────────
 * Instructions Binder (keeps the “App Instructions” form in sync)
 * ─────────────────────────────────────────────────────────────────────────── */
function initInstructionsBinder() {
  const params = new URLSearchParams(location.search);
  const token = params.get("t") || "anon";
  const kOpen = `ss:${token}:lastApp`;

  const form = document.querySelector('#instructions form')
           || document.querySelector('main#instructions form');
  if (!form) return;

  const urlInput   = form.querySelector('input[type="url"]');
  const step1Input = form.querySelector('input[placeholder*="First"]');
  const step2Input = form.querySelector('input[placeholder*="Second"]');
  const step3Input = form.querySelector('input[placeholder*="Third"]');
  const tipArea    = form.querySelector('textarea');

  function applyData(sum) {
    if (!sum) return;
    const ds = sum.dataset || {};
    if (urlInput)   urlInput.value   = ds.url   || "";
    if (step1Input) step1Input.value = ds.step1 || "";
    if (step2Input) step2Input.value = ds.step2 || "";
    if (step3Input) step3Input.value = ds.step3 || "";
    if (tipArea)    tipArea.value    = ds.tip   || "";
    if (ds.app)     localStorage.setItem(kOpen, ds.app);
  }

  // Reset listeners to avoid duplicates on hot reload
  document.querySelectorAll('#compose details.group').forEach(d => {
    const clone = d.cloneNode(true);
    d.parentNode.replaceChild(clone, d);
  });

  document.querySelectorAll('#compose details.group').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) {
        document.querySelectorAll('#compose details.group').forEach(dd => { if (dd !== d) dd.open = false; });
        applyData(d.querySelector('summary'));
      }
    });
  });

  // Restore last app or open the first one
  const lastApp = localStorage.getItem(kOpen);
  let applied = false;
  if (lastApp) {
    const targetSummary = [...document.querySelectorAll('#compose details.group summary')]
      .find(s => (s.dataset.app || "").toLowerCase() === lastApp.toLowerCase());
    if (targetSummary) {
      const parent = targetSummary.closest('details.group');
      if (parent) parent.open = true;
      applyData(targetSummary);
      applied = true;
    }
  }
  if (!applied) {
    const firstOpen = document.querySelector('#compose details.group[open] summary')
                   || document.querySelector('#compose details.group summary');
    if (firstOpen) applyData(firstOpen);
  }
}

/** ────────────────────────────────────────────────────────────────────────────
 * Learn more toggles
 * ─────────────────────────────────────────────────────────────────────────── */
function initLearnMore() {
  document.querySelectorAll('[data-learn-more]').forEach(btn => {
    btn.addEventListener('click', () => {
      const more = btn.parentElement?.nextElementSibling;
      if (more) more.classList.toggle('hidden');
    });
  });
}

/** ────────────────────────────────────────────────────────────────────────────
 * Boot (DOMContentLoaded)
 * ─────────────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initIconsAndAnim();
  initLocalProgress();
  initInstructionsBinder();
  initLearnMore();
});

// ──────────────────────────────────────────────────────────────────────────────
// Buy button → prompt for email → redirect to Stripe Checkout via /api/checkout/buy
// ──────────────────────────────────────────────────────────────────────────────
(function () {
  function getParam(name, fallback) {
    const usp = new URLSearchParams(location.search);
    return usp.get(name) || fallback;
  }
  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  }

  // Change this to your API origin in prod if different (e.g., https://api.stackscore.ai)
  const API_BASE = window.location.origin;

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("buy-now");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const stackKey = getParam("stackKey", "foundation");

      // Namespace email cache by stackKey so different stacks can remember different emails
      const cacheKey = `ss_email:${stackKey}`;
      let email = (window.__SS_EMAIL__ || localStorage.getItem(cacheKey) || "").trim();

      if (!isEmail(email)) {
        email = (window.prompt("Email to receive your magic access link:", email) || "").trim();
        if (!isEmail(email)) {
          alert("Please enter a valid email address.");
          return;
        }
      }

      // Cache for next time
      localStorage.setItem(cacheKey, email);

      // Disable to prevent double clicks and signal busy state
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");

      // Redirect to your GET helper (dev uses Vite proxy /api → 3001)
      const url = `${API_BASE}/api/checkout/buy?email=${encodeURIComponent(email)}&stackKey=${encodeURIComponent(stackKey)}`;
      window.location.assign(url);
      // no finally re-enable; we expect a navigation
    });
  });
})();

```

---
## Runtime source: scripts/plan.runtime.src.js

```js
// scripts/plan.runtime.src.js
(() => {
  // ---------- Small utils ----------
  function safe(fn) { try { fn && fn(); } catch (_) {} }
  function getParam(name, fallback) { const u = new URLSearchParams(location.search); return u.get(name) || fallback; }
  function tryParse(v){ if(typeof v!=="string") return null; try{ return JSON.parse(v);}catch{ return null; } }

  // Read onboarding answers (no PII). Adjust keys only if your wizard stores different names.
  function readAnswers() {
    const a = tryParse(localStorage.getItem("stackscore_answers")) || {};
    return {
      living: a.living || a.housing || "",
      budget: a.budget || "",
      timeline: a.timeline || "",
      employment: a.employment || "",
      rent_backdate: a.rent_backdate || "",
    };
  }

  // Always hit the Netlify Function in prod (works locally with `netlify dev` too)
  const PLAN_FN_URL = `${window.location.origin}/.netlify/functions/generate-plan`;

  // ---------- Loading gate (prevents incorrect page flash) ----------
  function ensureLoadingStyles() {
    if (document.getElementById("ss-loading-style")) return;
    const style = document.createElement("style");
    style.id = "ss-loading-style";
    style.textContent = `
/* Hide everything except overlay while loading */
body.ss-loading > *:not(#ss-loading-overlay) { visibility: hidden !important; }

/* Overlay container */
#ss-loading-overlay{
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(ellipse at center, rgba(0,0,0,.75), rgba(0,0,0,.92));
  color: #e5e7eb;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  opacity: 1;
  transition: opacity .18s ease;
}
body.ss-loading #ss-loading-overlay { display: flex !important; }
body:not(.ss-loading) #ss-loading-overlay { opacity: 0; pointer-events:none; }

/* Card */
#ss-loading-overlay .card{
  width: min(680px, calc(100vw - 40px));
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,.15);
  background: linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,.05));
  backdrop-filter: blur(14px);
  padding: 30px 34px;
  box-shadow: 0 20px 70px rgba(0,0,0,.65), 0 0 0 1px rgba(34,197,94,.08) inset;
  transform: translateY(0);
  opacity: 1;
  transition: transform .22s ease, opacity .22s ease;
}
body:not(.ss-loading) #ss-loading-overlay .card { transform: translateY(6px); opacity: 0; }

/* Title + message */
#ss-loading-overlay .title{
  font-weight: 500;
  font-size: 30px;
  letter-spacing: -0.6px;
  line-height: 1.15;
  color: #fff;
  margin-bottom: 12px;
}
#ss-loading-overlay .msg{
  font-size: 18px;
  color: rgba(255,255,255,.75);
  margin-bottom: 22px;
  line-height: 1.5;
}

/* Progress bar */
#ss-loading-overlay .bar{
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255,255,255,.10);
  border: 1px solid rgba(255,255,255,.10);
}
#ss-loading-overlay .bar > div{
  height: 100%;
  width: 38%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(34,197,94,.12), rgba(34,197,94,.95), rgba(34,197,94,.12));
  box-shadow: 0 0 18px rgba(34,197,94,.28);
  animation: ssload 1.6s cubic-bezier(.22,1,.36,1) infinite;
  will-change: transform;
}
@keyframes ssload{
  0%   { transform: translateX(-160%); }
  100% { transform: translateX(260%); }
}
`;
    document.head.appendChild(style);
  }

  function ensureLoadingOverlay() {
    if (document.getElementById("ss-loading-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "ss-loading-overlay";
    overlay.innerHTML = `
      <div class="card">
        <div class="title">Generating your StackScore plan…</div>
        <div class="msg" id="ss-loading-msg">This can take a few seconds. We’re matching apps + features to your inputs.</div>
        <div class="bar"><div></div></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function setLoading(on, msg) {
    ensureLoadingStyles();
    ensureLoadingOverlay();
    if (msg) {
      const el = document.getElementById("ss-loading-msg");
      if (el) el.textContent = msg;
    }
    document.body.classList.toggle("ss-loading", !!on);
  }

  function finishLoadingThenHide() {
    const bar = document.querySelector("#ss-loading-overlay .bar > div");
    if (bar) {
      bar.style.animation = "none";
      bar.style.transform = "translateX(0)";
      bar.style.width = "100%";
      setTimeout(() => setLoading(false), 220);
    } else {
      setLoading(false);
    }
  }

  async function fetchPlan(stackKey){
    const res = await fetch(PLAN_FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ stackKey, answers: readAnswers() })
    });
    const text = await res.text();
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      console.error("Plan API returned non-JSON:", text.slice(0, 200));
      throw new Error("Plan API returned HTML/invalid JSON");
    }
    return JSON.parse(text);
  }

  // ---------- Icon + steps helpers ----------
  function iconFor(n=""){ n=n.toLowerCase();
    if(n.includes("boost")) return "zap";
    if(n.includes("kikoff")) return "credit-card";
    if(n.includes("kovo"))   return "trending-up";
    if(n.includes("rent"))   return "home";
    if(n.includes("dispute")||n.includes("dovly"))return "shield-check";
    return "star";
  }
  function stepsFor(name, a){
    const n=(name||"").toLowerCase();
    if (a?.step1 || a?.step2 || a?.step3) return [a.step1||"", a.step2||"", a.step3||""];
    if (n.includes("experian")&&n.includes("boost")) return ["Instant Credit Score Boost","Connect Bank","Add Utilities"];
    if (n.includes("kikoff"))                         return ["Open Kikoff Credit Account","Enable Autopay","Keep Utilization <10%"];
    if (n.includes("kovo"))                           return ["Create Kovo Account","Choose Monthly Plan","Make On-Time Payments"];
    if (n.includes("self"))                           return ["Open Self Credit Builder","Fund First Deposit","Auto-pay On"];
    if (n.includes("rent")||n.includes("boom")||n.includes("rentreporter"))
                                                      return ["Verify Lease","Connect Payment Source","Backdate (if eligible)"];
    if (n.includes("dispute")||n.includes("dovly"))   return ["Import Report","Auto-scan Issues","Submit Round-1 Disputes"];
    return ["Start · Create account","Connect · Bank/Payment","Activate · Feature"];
  }

  // Show overlay ASAP on guide pages (prevents any flash before DOMContentLoaded)
  const IS_GUIDE = !!document.getElementById("sidebar-slot");
  if (IS_GUIDE) safe(() => setLoading(true));

  // ---------- Normalize plan → 3–5 apps ----------
  function deriveApps(data){
    if (Array.isArray(data?.apps) && data.apps.length) return data.apps.slice(0,5);
    let plans=[];
    if (Array.isArray(data?.plans)) plans=data.plans;
    else if (data?.plan) plans=[data.plan];
    else {
      const nest=tryParse(data?.result)||tryParse(data?.output)||tryParse(data?.plan_json)||tryParse(data);
      if (Array.isArray(nest?.plans)) plans=nest.plans; else if (nest?.plan) plans=[nest.plan];
    }
    const seen=new Set(), out=[];
    const add=(a)=>{ const n=(a?.app_name||a?.name||"").trim(); if(!n||seen.has(n)) return; seen.add(n); out.push(a); };
    if(plans[0]?.apps) (plans[0].apps||[]).forEach(add);
    for(let i=1;i<plans.length && out.length<5;i++) (plans[i].apps||[]).forEach(add);
    const fallbacks=[
      {app_name:"Experian Boost",app_url:"https://www.experian.com/boost"},
      {app_name:"Kikoff",app_url:"https://www.kikoff.com/"},
      {app_name:"Kovo",app_url:"https://www.kovo.com/"}
    ];
    for(const f of fallbacks){ if(out.length>=3) break; if(!seen.has(f.app_name)) out.push(f); }
    return out.slice(0,5);
  }

  // ---------- Render into the Sidebar slot ----------
  function renderAppsIntoSlot(apps){
    const slot=document.getElementById("sidebar-slot");
    if(!slot) return;
    slot.innerHTML = apps.map((a,i)=>{
      const name=a.app_name||a.name||"App";
      const url =a.app_url ||a.url  ||"";
      const [p1,p2,p3]=stepsFor(name,a);
      return `
<details class="group"${i===0?" open":""}>
  <summary class="w-full flex items-center justify-between px-3 py-2 bg-lime-600 text-black rounded-md hover:bg-lime-500 transition-colors text-xs font-medium cursor-pointer"
    data-app="${name}" data-url="${url}" data-step1="${p1}" data-step2="${p2}" data-step3="${p3}">
    <span class="flex items-center space-x-1.5">
      <i data-lucide="${iconFor(name)}" class="w-3.5 h-3.5"></i><span>${name}</span>
    </span>
    <i data-lucide="chevron-down" class="w-3 h-3 chev"></i>
  </summary>
  <ul class="mt-3 space-y-2 px-3 pb-3">
    <li class="flex items-center justify-between text-xs text-zinc-300"><span>${p1}</span><input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600"></li>
    <li class="flex items-center justify-between text-xs text-zinc-300"><span>${p2}</span><input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600"></li>
    <li class="flex items-center justify-between text-xs text-zinc-300"><span>${p3}</span><input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600"></li>
  </ul>
</details>`;
    }).join("");

    safe(()=>window.lucide&&lucide.createIcons());
    safe(()=>window.initInstructions&&window.initInstructions());

    if(apps.length===3){
      const host=document.querySelector("#compose .mt-4")||document.querySelector("#compose");
      if(host){ const p=document.createElement("p"); p.className="text-xs italic text-zinc-400 mt-2";
        p.textContent="Your starter stack includes 3 apps (min spec). More can be added based on your profile.";
        host.appendChild(p);
      }
    }
  }

  // ---------- Icons + entrance anim ----------
  document.addEventListener("DOMContentLoaded", () => {
    safe(() => window.lucide && lucide.createIcons());
    document.querySelectorAll("[data-anim]").forEach((el,i)=> setTimeout(()=> el.classList.add("show"), i*150));
  });

  // ---------- Local progress (checklist + save/complete) ----------
  document.addEventListener("DOMContentLoaded", () => {
    const ns = `ss:${getParam("t","anon")}:`;
    document.querySelectorAll('input[type="checkbox"]').forEach((cb,i)=>{
      const key = `${ns}cb:${i}`;
      cb.checked = localStorage.getItem(key)==="1";
      cb.addEventListener("change", ()=> localStorage.setItem(key, cb.checked?"1":"0"));
    });
    const saveBtn=[...document.querySelectorAll("button")].find(b=>/save progress/i.test(b.textContent||""));
    if (saveBtn) saveBtn.addEventListener("click", ()=>{ localStorage.setItem(`${ns}progress-saved`, Date.now().toString()); alert("Progress saved locally!"); });
    const doneBtn=[...document.querySelectorAll("button")].find(b=>/mark complete/i.test(b.textContent||""));
    if (doneBtn) {
      const k=`${ns}completed`;
      if (localStorage.getItem(k)==="1"){ doneBtn.textContent="Completed ✔"; doneBtn.classList.add("bg-emerald-600"); }
      doneBtn.addEventListener("click",(e)=>{ e.preventDefault(); localStorage.setItem(k,"1"); doneBtn.textContent="Completed ✔"; doneBtn.classList.add("bg-emerald-600"); });
    }
  });

  // ---------- Instruction form binder ----------
  window.initInstructions = function initInstructions(){
    const lastKey = `ss:${getParam("t","anon")}:lastApp`;
    const form = document.querySelector("#instructions form") || document.querySelector("main#instructions form");
    if (!form) return;
    const url=form.querySelector('input[type="url"]'),
          s1 =form.querySelector('textarea[data-hook="field-step1"]'),
          s2 =form.querySelector('textarea[data-hook="field-step2"]'),
          s3 =form.querySelector('textarea[data-hook="field-step3"]'),
          tip=form.querySelector('textarea[data-hook="field-protip"]');

    function apply(sum){ if(!sum) return; const d=sum.dataset||{};
      if(url) url.value=d.url||"";
      if(s1) s1.value=d.step1||"";
      if(s2) s2.value=d.step2||"";
      if(s3) s3.value=d.step3||"";
      if(tip) tip.value=d.tip||"";
      if(d.app) localStorage.setItem(lastKey,d.app);
    }

    // reset listeners (avoid duplicate toggles)
    document.querySelectorAll("#compose details.group").forEach(el=>{ const c=el.cloneNode(true); el.parentNode.replaceChild(c,el); });

    // accordion + apply
    document.querySelectorAll("#compose details.group").forEach(el=>{
      el.addEventListener("toggle",()=>{ if(!el.open) return;
        document.querySelectorAll("#compose details.group").forEach(x=>{ if(x!==el) x.open=false; });
        apply(el.querySelector("summary"));
      });
    });

    // restore or first
    const last=localStorage.getItem(lastKey); let restored=false;
    if(last){
      const sum=[...document.querySelectorAll("#compose details.group summary")].find(s=>(s.dataset.app||"").toLowerCase()===last.toLowerCase());
      if(sum){ const det=sum.closest("details.group"); if(det) det.open=true; apply(sum); restored=true; }
    }
    if(!restored){
      const sum=document.querySelector("#compose details.group[open] summary")||document.querySelector("#compose details.group summary");
      if(sum) apply(sum);
    }
  };
  document.addEventListener("DOMContentLoaded", ()=> safe(()=> window.initInstructions?.()));

  // ---------- Print helpers ----------
  document.addEventListener("DOMContentLoaded", ()=>{
    const state=new WeakMap();
    const expand=()=> document.querySelectorAll("details").forEach(d=>{ state.set(d,d.open); d.open=true; });
    const restore=()=> document.querySelectorAll("details").forEach(d=>{ const v=state.get(d); if(v!==void 0) d.open=v; });
    document.getElementById("print-plan")?.addEventListener("click", ()=>{ expand(); setTimeout(()=>window.print(),50); });
    window.addEventListener("beforeprint", expand);
    window.addEventListener("afterprint", restore);
  });

  // ---------- Auto-render for guide pages ----------
  async function renderForCurrentPage(){
    const slot=document.getElementById("sidebar-slot");
    if(!slot) return; // not a guide page

    // If SSR already filled, just hydrate
    if (slot.children.length>0){
      safe(()=>window.lucide&&lucide.createIcons());
      safe(()=>window.initInstructions&&window.initInstructions());
      safe(()=>finishLoadingThenHide());
      return;
    }

    const stackKey=getParam("stackKey","foundation");
    try {
      safe(()=>setLoading(true));
      const payload=await fetchPlan(stackKey);
      const apps=deriveApps(payload);
      renderAppsIntoSlot(apps);
    } catch (err) {
      console.error("plan.runtime → renderForCurrentPage fetch failed:", err);
      renderAppsIntoSlot(deriveApps({}));
    } finally {
      safe(()=>finishLoadingThenHide());
    }
  }

  // Expose for guides (e.g., 82.html)
  window.composeGuide = async function(stackKey="foundation"){
    try {
      safe(()=>setLoading(true));
      const payload = await fetchPlan(stackKey);
      const apps = deriveApps(payload);
      renderAppsIntoSlot(apps);
    } catch (err) {
      console.error("composeGuide → plan fetch failed:", err);
      renderAppsIntoSlot(deriveApps({}));
    } finally {
      safe(()=>finishLoadingThenHide());
    }
  };

  document.addEventListener("DOMContentLoaded", ()=> {
    renderForCurrentPage().catch(err=>console.error("plan.runtime → render failed:", err));
  });
})();

```

---
## Netlify Function: netlify/functions/generate-plan.js

```js
// netlify/functions/generate-plan.js
// Personalized plan composer (no PII). Accepts POST { stackKey, answers } or GET ?stackKey=...
import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const HAS_KEY = !!process.env.OPENAI_API_KEY;
const client = HAS_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/* ---------- Deterministic fallback catalog + scorer ---------- */
function app(name, url, features, meta) {
  return { app_name: name, app_url: url, features, ...meta };
}

const CATALOG = [
  app("Experian Boost", "https://www.experian.com/boost", ["Utilities reporting", "Streaming bills count"], {
    tags: ["utilities", "instant", "free"],
    cost: 0,
  }),
  app("Grow Credit", "https://www.growcredit.com", ["Stream/Subscriptions builder"], {
    tags: ["subscriptions", "utilities", "low-cost"],
    cost: 0,
  }),
  app("Grain Utility Builder", "https://www.grain.com", ["Utility tradeline"], {
    tags: ["utilities", "tradeline"],
    cost: 10,
  }),
  app("BoomPay Rent", "https://www.boompay.app", ["Monthly + backdate"], { tags: ["rent", "backdate"], cost: 4 }),
  app("RentReporters", "https://www.rentreporters.com", ["Verify landlord", "Backdate eligible"], {
    tags: ["rent", "backdate", "manual"],
    cost: 10,
  }),
  app("Piñata", "https://www.pinata.ai", ["Rewards + rent reporting"], { tags: ["rent", "rewards"], cost: 0 }),
  app("Kikoff", "https://www.kikoff.com", ["Credit account", "Low utilization"], {
    tags: ["installment", "low-cost", "fast"],
    cost: 5,
  }),
  app("Self", "https://www.self.inc", ["Credit Builder Loan"], { tags: ["installment", "bank-link"], cost: 25 }),
  app("Kovo", "https://www.kovo.com", ["Installment trade"], { tags: ["installment", "purchase"], cost: 10 }),
  app("Dovly", "https://www.dovly.com", ["Automated disputes"], { tags: ["dispute", "automation"], cost: 0 }),
  app("DisputeBee", "https://disputebee.com", ["DIY letters"], { tags: ["dispute", "manual"], cost: 20 }),
  app("TomoCard Secured", "https://www.tomocredit.com", ["Secured tradeline"], { tags: ["tradeline", "secured"], cost: 0 }),
  app("Extra Debit", "https://www.extra.app", ["Debit-to-credit"], { tags: ["tradeline", "debit"], cost: 20 }),
];

function normalizeUrl(u = "") {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return String(u || "").trim().toLowerCase();
  }
}

function normalizeName(n = "") {
  return String(n || "").trim().toLowerCase();
}

function findCatalogMatch(appObj) {
  if (!appObj) return null;
  const n = normalizeName(appObj.app_name || appObj.name || "");
  const h = normalizeUrl(appObj.app_url || appObj.website || "");
  if (!n && !h) return null;

  // Name match first
  let hit = CATALOG.find((c) => normalizeName(c.app_name) === n);
  if (hit) return hit;

  // Host match
  hit = CATALOG.find((c) => normalizeUrl(c.app_url) === h);
  return hit || null;
}

function scoreApp(a, answers, stackKey) {
  const tags = new Set(a.tags || []);
  let s = 0;

  const tl = (answers.timeline || "").toLowerCase();
  if (tl.includes("fast") && (tags.has("utilities") || tags.has("instant"))) s += 3;
  if (tl.includes("steady") && tags.has("installment")) s += 2;
  if (tl.includes("aggressive") && (tags.has("dispute") || tags.has("installment") || tags.has("tradeline"))) s += 2;

  const lv = (answers.living || "").toLowerCase();
  if (lv.includes("rent") && tags.has("rent")) s += 3;
  if (lv.includes("own") && tags.has("utilities")) s += 2;

  const bdg = (answers.budget || "").toLowerCase();
  if (bdg.includes("$0") || bdg.includes("free") || bdg.includes("0")) s += a.cost <= 5 ? 3 : a.cost <= 10 ? 2 : 0;
  else if (bdg.includes("10")) s += a.cost <= 15 ? 2 : 0;
  else s += 1;

  const emp = (answers.employment || "").toLowerCase();
  if (emp.includes("self")) {
    if (tags.has("utilities") || tags.has("installment")) s += 1;
  }
  if (emp.includes("w2") || emp.includes("employ")) s += 1;

  if ((answers.rent_backdate || "").toLowerCase().includes("yes") && tags.has("backdate")) s += 2;

  if (stackKey === "foundation") {
    if (tags.has("utilities")) s += 2;
    if (tags.has("installment")) s += 1;
  }
  if (stackKey === "growth") {
    if (tags.has("installment") || tags.has("rent")) s += 2;
  }
  if (stackKey === "accelerator") {
    if (tags.has("dispute") || tags.has("installment")) s += 2;
  }
  if (stackKey === "elite") {
    if (tags.has("dispute") || tags.has("tradeline")) s += 2;
  }

  return s;
}

function pickApps(answers, stackKey) {
  const ranked = CATALOG.map((a) => ({ a, score: scoreApp(a, answers, stackKey) })).sort((x, y) => y.score - x.score);
  const want = (() => {
    if (stackKey === "foundation") return ["utilities", "installment", "rent"];
    if (stackKey === "growth") return ["installment", "rent", "utilities"];
    if (stackKey === "accelerator") return ["dispute", "installment", "utilities"];
    if (stackKey === "elite") return ["dispute", "tradeline", "installment"];
    return ["utilities", "installment", "rent"];
  })();

  const seen = new Set();
  const chosen = [];

  for (const cat of want) {
    const hit = ranked.find((r) => !seen.has(r.a.app_name) && (r.a.tags || []).includes(cat));
    if (hit) {
      chosen.push(hit.a);
      seen.add(hit.a.app_name);
    }
  }

  for (const r of ranked) {
    if (chosen.length >= 5) break;
    if (!seen.has(r.a.app_name)) {
      chosen.push(r.a);
      seen.add(r.a.app_name);
    }
  }

  return chosen.slice(0, Math.max(3, Math.min(5, chosen.length)));
}

/* ---------- Substitutes (more variety + global de-dupe + exclude primaries) ---------- */
function sharedTagsScore(primaryTags = [], candidateTags = []) {
  const a = new Set(primaryTags || []);
  let overlap = 0;
  for (const t of candidateTags || []) if (a.has(t)) overlap += 1;
  return overlap;
}

function parseBudgetDollars(budgetStr = "") {
  // Handles "45", "$45/mo", "free", "$0"
  const s = String(budgetStr || "").toLowerCase();
  if (s.includes("free") || s.includes("$0") || s.trim() === "0") return 0;
  const m = s.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : 999;
}

/**
 * Substitutes strategy:
 * - Sub #1: closest match (tag overlap + fit)
 * - Sub #2: adjacent option (different tags but still fits)
 * - Sub #3: wildcard best remaining
 *
 * Diversity controls:
 * - usageSet prevents repeating the same substitutes across the whole plan
 * - primarySet prevents substitutes from being any of the plan's primary apps
 */
function pickSubstitutes(primaryApp, answers, stackKey, usageSet, primarySet, limit = 3) {
  const primaryMatch = findCatalogMatch(primaryApp);
  const primaryTags = primaryMatch?.tags || primaryApp?.tags || [];
  const primaryName = normalizeName(primaryApp?.app_name);

  const budgetCap = parseBudgetDollars(answers?.budget || "");
  const preferLowCost = budgetCap <= 10;

  const ranked = CATALOG
    .filter((c) => {
      const n = normalizeName(c.app_name);
      if (n === primaryName) return false; // not itself
      if (primarySet?.has(n)) return false; // not any primary app in the plan
      return true;
    })
    .map((c) => {
      const overlap = sharedTagsScore(primaryTags, c.tags || []);
      const fit = scoreApp(c, answers, stackKey);

      // Cost penalty if budget tight
      const costPenalty = preferLowCost ? Math.max(0, (c.cost || 0) - 10) : 0;

      // Global de-dupe penalty (avoid repeating the same substitutes across the plan)
      const usedPenalty = usageSet?.has(normalizeName(c.app_name)) ? 5 : 0;

      // Weighted score: overlap heavily influences #1; fit helps variety picks
      const score = overlap * 10 + fit * 2 - costPenalty - usedPenalty;

      return { c, overlap, fit, score };
    })
    .sort((a, b) => b.score - a.score);

  const picked = [];

  // Sub #1: best overlap+fit (closest alternative)
  const best = ranked.find((r) => (primaryTags.length ? r.overlap > 0 : true));
  if (best) picked.push(best.c);

  // Sub #2: diversify tags (prefer low overlap but still good fit)
  const second = ranked.find((r) => {
    if (picked.some((p) => normalizeName(p.app_name) === normalizeName(r.c.app_name))) return false;
    const lowOverlap = primaryTags.length ? r.overlap === 0 : true;
    return lowOverlap && r.fit >= 1;
  });
  if (second) picked.push(second.c);

  // Sub #3: wildcard best remaining
  const third = ranked.find((r) => !picked.some((p) => normalizeName(p.app_name) === normalizeName(r.c.app_name)));
  if (third) picked.push(third.c);

  const final = picked.slice(0, limit);
  for (const p of final) usageSet?.add(normalizeName(p.app_name));

  return final.map((x) => ({
    app_name: x.app_name,
    app_url: x.app_url,
    features: x.features || [],
    tags: x.tags || [],
    cost: typeof x.cost === "number" ? x.cost : undefined,
  }));
}

function attachSubstitutes(apps, answers, stackKey, limit = 3) {
  const usageSet = new Set(); // global de-dupe for this plan response
  const primarySet = new Set((apps || []).map((a) => normalizeName(a?.app_name || ""))); // exclude primaries from substitutes

  return (apps || []).map((a) => {
    const substitutes = pickSubstitutes(a, answers, stackKey, usageSet, primarySet, limit);

    // If GPT app matches catalog, enrich it with tags/cost so UI/export can use them later.
    const match = findCatalogMatch(a);

    return {
      ...a,
      ...(match ? { tags: match.tags, cost: match.cost } : {}),
      substitutes,
    };
  });
}

/* ---------- Validation (no deps) ---------- */
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v, min = 1, max = 5) {
  return Array.isArray(v) && v.length >= min && v.length <= max && v.every(isNonEmptyString);
}

function validatePlanShape(plan) {
  const errors = [];

  if (!plan || typeof plan !== "object") {
    errors.push("plan_not_object");
    return { ok: false, errors };
  }

  const meta = plan.meta;
  if (!meta || typeof meta !== "object") errors.push("meta_missing_or_invalid");
  else {
    if (!isNonEmptyString(meta.stackKey)) errors.push("meta.stackKey_missing");
    if (!isNonEmptyString(meta.source)) errors.push("meta.source_missing");
  }

  const apps = plan.apps;
  if (!Array.isArray(apps)) errors.push("apps_missing");
  else {
    if (apps.length < 3 || apps.length > 5) errors.push("apps_length_invalid");

    const primaryNames = new Set(apps.map((a) => normalizeName(a?.app_name || "")));

    apps.forEach((a, idx) => {
      if (!a || typeof a !== "object") {
        errors.push(`apps[${idx}]_not_object`);
        return;
      }
      if (!isNonEmptyString(a.app_name)) errors.push(`apps[${idx}].app_name_missing`);
      if (!isNonEmptyString(a.app_url)) errors.push(`apps[${idx}].app_url_missing`);
      if (!isStringArray(a.features, 1, 5)) errors.push(`apps[${idx}].features_invalid`);

      if (!Array.isArray(a.substitutes)) {
        errors.push(`apps[${idx}].substitutes_missing`);
      } else {
        if (a.substitutes.length < 1 || a.substitutes.length > 3) errors.push(`apps[${idx}].substitutes_length_invalid`);

        a.substitutes.forEach((s, j) => {
          if (!s || typeof s !== "object") {
            errors.push(`apps[${idx}].substitutes[${j}]_not_object`);
            return;
          }
          if (!isNonEmptyString(s.app_name)) errors.push(`apps[${idx}].substitutes[${j}].app_name_missing`);
          if (!isNonEmptyString(s.app_url)) errors.push(`apps[${idx}].substitutes[${j}].app_url_missing`);
          if (!isStringArray(s.features, 1, 5)) errors.push(`apps[${idx}].substitutes[${j}].features_invalid`);

          // Ensure substitutes are not in primary apps
          const sn = normalizeName(s.app_name || "");
          if (sn && primaryNames.has(sn)) errors.push(`apps[${idx}].substitutes[${j}].is_primary_app`);
        });
      }
    });
  }

  return { ok: errors.length === 0, errors };
}

/* ---------- GPT composer (structured JSON) ---------- */
const JSON_SCHEMA = {
  name: "stack_plan",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      apps: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "website", "features"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 60 },
            website: { type: "string", minLength: 8, maxLength: 200 },
            features: {
              type: "array",
              minItems: 1,
              maxItems: 5,
              items: { type: "string", minLength: 2, maxLength: 120 },
            },
          },
        },
      },
      reasoning: { type: "string" },
    },
    required: ["apps"],
  },
};

async function gptPlan(stackKey, answers) {
  if (!HAS_KEY) throw new Error("no_openai_key");
  const sys = `You are an expert credit-building coach for US consumers.
Return ONLY JSON matching the schema. 3–5 apps that best fit the user and stack.
Stacks:
- foundation: low friction + instant impact + basic builders
- growth: installment depth + rent reporting
- accelerator: add dispute automation + momentum
- elite: dispute + tradelines + best-in-class builders
Rules: real products with correct URLs; tailor to timeline, living, budget, employment, rent backdate; prefer low cost if budget tight; include concise features to activate.`;

  const user = {
    stackKey,
    answers: {
      living: answers.living || "",
      budget: answers.budget || "",
      timeline: answers.timeline || "",
      employment: answers.employment || "",
      rent_backdate: answers.rent_backdate || "",
    },
  };

  const resp = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 600,
    response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify(user) },
    ]
  });

  const raw = resp.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);

  const apps = (parsed?.apps || [])
    .map((a) => ({
      app_name: a.name,
      app_url: a.website,
      features: a.features || [],
    }))
    .slice(0, 5);

  if (apps.length < 3) throw new Error("insufficient_apps");

  const appsWithSubs = attachSubstitutes(apps, answers, stackKey, 3);

  const plan = {
    meta: { stackKey, personalized: true, model: MODEL, source: "gpt" },
    apps: appsWithSubs,
    reasoning: parsed?.reasoning || "",
  };

  const v = validatePlanShape(plan);
  if (!v.ok) {
    const err = new Error("invalid_plan_shape");
    err.details = v.errors;
    throw err;
  }

  return plan;
}

/* ---------- Handler ---------- */
export const handler = async (event) => {
  try {
    let stackKey = "foundation";
    let answers = {};

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      stackKey = (body.stackKey || "foundation").toLowerCase();
      answers = body.answers || {};
    } else {
      const params = new URLSearchParams(event.queryStringParameters || {});
      stackKey = (params.get("stackKey") || "foundation").toLowerCase();
      const a = params.get("a");
      if (a) {
        try {
          answers = JSON.parse(Buffer.from(a, "base64").toString("utf8"));
        } catch {}
      }
    }

    // GPT first; fallback if anything fails
    try {
      const plan = await gptPlan(stackKey, answers);
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "x-plan-source": "gpt",
        },
        body: JSON.stringify(plan),
      };
    } catch (e) {
      // Deterministic fallback
      const fallback = pickApps(answers, stackKey);
      const fallbackWithSubs = attachSubstitutes(fallback, answers, stackKey, 3);

      const plan = {
        meta: { stackKey, personalized: false, fallback: true, source: "fallback" },
        apps: fallbackWithSubs,
      };

      const v = validatePlanShape(plan);
      if (!v.ok) {
        // If even fallback doesn't validate, return a minimal hard-safe response
        console.error("Fallback plan failed validation:", v.errors);
        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "x-plan-source": "fallback",
          },
          body: JSON.stringify({
            meta: { stackKey, personalized: false, fallback: true, source: "fallback" },
            apps: [],
            error: "fallback_invalid",
            detail: v.errors,
          }),
        };
      }

      // Log GPT validation errors quietly (no PII)
      if (e?.details) console.warn("GPT plan failed validation; using fallback:", e.details);
      else console.warn("GPT plan failed; using fallback:", String(e?.message || e));

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "x-plan-source": "fallback",
        },
        body: JSON.stringify(plan),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
};

```

---
## STACKSCORE_FRONTEND_AUDIT.md

```md
Launch Stabilization & Architecture Reset

1. Objective

Stabilize and simplify the StackScore front-end architecture for launch.

This is not a redesign.
This is not a React rewrite.
This is not a long-term platform refactor.

This is a lean deterministic launch architecture reset.

Goals:

Ensure deterministic routing

Ensure deterministic asset loading

Eliminate duplicate execution paths

Remove preview confusion

Minimize moving parts

Preserve all existing functionality

2. Current Verified System Behavior

The following statements are authoritative truths:

Build Tool

Vite + React SPA

publish = dist in Netlify

Hosting

Netlify (production + Netlify dev)

Netlify dev is authoritative for:

redirects

functions

environment variables

Important

vite preview is NOT authoritative for:

redirects

Netlify functions

Do not treat preview behavior as production behavior.

3. Current Stack (Verified)
CSS

Tailwind CLI builds:

public/assets/app.css

public/assets/guide.css

Runtime JS

public/assets/guide.js

public/assets/plan.runtime.js

plan.runtime.js is built via esbuild from:

scripts/plan.runtime.src.js

Guides

Static HTML files in:

public/guides/*.html

Deployed to:

dist/guides/*.html

API

Canonical endpoint:

/.netlify/functions/generate-plan

No other API path should be used for launch

Dev Harness

Canonical dev command:

netlify dev

4. Routing Model (Current State)
SPA

/ → React app

Guides

/guide/:id → rewritten to /guides/:id.html

Static HTML file loads

Hydration handled by plan.runtime.js

Catch-all

/* → /index.html

Redirect order in netlify.toml:

/guide/:id
/* → index.html


This order is critical.

5. Known Issues (Now Resolved)

The following were previously problematic but are now stabilized:

Invalid <head> structure in guide HTML

Mixed DEV + PROD CSS references

Asset uncertainty in dist

Incorrect UI flash before plan hydration

Inconsistent runtime JS usage

All resolved.

6. Remaining Structural Risks

These are architectural risks to evaluate via Opus:

Duplicate backend surface:

Netlify functions

Node server (server/index.js)

Potential build redundancy:

Tailwind CLI + Vite build separation

Guide generation standardization:

Prevent future manual <head> edits

Clarify canonical dev workflow

Clarify which backend is authoritative for launch

7. Canonical Launch Principles

For launch, architecture must prioritize:

Speed

Simplicity

Determinism

Stability

Fewer runtime paths

Fewer conditionals

One source of truth per concern

Prefer removing complexity rather than supporting multiple systems.

8. Explicit Non-Goals (Launch Phase)

Do NOT:

Rewrite to Next.js

Introduce SSR

Introduce new frameworks

Redesign UI

Change guide layout

Expand feature scope

Optimize prematurely for long-term extensibility

This phase is launch hardening only.

9. What Must Work in Production

The following flows must be verified:

1. Marketing Page

Loads cleanly

No missing assets

2. Wizard Flow

Navigates correctly

Stores answers in localStorage

3. Guide Page

/guide/:id loads static HTML

Calls Netlify function

Displays premium loading overlay

Hydrates with plan data

No flash of incorrect content

Lucide icons render

Instruction binder works

Print function works

4. Function

/.netlify/functions/generate-plan

Returns valid JSON

Handles errors gracefully

Works in Netlify dev + production

10. Opus 4.6 Audit Request

Opus should:

Produce a system map

Identify structural duplication

Identify fragility

Propose lean target architecture

Provide surgical migration plan

Provide launch verification checklist

Optimize strictly for:

Lean deterministic launch architecture.

End of Audit Document
```

---
## Dist Proof (if available)

### dist/guides

```text
total 40
drwxr-xr-x   3 ejosephmartin  staff     96 Feb 20 17:25 .
drwxr-xr-x  13 ejosephmartin  staff    416 Feb 20 17:25 ..
-rwx------   1 ejosephmartin  staff  17010 Feb 20 17:25 82.html
```

### dist/assets (full listing)

```text
total 8200
drwxr-xr-x  19 ejosephmartin  staff     608 Feb 20 17:25 .
drwxr-xr-x  13 ejosephmartin  staff     416 Feb 20 17:25 ..
-rwx------   1 ejosephmartin  staff    6148 Feb 20 17:25 .DS_Store
-rwx------   1 ejosephmartin  staff  995172 Feb 20 17:25 app.css
drwxr-xr-x   5 ejosephmartin  staff     160 Feb 20 17:25 css
drwxr-xr-x  16 ejosephmartin  staff     512 Feb 20 17:25 fonts
-rwx------   1 ejosephmartin  staff    4321 Feb 20 17:25 guide 530.js
-rwx------   1 ejosephmartin  staff  991447 Feb 20 17:25 guide.css
-rwx------   1 ejosephmartin  staff    9362 Feb 20 17:25 guide.js
-rwx------   1 ejosephmartin  staff     295 Feb 20 17:25 guide.src.css
drwxr-xr-x   5 ejosephmartin  staff     160 Feb 20 17:25 images
-rw-r--r--   1 ejosephmartin  staff    1625 Feb 20 17:25 index-DDBN-XfQ.js
-rwx------   1 ejosephmartin  staff  373222 Feb 20 17:25 lucide.min.js
-rw-r--r--   1 ejosephmartin  staff  989111 Feb 20 17:25 main-cavmlguU.css
-rw-r--r--   1 ejosephmartin  staff  626338 Feb 20 17:25 main-DHh_6kRK.js
-rwx------   1 ejosephmartin  staff   11329 Feb 20 17:25 plan.runtime.js
-rwx------   1 ejosephmartin  staff   25772 Feb 20 17:25 plan.runtime.js.map
-rw-r--r--   1 ejosephmartin  staff    5237 Feb 20 17:25 safelist.txt
-rwx------   1 ejosephmartin  staff     398 Feb 20 17:25 scrollfix.js
```

### dist/assets (key files)

```text
-rwx------   1 ejosephmartin  staff  995172 Feb 20 17:25 app.css
-rwx------   1 ejosephmartin  staff  991447 Feb 20 17:25 guide.css
-rwx------   1 ejosephmartin  staff    9362 Feb 20 17:25 guide.js
-rwx------   1 ejosephmartin  staff  373222 Feb 20 17:25 lucide.min.js
-rwx------   1 ejosephmartin  staff   11329 Feb 20 17:25 plan.runtime.js
-rwx------   1 ejosephmartin  staff   25772 Feb 20 17:25 plan.runtime.js.map
```

