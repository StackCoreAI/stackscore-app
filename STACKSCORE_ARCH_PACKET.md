STACKSCORE ARCHITECTURE PACKET
==============================

GOAL:
Turn StackScore into a pristine, deterministic architecture foundation before shipping.
No framework rewrite. Must remain static-host compatible on Netlify.
Must support SPA + static guides cleanly.


=====================================================
1) BUILD + DEPLOY
=====================================================

netlify.toml
-------------
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["openai"]

[[redirects]]
  from = "/guide/82"
  to   = "/guides/82.html"
  status = 200

[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200


package.json (scripts only)
---------------------------
<PASTE scripts section here>


vite.config.ts
--------------
<PASTE full vite config here>



=====================================================
2) SPA (React + Vite)
=====================================================

index.html
----------
<PASTE head + script section only>

src/main.jsx
------------
<PASTE file here>



=====================================================
3) GUIDES SYSTEM (Static HTML + Tailwind CLI)
=====================================================

public/guides/82.html (final cleaned)
--------------------------------------
<PASTE full head section + note that it loads /assets/*>


public/assets/guide.js
----------------------
<PASTE file here>


public/assets/guide.src.css
---------------------------
<PASTE file here>


public/assets/guide.css (built output)
--------------------------------------
<OPTIONAL>



=====================================================
4) RUNTIME + API
=====================================================

scripts/plan.runtime.src.js
---------------------------
<PASTE full file here>


netlify/functions/generate-plan.js
-----------------------------------
<PASTE full file here>


(optional) server/index.js
--------------------------
<PASTE only if architectural decision is required>



=====================================================
5) EVIDENCE / ENVIRONMENT NOTES
=====================================================

- Vite preview returns 404 for /guide/82 because redirects are Netlify-only.
- Vite preview returns 404 for /.netlify/functions/generate-plan because functions are not served in preview.
- generate-plan works in Netlify dev and production.
- dist/guides/82.html exists.
- dist/assets/* contains all required guide dependencies.


=====================================================
CURRENT ARCHITECTURAL REALITY
=====================================================

- SPA served from /
- Static guides served from /guides/*.html
- Netlify publish = dist
- Tailwind CLI builds app.css and guide.css into public/assets
- esbuild builds plan.runtime.js into public/assets
- Vite build copies public/* into dist/*
- Guide runtime calls /.netlify/functions/generate-plan
- Separate Node server exists (server/index.js) with /api/* routes
- Multiple environment modes:
    1) Vite dev
    2) Vite preview (static only)
    3) Netlify dev
    4) Netlify production
