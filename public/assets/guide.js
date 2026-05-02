// public/assets/guide.js

document.documentElement.classList.add("js");

function getQueryParam(name, fallback = "") {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || fallback;
}

function titleForPlanKey(planKey = "growth") {
  const k = String(planKey || "growth").toLowerCase().trim();
  if (k === "foundation") return "Foundation CreditRoute";
  if (k === "growth") return "Growth CreditRoute";
  if (k === "accelerator") return "Accelerator CreditRoute";
  if (k === "elite") return "Elite CreditRoute";
  return `${k.charAt(0).toUpperCase()}${k.slice(1)} CreditRoute`;
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
    `Open ${appName} and create your account.`,
    `Connect the payment source, bank account, or verification details needed for ${String(primaryFeature).toLowerCase()}.`,
    `Turn on the specific reporting or credit-building feature inside ${appName}.`,
  ];
}

function routeSummaryText(plan) {
  return (
    String(plan?.routing_summary || "").trim() ||
    "We selected a route designed to organize reporting signals with minimal friction — and included fallback options so your plan stays flexible."
  );
}

function routeStepsList(plan) {
  const steps = normalizeArray(plan?.route_steps).map((v) => String(v).trim()).filter(Boolean);
  if (steps.length) return steps;

  return [
    "Start with the first tool and finish setup before moving to the next.",
    "Turn on the reporting or credit-building feature recommended inside each app.",
    "Enable autopay where available to support on-time reporting.",
  ];
}

function whyOverviewText(plan) {
  return (
    String(plan?.why_overview || "").trim() ||
    "CreditRoute selected this route based on your inputs, prioritizing reporting opportunities for your timeline, budget, and execution style."
  );
}

function planLabelForScorecard(planKey) {
  const t = titleForPlanKey(planKey);
  return t.replace(/\s+CreditRoute$/i, "");
}

function computeSignals(apps = []) {
  const names = apps.map((a) => String(a?.app_name || "").toLowerCase()).join(" | ");
  const signals = [];

  if (/rent|boom|rentreport|pinata|piñata/.test(names)) signals.push("✓ Rent reporting");
  if (/boost|experian|grow credit|grain/.test(names)) signals.push("✓ Utilities reporting");
  if (/kikoff|self|kovo/.test(names)) signals.push("✓ Installment builder");
  if (/dovly|dispute/.test(names)) signals.push("✓ Dispute support");
  if (/tomo|extra|grain/.test(names)) signals.push("✓ Tradeline support");

  if (!signals.length) signals.push("✓ Route resilience");
  if (signals.length < 3) signals.push("✓ Route resilience");

  return signals.slice(0, 4);
}

function asActionStep(text, index) {
  const clean = String(text || "").trim();
  if (!clean) return "";
  return `<li><span class="font-medium text-white">${index + 1}.</span> ${clean}</li>`;
}

function fallbackOptionsHtml() {
  return `
    <div class="text-sm text-zinc-100/90 leading-relaxed space-y-3">
      <p>If a step isn’t available or doesn’t fit your situation, you’ll have alternative paths to continue your CreditRoute.</p>
      <div>
        <p class="mb-1">These may include:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Tools with similar reporting features</li>
          <li>Adjusted sequencing based on timing or budget</li>
          <li>Alternative ways to activate the same signal</li>
        </ul>
      </div>
      <p>Your route is designed to stay flexible — not dependent on a single tool or outcome.</p>
    </div>
  `;
}

function checkpointHtml(app) {
  const features = normalizeArray(app?.features);
  const feature = features[0] || "recommended feature";
  return `
    <div class="rounded-md bg-black/40 border border-white/10 px-3 py-2.5">
      <div class="text-[11px] text-zinc-400 mb-1.5">Checkpoint</div>
      <ul class="list-disc pl-5 text-sm text-zinc-100/90 space-y-1">
        <li>Check that your account setup is complete.</li>
        <li>Confirm the ${feature} option is turned on or submitted.</li>
        <li>Save any confirmation screen, email, or setup note for your records.</li>
      </ul>
    </div>
  `;
}

function moveForwardHtml() {
  return `
    <div class="rounded-md bg-black/40 border border-white/10 px-3 py-2.5">
      <div class="text-[11px] text-zinc-400 mb-1.5">How to Move Forward</div>
      <ul class="list-disc pl-5 text-sm text-zinc-100/90 space-y-1">
        <li>Move to the next step after setup is complete and saved.</li>
        <li>Avoid adding extra tools until the current step is confirmed.</li>
        <li>Use the fallback options if the tool, feature, or timing does not fit your situation.</li>
      </ul>
    </div>
  `;
}

function completionHtml() {
  return `
    <div class="rounded-md bg-black/40 border border-white/10 px-3 py-2.5">
      <div class="text-[11px] text-zinc-400 mb-1.5">You’re done when</div>
      <ul class="list-disc pl-5 text-sm text-zinc-100/90 space-y-1">
        <li>The account or tool setup is complete.</li>
        <li>The recommended feature is enabled, submitted, or ready for review.</li>
        <li>You know the next step in your CreditRoute.</li>
      </ul>
    </div>
  `;
}

