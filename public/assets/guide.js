// public/assets/guide.js

document.documentElement.classList.add("js");

/** ────────────────────────────────────────────────────────────────────────────
 * Shared helpers
 * ─────────────────────────────────────────────────────────────────────────── */
function getQueryParam(name, fallback = "") {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || fallback;
}

function titleForPlanKey(planKey = "growth") {
  const k = String(planKey || "growth").toLowerCase().trim();
  if (k === "foundation") return "Foundation Credit Route";
  if (k === "growth") return "Growth Credit Route";
  if (k === "accelerator") return "Accelerator Credit Route";
  if (k === "elite") return "Elite Credit Route";
  return `${k.charAt(0).toUpperCase()}${k.slice(1)} Credit Route`;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value || "—";
}

function setHtml(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = value || "—";
}

function safeParse(value, fallback = null) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

function readCachedPlan() {
  const sources = [
    sessionStorage.getItem("ss_plan"),
    localStorage.getItem("ss_plan"),
  ];

  for (const raw of sources) {
    const parsed = safeParse(raw, null);
    if (parsed && typeof parsed === "object") return parsed;
  }

  return null;
}

function persistPlan(plan) {
  try {
    const raw = JSON.stringify(plan);
    sessionStorage.setItem("ss_plan", raw);
    localStorage.setItem("ss_plan", raw);
  } catch {}
}

function extractApps(plan) {
  if (!plan) return [];
  if (Array.isArray(plan?.apps)) return plan.apps;
  if (Array.isArray(plan?.plans)) {
    return plan.plans.flatMap((p) => (Array.isArray(p?.apps) ? p.apps : []));
  }
  if (plan?.plan?.apps && Array.isArray(plan.plan.apps)) return plan.plan.apps;
  return [];
}

function uniqueApps(apps = []) {
  const seen = new Set();
  const out = [];

  for (const app of apps) {
    const name = String(app?.app_name || app?.name || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      app_name: name,
      app_url: String(app?.app_url || app?.website || app?.url || "").trim(),
      features: normalizeArray(app?.features),
      step1: String(app?.step1 || "").trim(),
      step2: String(app?.step2 || "").trim(),
      step3: String(app?.step3 || "").trim(),
      tip: String(app?.tip || "").trim(),
      execution_insights: normalizeArray(app?.execution_insights),
      reroutes: normalizeArray(app?.reroutes),
    });
  }

  return out.slice(0, 5);
}

function fallbackStepsFor(app) {
  const explicit = [app?.step1, app?.step2, app?.step3]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (explicit.length) return explicit;

  const appName = String(app?.app_name || "the app");
  const primaryFeature =
    normalizeArray(app?.features)[0] || "the main reporting feature";

  return [
    `Create your ${appName} account and complete the setup flow.`,
    `Connect the payment source, bank account, or verification details required for ${String(primaryFeature).toLowerCase()}.`,
    `Turn on the specific reporting or credit-building feature inside ${appName} so it starts contributing to your route.`,
  ];
}

function routeSummaryText(plan) {
  return (
    String(plan?.routing_summary || "").trim() ||
    "We selected a route designed to compound reporting signals with minimal friction — and included reroutes so your plan stays reliable."
  );
}

function routeStepsList(plan) {
  const steps = normalizeArray(plan?.route_steps).map((v) => String(v).trim()).filter(Boolean);
  if (steps.length) return steps;

  return [
    "Start with the first tool and finish setup before moving to the next.",
    "Turn on the reporting or credit-building feature recommended inside each app.",
    "Enable autopay where available to protect on-time reporting.",
  ];
}

function whyOverviewText(plan) {
  return (
    String(plan?.why_overview || "").trim() ||
    "StackScore selected this Credit Route based on your inputs, prioritizing the strongest reporting opportunities for your timeline, budget, and execution style."
  );
}

function planLabelForScorecard(planKey) {
  const t = titleForPlanKey(planKey);
  return t.replace(/\s+Credit Route$/i, "");
}

