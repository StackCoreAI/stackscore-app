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