function timeRequiredHtml() {
  return `
    <div class="rounded-md bg-black/40 border border-white/10 px-3 py-2.5">
      <div class="text-[11px] text-zinc-400 mb-1.5">Time required</div>
      <p class="text-sm text-zinc-100/90 leading-relaxed">Most setup steps take about 10–20 minutes. Some tools may take longer if identity, bank, or account verification is required.</p>
    </div>
  `;
}

function initIconsAndAnim() {
  try {
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  } catch {}

  const anim = document.querySelectorAll("[data-anim]");
  anim.forEach((el, i) => {
    if (!el.classList.contains("show")) setTimeout(() => el.classList.add("show"), i * 120);
  });

  document.querySelectorAll(".init-opacity").forEach((el) => el.classList.add("show"));
}

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

  const saveBtn = [...document.querySelectorAll("button")].find((b) => /save progress/i.test(b.textContent || ""));
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      localStorage.setItem(prefix + "progress-saved", Date.now().toString());
      alert("Progress saved locally!");
    });
  }

  const completeBtn = [...document.querySelectorAll("button")].find((b) => /mark complete/i.test(b.textContent || ""));
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

function buildSidebarAppItem(app, index) {
  const steps = fallbackStepsFor(app);
  const features = normalizeArray(app.features);
  const reroutes = normalizeArray(app.reroutes);

  const details = document.createElement("details");
  details.className = "group rounded-xl border border-white/10 bg-black/30 overflow-hidden";

  const summary = document.createElement("summary");
  summary.className = "cursor-pointer list-none px-3 py-2 flex items-center justify-between gap-3";
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
    ? `<div class="mt-2 text-[11px] text-zinc-400 uppercase tracking-wider">Fallback Options</div>
       <ul class="mt-1 text-xs text-zinc-300 space-y-1 list-disc pl-4">
         ${reroutes.map((r) => `<li>${r}</li>`).join("")}
       </ul>`
    : "";

  const tipMarkup = app.tip
    ? `<div class="mt-2 text-xs text-zinc-300"><span class="text-zinc-400">Tip:</span> ${app.tip}</div>`
    : "";

  body.innerHTML = `
    ${featureMarkup}
    <div class="mt-2 text-[11px] text-zinc-400 uppercase tracking-wider">Start Here</div>
    <ol class="mt-1 text-xs text-zinc-200/90 space-y-1 pl-4">
      ${steps.map((step, i) => asActionStep(step, i)).join("")}
    </ol>
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
  apps.forEach((app, index) => slot.appendChild(buildSidebarAppItem(app, index)));
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
    ...new Set(apps.flatMap((app) => normalizeArray(app.reroutes).map((v) => String(v).trim())).filter(Boolean)),
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

  if (routingSlot && summaryEl && summaryEl.textContent.trim() !== "—") routingSlot.style.display = "block";
}

function renderWhy(plan) {
  const overview = document.getElementById("why-overview");
  const assumptions = document.getElementById("why-assumptions");

  if (overview) overview.textContent = whyOverviewText(plan);

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
  const focus = planKey === "elite" ? "Maximum lift" : planKey === "accelerator" ? "Momentum + cleanup" : planKey === "growth" ? "Balanced lift" : "Low-friction activation";
  const strategy = String(plan?.routing_summary || "").trim() || "Low-friction reporting signals";

  setText('[data-hook="snap-focus"]', focus);
  setText('[data-hook="snap-strategy"]', strategy.length > 58 ? strategy.slice(0, 58) + "…" : strategy);
  setText('[data-hook="snap-execution"]', "Step-by-step activation");
  setText('[data-hook="snap-summary"]', routeSummaryText(plan));

  const signals = computeSignals(apps);
  const signalsEl = document.querySelector('[data-hook="scorecard-signals"]');
  if (signalsEl) signalsEl.innerHTML = signals.map((signal) => `<li>${signal}</li>`).join("");

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
  const features = normalizeArray(app.features);

  const websiteEl = document.querySelector('[data-hook="inst-website"]');
  const whyEl = document.querySelector('[data-hook="inst-why"]');
  const stepsEl = document.querySelector('[data-hook="inst-steps"]');
  const risksEl = document.querySelector('[data-hook="inst-risks"]');
  const fallbacksEl = document.querySelector('[data-hook="inst-fallbacks"]');
  const fallbackSummary = fallbacksEl?.closest("details")?.querySelector("summary");

  if (websiteEl) {
    websiteEl.href = app.app_url || "#";
    websiteEl.textContent = app.app_url || "—";
  }

  if (whyEl) {
    const featureText = features.length ? `This step focuses on: ${features.join(", ")}.` : `This step focuses on the recommended reporting or credit-building feature inside ${app.app_name}.`;
    whyEl.innerHTML = `
      <div class="space-y-2">
        <div><span class="text-[11px] uppercase tracking-wider text-zinc-400">Why This Step Matters</span></div>
        <p>${featureText}</p>
        <p>This helps you keep your CreditRoute organized around one action at a time.</p>
      </div>
    `;
  }

  if (stepsEl) {
    stepsEl.innerHTML = steps.map((step, i) => asActionStep(step, i)).join("");
  }

  if (risksEl) {
    const items = executionInsights.length
      ? executionInsights
      : [
          "Setup may take 10–20 minutes, depending on verification requirements.",
          "Some tools may require email, bank, identity, or account verification.",
          "Wait for confirmation before moving to the next tool.",
        ];
    risksEl.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
    const label = risksEl.closest("div")?.querySelector("div");
    if (label) label.textContent = "What to Expect";
  }

  if (fallbackSummary) fallbackSummary.textContent = "Fallback Options";
  if (fallbacksEl) fallbacksEl.innerHTML = fallbackOptionsHtml();

  const instructionRoot = document.getElementById("ss-instructions");
  if (instructionRoot && !document.getElementById("execution-clarity-blocks")) {
    const wrap = document.createElement("div");
    wrap.id = "execution-clarity-blocks";
    wrap.className = "space-y-2";
    wrap.innerHTML = `${timeRequiredHtml()}${checkpointHtml(app)}${completionHtml()}${moveForwardHtml()}`;
    instructionRoot.appendChild(wrap);
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
  const answers = safeParse(localStorage.getItem("ss_answers"), null) || safeParse(localStorage.getItem("stackscoreUserData"), null) || safeParse(localStorage.getItem("stackscore_answers"), null) || {};

  const res = await fetch("/.netlify/functions/generate-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ stackKey: planKey, answers }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `generate-plan failed (${res.status})`);
  return json;
}

async function initPlanHydration() {
  const planKey = String(getQueryParam("stackKey", "") || localStorage.getItem("ss_route_key") || sessionStorage.getItem("selectedPlanKey") || "growth").toLowerCase().trim();

  renderSelectedPlan(planKey);

  const cached = readCachedPlan();
  if (cached) renderPlan(cached, planKey);

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
    const fallbacksEl = document.querySelector('[data-hook="inst-fallbacks"]');
    const fallbackSummary = fallbacksEl?.closest("details")?.querySelector("summary");

    if (websiteEl) {
      websiteEl.href = ds.url || "#";
      websiteEl.textContent = ds.url || "—";
    }

    if (whyEl) {
      whyEl.innerHTML = `
        <div class="space-y-2">
          <div><span class="text-[11px] uppercase tracking-wider text-zinc-400">Why This Step Matters</span></div>
          <p>Follow the activation steps below and prioritize the key feature inside this app.</p>
          ${ds.tip ? `<p>Tip: ${ds.tip}</p>` : ""}
        </div>
      `;
    }

    if (stepsEl) {
      const steps = [ds.step1, ds.step2, ds.step3].filter(Boolean);
      stepsEl.innerHTML = steps.length ? steps.map((step, i) => asActionStep(step, i)).join("") : "<li>—</li>";
    }

    if (risksEl && !risksEl.children.length) {
      risksEl.innerHTML = `
        <li>Setup may take 10–20 minutes, depending on verification requirements.</li>
        <li>Some tools may require email, bank, identity, or account verification.</li>
        <li>Wait for confirmation before moving to the next tool.</li>
      `;
    }

    const label = risksEl?.closest("div")?.querySelector("div");
    if (label) label.textContent = "What to Expect";

    if (fallbackSummary) fallbackSummary.textContent = "Fallback Options";
    if (fallbacksEl) fallbacksEl.innerHTML = fallbackOptionsHtml();

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
    const targetSummary = [...document.querySelectorAll("#compose details.group summary")].find((s) => (s.dataset.app || "").toLowerCase() === lastApp.toLowerCase());
    if (targetSummary) {
      const parent = targetSummary.closest("details.group");
      if (parent) parent.open = true;
      applyData(targetSummary);
      applied = true;
    }
  }

  if (!applied) {
    const firstOpen = document.querySelector("#compose details.group[open] summary") || document.querySelector("#compose details.group summary");
    if (firstOpen) {
      const parent = firstOpen.closest("details.group");
      if (parent) parent.open = true;
      applyData(firstOpen);
    }
  }
}

function initLearnMore() {
  document.querySelectorAll("[data-learn-more]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const more = btn.parentElement?.nextElementSibling;
      if (more) more.classList.toggle("hidden");
    });
  });
}

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

document.addEventListener("DOMContentLoaded", async () => {
  initIconsAndAnim();
  initLocalProgress();
  initLearnMore();
  await initPlanHydration();
  initInstructionsBinder();
});