function computeSignals(apps = []) {
  const names = apps.map((a) => String(a?.app_name || "").toLowerCase()).join(" | ");
  const signals = [];

  if (/rent|boom|rentreport|pinata|piñata/.test(names)) {
    signals.push("✓ Rent reporting");
  }
  if (/boost|experian|grow credit|grain/.test(names)) {
    signals.push("✓ Utilities reporting");
  }
  if (/kikoff|self|kovo/.test(names)) {
    signals.push("✓ Installment builder");
  }
  if (/dovly|dispute/.test(names)) {
    signals.push("✓ Dispute support");
  }
  if (/tomo|extra|grain/.test(names)) {
    signals.push("✓ Tradeline support");
  }

  if (!signals.length) signals.push("✓ Route resilience");
  if (signals.length < 3) signals.push("✓ Route resilience");

  return signals.slice(0, 4);
}

/** ────────────────────────────────────────────────────────────────────────────
 * Icons + Reveal
 * ─────────────────────────────────────────────────────────────────────────── */
function initIconsAndAnim() {
  try {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  } catch {}

  const anim = document.querySelectorAll("[data-anim]");
  anim.forEach((el, i) => {
    if (!el.classList.contains("show")) {
      setTimeout(() => el.classList.add("show"), i * 120);
    }
  });

  document.querySelectorAll(".init-opacity").forEach((el) => el.classList.add("show"));
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

  const saveBtn = [...document.querySelectorAll("button")].find((b) =>
    /save progress/i.test(b.textContent || "")
  );
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      localStorage.setItem(prefix + "progress-saved", Date.now().toString());
      alert("Progress saved locally!");
    });
  }

  const completeBtn = [...document.querySelectorAll("button")].find((b) =>
    /mark complete/i.test(b.textContent || "")
  );
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
 * Plan Rendering
 * ─────────────────────────────────────────────────────────────────────────── */
function buildSidebarAppItem(app, index) {
  const steps = fallbackStepsFor(app);
  const features = normalizeArray(app.features);
  const reroutes = normalizeArray(app.reroutes);

  const details = document.createElement("details");
  details.className = "group rounded-xl border border-white/10 bg-black/30 overflow-hidden";

  const summary = document.createElement("summary");
  summary.className =
    "cursor-pointer list-none px-3 py-2 flex items-center justify-between gap-3";
  summary.dataset.app = app.app_name || "";
  summary.dataset.url = app.app_url || "";
  summary.dataset.step1 = steps[0] || "";
  summary.dataset.step2 = steps[1] || "";
  summary.dataset.step3 = steps[2] || "";
  summary.dataset.tip = app.tip || "";

  summary.innerHTML = `
    <div class="min-w-0">
      <div class="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">App ${index + 1}</div>
      <div class="text-sm font-medium text-white truncate">${app.app_name || "App"}</div>
    </div>
    <div class="shrink-0 flex items-center gap-2">
      <span class="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-300">
        ${features.length ? features[0] : "Route step"}
      </span>
      <svg class="chev w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9 6 6 6-6"></path>
      </svg>
    </div>
  `;

  const body = document.createElement("div");
  body.className = "px-3 pb-3 border-t border-white/10";

  const featureMarkup = features.length
    ? `<div class="mt-2 text-[11px] text-zinc-400 uppercase tracking-wider">Use these features</div>
       <ul class="mt-1 text-xs text-zinc-200/90 space-y-1 list-disc pl-4">
         ${features.map((f) => `<li>${f}</li>`).join("")}
       </ul>`
    : "";

  const rerouteMarkup = reroutes.length
    ? `<div class="mt-2 text-[11px] text-zinc-400 uppercase tracking-wider">Reroutes</div>
       <ul class="mt-1 text-xs text-zinc-300 space-y-1 list-disc pl-4">
         ${reroutes.map((r) => `<li>${r}</li>`).join("")}
       </ul>`
    : "";

  const tipMarkup = app.tip
    ? `<div class="mt-2 text-xs text-zinc-300"><span class="text-zinc-400">Tip:</span> ${app.tip}</div>`
    : "";

  body.innerHTML = `
    ${featureMarkup}
    <div class="mt-2 text-[11px] text-zinc-400 uppercase tracking-wider">Activation steps</div>
    <ul class="mt-1 text-xs text-zinc-200/90 space-y-1 list-disc pl-4">
      ${steps.map((step) => `<li>${step}</li>`).join("")}
    </ul>
    ${tipMarkup}
    ${rerouteMarkup}
  `;

  details.appendChild(summary);
  details.appendChild(body);
  return details;
}

function renderSidebarApps(apps) {
  const slot = document.querySelector('[data-hook="app-list"]');
  if (!slot) return;

  slot.innerHTML = "";
  apps.forEach((app, index) => {
    slot.appendChild(buildSidebarAppItem(app, index));
  });
}

function renderRouteSummary(plan, apps) {
  const routingSlot = document.getElementById("routing-slot");
  const summaryEl = document.querySelector('[data-hook="routing-summary"]');
  const stepsEl = document.querySelector('[data-hook="route-steps"]');
  const reroutesWrap = document.querySelector('[data-hook="reroutes"]');
  const reroutesList = document.querySelector(".routing-reroutes-list");

  if (summaryEl) summaryEl.textContent = routeSummaryText(plan);

  if (stepsEl) {
    const steps = routeStepsList(plan);
    stepsEl.innerHTML = steps.map((step) => `<li>${step}</li>`).join("");
  }

  const allReroutes = [
    ...new Set(
      apps.flatMap((app) => normalizeArray(app.reroutes).map((v) => String(v).trim())).filter(Boolean)
    ),
  ];

  if (reroutesWrap && reroutesList) {
    if (allReroutes.length) {
      reroutesWrap.style.display = "block";
      reroutesList.innerHTML = allReroutes.map((item) => `<li>${item}</li>`).join("");
    } else {
      reroutesWrap.style.display = "none";
      reroutesList.innerHTML = "";
    }
  }

  if (routingSlot && summaryEl && summaryEl.textContent.trim() !== "—") {
    routingSlot.style.display = "block";
  }
}

function renderWhy(plan) {
  const overview = document.getElementById("why-overview");
  const assumptions = document.getElementById("why-assumptions");

  if (overview) {
    overview.textContent = whyOverviewText(plan);
  }

  if (assumptions) {
    const items = normalizeArray(plan?.assumptions).map((v) => String(v).trim()).filter(Boolean);
    if (items.length) {
      assumptions.style.display = "block";
      assumptions.innerHTML = items.map((item) => `<li>• ${item}</li>`).join("");
    } else {
      assumptions.style.display = "none";
      assumptions.innerHTML = "";
    }
  }
}

function renderSnapshot(plan, apps, planKey) {
  const focus =
    planKey === "elite"
      ? "Maximum lift"
      : planKey === "accelerator"
      ? "Momentum + cleanup"
      : planKey === "growth"
      ? "Balanced lift"
      : "Low-friction activation";

  const strategy =
    String(plan?.routing_summary || "").trim() ||
    "Low-friction reporting signals";

  setText('[data-hook="snap-focus"]', focus);
  setText('[data-hook="snap-strategy"]', strategy.length > 58 ? strategy.slice(0, 58) + "…" : strategy);
  setText('[data-hook="snap-execution"]', "Step-by-step activation");
  setText('[data-hook="snap-summary"]', routeSummaryText(plan));

  const signals = computeSignals(apps);
  const signalsEl = document.querySelector('[data-hook="scorecard-signals"]');
  if (signalsEl) {
    signalsEl.innerHTML = signals.map((signal) => `<li>${signal}</li>`).join("");
  }

  setText('[data-hook="scorecard-route"]', planLabelForScorecard(planKey));
}

function renderSelectedPlan(planKey) {
  const el = document.getElementById("selected-plan-title");
  if (el) el.textContent = titleForPlanKey(planKey);
}

function renderInstructionPanel(apps, index = 0) {
  const app = apps[index];
  if (!app) return;

  const steps = fallbackStepsFor(app);
  const executionInsights = normalizeArray(app.execution_insights);
  const reroutes = normalizeArray(app.reroutes);
  const features = normalizeArray(app.features);

  const websiteEl = document.querySelector('[data-hook="inst-website"]');
  const whyEl = document.querySelector('[data-hook="inst-why"]');
  const stepsEl = document.querySelector('[data-hook="inst-steps"]');
  const risksEl = document.querySelector('[data-hook="inst-risks"]');
  const fallbacksEl = document.querySelector('[data-hook="inst-fallbacks"]');

  if (websiteEl) {
    websiteEl.href = app.app_url || "#";
    websiteEl.textContent = app.app_url || "—";
  }

  if (whyEl) {
    const summaryParts = [];
    if (features.length) {
      summaryParts.push(`Use these features in ${app.app_name}: ${features.join(", ")}.`);
    } else {
      summaryParts.push(`Use the recommended reporting or credit-building feature inside ${app.app_name}.`);
    }
    if (app.tip) {
      summaryParts.push(`Tip: ${app.tip}`);
    }
    whyEl.textContent = summaryParts.join(" ");
  }

  if (stepsEl) {
    stepsEl.innerHTML = steps.map((step) => `<li>${step}</li>`).join("");
  }

  if (risksEl) {
    const items = executionInsights.length
      ? executionInsights
      : [
          "Confirm setup before moving to the next tool.",
          "Turn on the exact reporting feature named in this route.",
          "Give the account time to report before making extra changes.",
        ];
    risksEl.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  }

  if (fallbacksEl) {
    const items = reroutes.length
      ? reroutes
      : ["If this tool is unavailable, use the reroute recommended elsewhere in your route."];
    fallbacksEl.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  }
}

function renderPlan(plan, planKey) {
  const apps = uniqueApps(extractApps(plan));
  if (!apps.length) return;

  renderSelectedPlan(planKey);
  renderSidebarApps(apps);
  renderRouteSummary(plan, apps);
  renderWhy(plan);
  renderSnapshot(plan, apps, planKey);
  renderInstructionPanel(apps, 0);

  try {
    const routeKey = String(planKey || "growth").toLowerCase();
    localStorage.setItem("ss_route_key", routeKey);
    sessionStorage.setItem("selectedPlanKey", routeKey);
    sessionStorage.setItem("ss_selected", JSON.stringify(routeKey));
  } catch {}
}

async function fetchPlanFromServer(planKey) {
  const answers =
    safeParse(localStorage.getItem("ss_answers"), null) ||
    safeParse(localStorage.getItem("stackscoreUserData"), null) ||
    safeParse(localStorage.getItem("stackscore_answers"), null) ||
    {};

  const res = await fetch("/.netlify/functions/generate-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      stackKey: planKey,
      answers,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || `generate-plan failed (${res.status})`);
  }

  return json;
}

async function initPlanHydration() {
  const planKey =
    String(
      getQueryParam("stackKey", "") ||
      localStorage.getItem("ss_route_key") ||
      sessionStorage.getItem("selectedPlanKey") ||
      "growth"
    )
      .toLowerCase()
      .trim();

  renderSelectedPlan(planKey);

  const cached = readCachedPlan();
  if (cached) {
    renderPlan(cached, planKey);
  }

  try {
    const fresh = await fetchPlanFromServer(planKey);
    persistPlan(fresh);
    renderPlan(fresh, planKey);
    initInstructionsBinder();
  } catch (err) {
    console.error("Guide hydration failed:", err);
    if (!cached) {
      const banner = document.getElementById("ss-answers-banner");
      if (banner) banner.style.display = "block";
    }
  }
}

/** ────────────────────────────────────────────────────────────────────────────
 * Instructions Binder
 * ─────────────────────────────────────────────────────────────────────────── */
function initInstructionsBinder() {
  const params = new URLSearchParams(location.search);
  const token = params.get("t") || "anon";
  const kOpen = `ss:${token}:lastApp`;

  const detailsList = document.querySelectorAll("#compose details.group");
  if (!detailsList.length) return;

  function applyData(sum) {
    if (!sum) return;
    const ds = sum.dataset || {};

    const websiteEl = document.querySelector('[data-hook="inst-website"]');
    const whyEl = document.querySelector('[data-hook="inst-why"]');
    const stepsEl = document.querySelector('[data-hook="inst-steps"]');
    const risksEl = document.querySelector('[data-hook="inst-risks"]');

    if (websiteEl) {
      websiteEl.href = ds.url || "#";
      websiteEl.textContent = ds.url || "—";
    }

    if (whyEl) {
      whyEl.textContent = ds.tip
        ? `Follow the activation steps below and prioritize the key feature inside this app. Tip: ${ds.tip}`
        : "Follow the activation steps below and prioritize the key feature inside this app.";
    }

    if (stepsEl) {
      const steps = [ds.step1, ds.step2, ds.step3].filter(Boolean);
      stepsEl.innerHTML = steps.length
        ? steps.map((step) => `<li>${step}</li>`).join("")
        : "<li>—</li>";
    }

    if (risksEl && !risksEl.children.length) {
      risksEl.innerHTML = `
        <li>Confirm setup before moving to the next tool.</li>
        <li>Turn on the exact reporting feature named in this route.</li>
        <li>Give the account time to report before making extra changes.</li>
      `;
    }

    if (ds.app) localStorage.setItem(kOpen, ds.app);
  }

  detailsList.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) {
        document.querySelectorAll("#compose details.group").forEach((dd) => {
          if (dd !== d) dd.open = false;
        });
        applyData(d.querySelector("summary"));
      }
    });
  });

  const lastApp = localStorage.getItem(kOpen);
  let applied = false;

  if (lastApp) {
    const targetSummary = [...document.querySelectorAll("#compose details.group summary")].find(
      (s) => (s.dataset.app || "").toLowerCase() === lastApp.toLowerCase()
    );
    if (targetSummary) {
      const parent = targetSummary.closest("details.group");
      if (parent) parent.open = true;
      applyData(targetSummary);
      applied = true;
    }
  }

  if (!applied) {
    const firstOpen =
      document.querySelector("#compose details.group[open] summary") ||
      document.querySelector("#compose details.group summary");
    if (firstOpen) {
      const parent = firstOpen.closest("details.group");
      if (parent) parent.open = true;
      applyData(firstOpen);
    }
  }
}

/** ────────────────────────────────────────────────────────────────────────────
 * Learn more toggles
 * ─────────────────────────────────────────────────────────────────────────── */
function initLearnMore() {
  document.querySelectorAll("[data-learn-more]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const more = btn.parentElement?.nextElementSibling;
      if (more) more.classList.toggle("hidden");
    });
  });
}

/** ────────────────────────────────────────────────────────────────────────────
 * Buy button
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  }

  const API_BASE = window.location.origin;

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("buy-now");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const stackKey = getQueryParam("stackKey", "foundation");
      const cacheKey = `ss_email:${stackKey}`;
      let email = (window.__SS_EMAIL__ || localStorage.getItem(cacheKey) || "").trim();

      if (!isEmail(email)) {
        email = (window.prompt("Email to receive your magic access link:", email) || "").trim();
        if (!isEmail(email)) {
          alert("Please enter a valid email address.");
          return;
        }
      }

      localStorage.setItem(cacheKey, email);

      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");

      const url = `${API_BASE}/api/checkout/buy?email=${encodeURIComponent(email)}&stackKey=${encodeURIComponent(stackKey)}`;
      window.location.assign(url);
    });
  });
})();

/** ────────────────────────────────────────────────────────────────────────────
 * Boot
 * ─────────────────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  initIconsAndAnim();
  initLocalProgress();
  initLearnMore();
  await initPlanHydration();
  initInstructionsBinder();
});