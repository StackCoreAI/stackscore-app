(() => {
  function safe(fn) {
    try {
      fn && fn();
    } catch {}
  }

  function getParam(name, fallback) {
    return new URLSearchParams(location.search).get(name) || fallback;
  }

  function tryParse(value) {
    if (typeof value !== "string") return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function readAnswersRaw() {
    return (
      tryParse(localStorage.getItem("stackscore_answers")) ||
      tryParse(localStorage.getItem("ss_answers")) ||
      tryParse(localStorage.getItem("stackscoreUserData")) ||
      {}
    );
  }

  function normalizeAnswers() {
    const raw = readAnswersRaw();
    return {
      living: raw.living || raw.housing || "",
      budget: raw.budget || "",
      timeline: raw.timeline || raw.goal || "",
      employment: raw.employment || "",
      rent_backdate: raw.rent_backdate || "",
      tools: raw.tools || "",
    };
  }

  function stableStringify(obj) {
    try {
      return JSON.stringify(obj, Object.keys(obj || {}).sort());
    } catch {
      return String(obj);
    }
  }

  function cacheKey(stackKey) {
    const key = String(stackKey || "growth").toLowerCase();
    const answers = normalizeAnswers();
    return `ss_plan_cache_v2:${key}:${stableStringify(answers)}`;
  }

  const CACHE_TTL = 1000 * 60 * 60 * 24 * 14;

  function readPlanCache(stackKey) {
    try {
      const raw = localStorage.getItem(cacheKey(stackKey));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (parsed._cachedAt && Date.now() - parsed._cachedAt > CACHE_TTL) {
        return null;
      }
      return parsed.payload || parsed;
    } catch {
      return null;
    }
  }

  function writePlanCache(stackKey, payload) {
    try {
      localStorage.setItem(
        cacheKey(stackKey),
        JSON.stringify({
          _cachedAt: Date.now(),
          payload,
        })
      );
    } catch {}
  }

  const PLAN_API = `${window.location.origin}/.netlify/functions/generate-plan`;

  async function fetchPlan(stackKey) {
    const res = await fetch(PLAN_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        stackKey,
        answers: normalizeAnswers(),
      }),
    });

    const text = await res.text();
    const contentType = (res.headers.get("content-type") || "").toLowerCase();

    if (!contentType.includes("application/json")) {
      console.error("Plan API returned non-JSON:", text.slice(0, 200));
      throw new Error("Plan API returned HTML/invalid JSON");
    }

    return JSON.parse(text);
  }

  async function getPlan(stackKey) {
    const cached = readPlanCache(stackKey);
    if (cached) return cached;

    const fresh = await fetchPlan(stackKey);
    writePlanCache(stackKey, fresh);
    return fresh;
  }

  function titleForPlanKey(planKey = "growth") {
    const k = String(planKey || "growth").toLowerCase().trim();
    if (k === "foundation") return "Foundation Credit Route";
    if (k === "growth") return "Growth Credit Route";
    if (k === "accelerator") return "Accelerator Credit Route";
    if (k === "elite") return "Elite Credit Route";
    return `${k.charAt(0).toUpperCase()}${k.slice(1)} Credit Route`;
  }

  function iconForApp(name = "") {
    const n = String(name || "").toLowerCase();
    if (n.includes("boost")) return "zap";
    if (n.includes("kikoff")) return "credit-card";
    if (n.includes("kovo")) return "trending-up";
    if (n.includes("rent") || n.includes("boom") || n.includes("pinata") || n.includes("piñata")) return "home";
    if (n.includes("dispute") || n.includes("dovly")) return "shield-check";
    if (n.includes("tomo") || n.includes("extra") || n.includes("grain")) return "wallet";
    return "star";
  }

  function stepsFor(appName, app) {
    const explicit = [app?.step1, app?.step2, app?.step3]
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    if (explicit.length) return explicit;

    const n = String(appName || "").toLowerCase();

    if (n.includes("experian") && n.includes("boost")) {
      return [
        "Create your Experian account and enter the Boost setup flow.",
        "Connect the bank account that pays your eligible utility and streaming bills.",
        "Select the bills you want Boost to count and confirm Boost is active.",
      ];
    }

    if (n.includes("grow credit")) {
      return [
        "Open your Grow Credit account and complete the starter setup.",
        "Link the eligible subscription payments you want routed through Grow Credit.",
        "Turn on reporting so those subscription payments begin building history.",
      ];
    }

    if (n.includes("grain")) {
      return [
        "Create your Grain account and complete identity setup.",
        "Link the eligible bill or payment source used for reporting.",
        "Turn on the reporting feature tied to that bill so it begins contributing to your route.",
      ];
    }

    if (n.includes("kikoff")) {
      return [
        "Open your Kikoff account and activate the credit builder line.",
        "Enable autopay so the monthly payment reports consistently.",
        "Keep utilization low and leave the account active so the tradeline stays healthy.",
      ];
    }

    if (n.includes("kovo")) {
      return [
        "Create your Kovo account and select the credit-building product you want reported.",
        "Complete payment setup so the installment trade can begin reporting properly.",
        "Keep the account in good standing with on-time payments each cycle.",
      ];
    }

    if (n.includes("self")) {
      return [
        "Open your Self account and choose the Credit Builder Loan that fits your budget.",
        "Fund the first payment and enable autopay for on-time reporting.",
        "Keep the loan active until reporting history begins compounding.",
      ];
    }

    if (n.includes("rent") || n.includes("boom") || n.includes("rentreporter") || n.includes("pinata") || n.includes("piñata")) {
      return [
        "Create your rent reporting account and complete the verification setup.",
        "Submit landlord, lease, or payment details for current rent history.",
        "Turn on rent reporting and add backdated rent history if eligible.",
      ];
    }

    if (n.includes("dovly")) {
      return [
        "Create your Dovly account and import your credit profile.",
        "Run the scan so Dovly can identify negative items and dispute opportunities.",
        "Turn on the automated dispute workflow and monitor for the first update cycle.",
      ];
    }

    if (n.includes("dispute")) {
      return [
        "Import your credit report details into the dispute tool.",
        "Generate the first dispute round for qualified items.",
        "Send the first dispute set and track responses before starting the next round.",
      ];
    }

    if (n.includes("tomo")) {
      return [
        "Open your Tomo account and complete the secured card setup.",
        "Link your bank account and fund the secured component if required.",
        "Enable autopay and keep card usage low so the tradeline reports cleanly.",
      ];
    }

    if (n.includes("extra")) {
      return [
        "Create your Extra account and complete the debit-to-credit setup.",
        "Link the bank account Extra uses to support card activity.",
        "Use the card lightly and keep the reporting feature active so the tradeline stays strong.",
      ];
    }

    return [
      "Create your account and complete the initial setup flow.",
      "Connect the payment source, bank account, or verification details required for reporting.",
      "Turn on the specific reporting or credit-building feature inside the app.",
    ];
  }

  function normalizeApps(plan) {
    if (Array.isArray(plan?.apps) && plan.apps.length) {
      return plan.apps.slice(0, 5).map(normalizeApp);
    }

    let plans = [];
    if (Array.isArray(plan?.plans)) plans = plan.plans;
    else if (plan?.plan) plans = [plan.plan];
    else {
      const parsed =
        tryParse(plan?.result) ||
        tryParse(plan?.output) ||
        tryParse(plan?.plan_json) ||
        tryParse(typeof plan === "string" ? plan : null);

      if (Array.isArray(parsed?.plans)) plans = parsed.plans;
      else if (parsed?.plan) plans = [parsed.plan];
    }

    const seen = new Set();
    const out = [];

    function pushApp(raw) {
      const name = String(raw?.app_name || raw?.name || "").trim();
      if (!name || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      out.push(normalizeApp(raw));
    }

    if (plans[0]?.apps) {
      (plans[0].apps || []).forEach(pushApp);
    }

    for (let i = 1; i < plans.length && out.length < 5; i++) {
      (plans[i].apps || []).forEach(pushApp);
    }

    const fallback = [
      { app_name: "Experian Boost", app_url: "https://www.experian.com/boost" },
      { app_name: "Kikoff", app_url: "https://www.kikoff.com/" },
      { app_name: "Kovo", app_url: "https://www.kovo.com/" },
    ];

    for (const item of fallback) {
      if (out.length >= 3) break;
      if (!seen.has(item.app_name.toLowerCase())) out.push(normalizeApp(item));
    }

    return out.slice(0, 5);
  }

  function normalizeApp(app) {
    return {
      app_name: app?.app_name || app?.name || "App",
      app_url: app?.app_url || app?.url || app?.website || "",
      features: Array.isArray(app?.features) ? app.features : [],
      step1: app?.step1 || "",
      step2: app?.step2 || "",
      step3: app?.step3 || "",
      tip: app?.tip || "",
      execution_insights: Array.isArray(app?.execution_insights) ? app.execution_insights : [],
      reroutes: Array.isArray(app?.reroutes) ? app.reroutes : [],
    };
  }

  function titleCase(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/(^|\s)\S/g, (m) => m.toUpperCase());
  }

  function metricsForPlan(planKey) {
    const k = String(planKey || "growth").toLowerCase();
    if (k === "foundation") {
      return { route: "Foundation", impact: "+10–30 pts", timeline: "30–60 days" };
    }
    if (k === "growth") {
      return { route: "Growth", impact: "+40–70 pts", timeline: "45–75 days" };
    }
    if (k === "accelerator") {
      return { route: "Accelerator", impact: "+80–100 pts", timeline: "45–60 days" };
    }
    if (k === "elite") {
      return { route: "Elite", impact: "100+ pts", timeline: "30–60 days" };
    }
    return { route: titleCase(k), impact: "+40–70 pts", timeline: "45–75 days" };
  }

  function computeSignals(apps = []) {
    const names = apps.map((a) => String(a?.app_name || "").toLowerCase()).join(" | ");
    const signals = [];

    signals.push("✓ Route resilience (reroutes included)");
    if (/rent|boom|rentreport|pinata|piñata/.test(names)) signals.unshift("✓ Rent reporting");
    if (/dovly|dispute/.test(names)) signals.unshift("✓ Dispute optimization");
    if (/boost|experian|utility|grain|grow credit/.test(names)) signals.unshift("✓ Utilities reporting");
    if (/kikoff|self|kovo|installment/.test(names)) signals.unshift("✓ Installment builder");
    if (/tomo|extra|tradeline/.test(names)) signals.unshift("✓ Tradeline leverage");

    return Array.from(new Set(signals)).slice(0, 4);
  }

  function renderScorecard(planKey, apps) {
    const root = document.getElementById("route-scorecard");
    if (!root) return;

    const routeEl = root.querySelector('[data-hook="scorecard-route"]');
    const impactEl = root.querySelector('[data-hook="scorecard-impact"]');
    const timelineEl = root.querySelector('[data-hook="scorecard-timeline"]');
    const signalsEl = root.querySelector('[data-hook="scorecard-signals"]');

    const metrics = metricsForPlan(planKey);
    const signals = computeSignals(apps);

    if (routeEl) routeEl.textContent = metrics.route;
    if (impactEl) impactEl.textContent = metrics.impact;
    if (timelineEl) timelineEl.textContent = metrics.timeline;
    if (signalsEl) signalsEl.innerHTML = signals.map((s) => `<li>${s}</li>`).join("");
  }

  function readRoutingContext() {
    const answers = readAnswersRaw() || {};
    return {
      living: String(answers.living || answers.housing || "").toLowerCase(),
      budget: String(answers.budget || "").toLowerCase(),
      timeline: String(answers.timeline || answers.goal || "").toLowerCase(),
      employment: String(answers.employment || "").toLowerCase(),
      tools: String(answers.tools || "").toLowerCase(),
    };
  }

  function snapshotCopy(planKey, apps) {
    const k = String(planKey || "growth").toLowerCase();
    const ctx = readRoutingContext();
    const cleanSignals = computeSignals(apps).map((s) => s.replace(/^✓\s*/, ""));

    let focus = "Balanced lift";
    if (ctx.timeline.includes("30") || ctx.timeline.includes("fast")) focus = "Fast lift";
    if (ctx.timeline.includes("90")) focus = "Near-term lift";
    if (k === "elite") focus = "Maximum lift";
    if (k === "foundation") focus = "Low-friction lift";

    let strategy = "Low-friction reporting signals";
    if (ctx.living.includes("rent")) strategy = "Rent reporting optimization";
    if (k === "accelerator") strategy = "Momentum + cleanup signals";
    if (k === "elite") strategy = "Maximum coverage signals";

    let execution = "Step-by-step activation";
    if (ctx.tools.includes("auto")) execution = "Automation-first execution";
    if (ctx.tools.includes("manual")) execution = "Manual control execution";

    const summary = `Optimized for ${focus.toLowerCase()} using ${strategy.toLowerCase()}. Signals activated include ${cleanSignals.slice(0, 3).join(", ")}${cleanSignals.length > 3 ? ", and more" : ""}. Reroutes ensure the route remains reliable if availability changes.`;

    return { focus, strategy, execution, summary };
  }

  function renderSnapshot(planKey, apps) {
    const root = document.getElementById("route-snapshot");
    if (!root) return;

    const focusEl = root.querySelector('[data-hook="snap-focus"]');
    const strategyEl = root.querySelector('[data-hook="snap-strategy"]');
    const executionEl = root.querySelector('[data-hook="snap-execution"]');
    const summaryEl = root.querySelector('[data-hook="snap-summary"]');

    const copy = snapshotCopy(planKey, apps);

    if (focusEl) focusEl.textContent = copy.focus;
    if (strategyEl) strategyEl.textContent = copy.strategy;
    if (executionEl) executionEl.textContent = copy.execution;
    if (summaryEl) summaryEl.textContent = copy.summary;
  }

  function confidenceMeta(planKey, apps) {
    const answers = readAnswersRaw() || {};
    const hasLiving = !!(answers.living || answers.housing);
    const hasBudget = !!answers.budget;
    const hasTimeline = !!(answers.timeline || answers.goal);
    const hasEmployment = !!answers.employment;

    const answered = [hasLiving, hasBudget, hasTimeline, hasEmployment].filter(Boolean).length;
    const signals = computeSignals(apps).length;

    let score = 40;
    score += answered * 12;
    score += Math.min(12, signals * 3);

    const k = String(planKey || "growth").toLowerCase();
    if (k === "growth") score += 4;
    if (k === "elite") score += 2;

    score = Math.max(35, Math.min(95, score));

    let label = "Medium";
    if (score >= 80) label = "High";
    if (score >= 90) label = "Very High";

    const note =
      score >= 90
        ? "Very strong match based on your inputs and reporting signals."
        : score >= 80
        ? "Strong match based on your inputs and available reporting signals."
        : "Good match — refine your inputs for the strongest personalization.";

    return { score, label, note };
  }

  function renderConfidence(planKey, apps) {
    const labelEl = document.querySelector('[data-hook="scorecard-confidence"]');
    const barEl = document.querySelector('[data-hook="scorecard-confidence-bar"]');
    const noteEl = document.querySelector('[data-hook="scorecard-confidence-note"]');

    if (!labelEl || !barEl || !noteEl) return;

    const meta = confidenceMeta(planKey, apps);
    labelEl.textContent = meta.label;
    barEl.style.width = `${meta.score}%`;
    noteEl.textContent = meta.note;
  }

  function renderRouteStamp(planKey, apps) {
    const root = document.getElementById("route-stamp");
    if (!root) return;

    const answers = readAnswersRaw() || {};
    const living = answers.living || answers.housing || "Unknown";
    const budget = answers.budget || "—";
    const timeline = answers.timeline || answers.goal || "—";
    const signals = computeSignals(apps);
    const style = signals.includes("✓ Installment builder")
      ? "Builder"
      : signals.includes("✓ Tradeline leverage")
      ? "Tradeline"
      : "Balanced";

    const confidence = confidenceMeta(planKey, apps);

    const idEl = root.querySelector('[data-hook="stamp-id"]');
    const timeEl = root.querySelector('[data-hook="stamp-time"]');
    const confidenceEl = root.querySelector('[data-hook="stamp-confidence"]');
    const livingEl = root.querySelector('[data-hook="stamp-living"]');
    const budgetEl = root.querySelector('[data-hook="stamp-budget"]');
    const timelineEl = root.querySelector('[data-hook="stamp-timeline"]');
    const styleEl = root.querySelector('[data-hook="stamp-style"]');

    const stampId = `SS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const stampTime = new Date().toLocaleString();

    if (idEl) idEl.textContent = stampId;
    if (timeEl) timeEl.textContent = stampTime;
    if (confidenceEl) confidenceEl.textContent = confidence.label;
    if (livingEl) livingEl.textContent = `Living: ${living}`;
    if (budgetEl) budgetEl.textContent = `Budget: ${budget}`;
    if (timelineEl) timelineEl.textContent = `Timeline: ${timeline}`;
    if (styleEl) styleEl.textContent = `Style: ${style}`;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function renderWhy(plan) {
    const why =
      plan?.why_overview ||
      plan?.why ||
      plan?.overview ||
      plan?.reasoning ||
      plan?.explanation ||
      plan?.narrative ||
      "";

    const assumptions =
      plan?.assumptions ||
      plan?.why_assumptions ||
      plan?.notes ||
      plan?.bullets ||
      [];

    if (why) setText("why-overview", String(why));

    const assumptionsEl = document.getElementById("why-assumptions");
    if (assumptionsEl && Array.isArray(assumptions) && assumptions.length) {
      assumptionsEl.style.display = "block";
      assumptionsEl.innerHTML = assumptions
        .slice(0, 10)
        .map((item) => `<li>• ${String(item)}</li>`)
        .join("");
    }
  }

  function renderRouting(plan) {
    const root = document.getElementById("routing-slot");
    if (!root) return;

    const summaryEl = root.querySelector('[data-hook="routing-summary"]');
    const stepsEl = root.querySelector('[data-hook="route-steps"]');
    const reroutesWrap = root.querySelector('[data-hook="reroutes"]');
    const reroutesList = root.querySelector(".routing-reroutes-list");

    const summary =
      plan?.routing_summary ||
      plan?.route_summary ||
      plan?.summary ||
      "";

    const steps =
      plan?.route_steps ||
      plan?.routing_steps ||
      plan?.steps ||
      [];

    const reroutes =
      plan?.reroutes ||
      plan?.fallbacks ||
      [];

    if (summary && String(summary).trim()) {
      root.style.display = "block";
      root.classList.add("show");
      if (summaryEl) summaryEl.textContent = String(summary);
    }

    if (stepsEl && Array.isArray(steps) && steps.length) {
      stepsEl.innerHTML = steps.slice(0, 8).map((step) => `<li>• ${String(step)}</li>`).join("");
      root.style.display = "block";
      root.classList.add("show");
    }

    if (reroutesWrap && reroutesList && Array.isArray(reroutes) && reroutes.length) {
      reroutesWrap.style.display = "block";
      reroutesList.innerHTML = reroutes.slice(0, 8).map((item) => `<li>• ${String(item)}</li>`).join("");
      root.style.display = "block";
      root.classList.add("show");
    }
  }

  function updateInstructionPanel(summaryEl) {
    if (!summaryEl) return;

    const ds = summaryEl.dataset || {};

    const websiteEl = document.querySelector('[data-hook="inst-website"]');
    const whyEl = document.querySelector('[data-hook="inst-why"]');
    const stepsEl = document.querySelector('[data-hook="inst-steps"]');
    const insightsEl = document.querySelector('[data-hook="inst-risks"]');
    const reroutesEl = document.querySelector('[data-hook="inst-fallbacks"]');

    const url = ds.url || "";
    const step1 = ds.step1 || "";
    const step2 = ds.step2 || "";
    const step3 = ds.step3 || "";
    const tip = ds.tip || "";
    const features = tryParse(ds.features) || [];
    const executionInsights = tryParse(ds.executionInsights) || [];
    const reroutes = tryParse(ds.reroutes) || [];

    if (websiteEl) {
      websiteEl.textContent = url || "—";
      websiteEl.href = url || "#";
    }

    if (whyEl) {
      const featureSentence =
        Array.isArray(features) && features.length
          ? `Use these features in ${ds.app || "this app"}: ${features.join(", ")}.`
          : "Follow the activation steps below and prioritize the key reporting feature inside this app.";
      whyEl.textContent = tip ? `${featureSentence} Tip: ${tip}` : featureSentence;
    }

    if (stepsEl) {
      const steps = [step1, step2, step3].filter(Boolean);
      stepsEl.innerHTML = (steps.length ? steps : ["—"])
        .map((step) => `<li>${String(step)}</li>`)
        .join("");
    }

    if (insightsEl) {
      const items =
        Array.isArray(executionInsights) && executionInsights.length
          ? executionInsights
          : [
              "Most reporting updates show within 7–14 days, depending on the tool and bureau.",
              "Autopay improves consistency and reduces missed-payment risk.",
              "If verification is required, complete it early to avoid delays.",
            ];

      insightsEl.innerHTML = items.map((item) => `<li>${String(item)}</li>`).join("");
    }

    if (reroutesEl) {
      const base = [
        "This route includes alternate tools that preserve similar reporting signals if availability changes.",
      ];

      const items =
        Array.isArray(reroutes) && reroutes.length ? base.concat(reroutes) : base;

      reroutesEl.innerHTML = items.map((item) => `<li>${String(item)}</li>`).join("");
    }
  }

  function renderSidebar(apps) {
    const slot = document.getElementById("sidebar-slot");
    if (!slot) return;

    slot.innerHTML = apps
      .map((app, index) => {
        const appName = app.app_name || app.name || "App";
        const appUrl = app.app_url || app.url || "";
        const [step1, step2, step3] = stepsFor(appName, app);
        const features = Array.isArray(app.features) ? app.features : [];
        const reroutes = Array.isArray(app.reroutes) ? app.reroutes : [];
        const executionInsights = Array.isArray(app.execution_insights)
          ? app.execution_insights
          : [];
        const tip = app.tip || "";

        return `
<details class="group"${index === 0 ? " open" : ""}>
  <summary
    class="w-full flex items-center justify-between px-3 py-2 bg-lime-600 text-black rounded-md hover:bg-lime-500 transition-colors text-xs font-medium cursor-pointer"
    data-app="${String(appName).replace(/"/g, "&quot;")}"
    data-url="${String(appUrl).replace(/"/g, "&quot;")}"
    data-step1="${String(step1).replace(/"/g, "&quot;")}"
    data-step2="${String(step2).replace(/"/g, "&quot;")}"
    data-step3="${String(step3).replace(/"/g, "&quot;")}"
    data-tip="${String(tip).replace(/"/g, "&quot;")}"
    data-features='${JSON.stringify(features)}'
    data-reroutes='${JSON.stringify(reroutes)}'
    data-execution-insights='${JSON.stringify(executionInsights)}'
  >
    <span class="flex items-center space-x-1.5">
      <i data-lucide="${iconForApp(appName)}" class="w-3.5 h-3.5"></i>
      <span>${appName}</span>
    </span>
    <i data-lucide="chevron-down" class="w-3 h-3 chev"></i>
  </summary>

  <ul class="mt-3 space-y-2 px-3 pb-3">
    <li class="flex items-center justify-between text-xs text-zinc-300">
      <span>${step1}</span>
      <input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600">
    </li>
    <li class="flex items-center justify-between text-xs text-zinc-300">
      <span>${step2}</span>
      <input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600">
    </li>
    <li class="flex items-center justify-between text-xs text-zinc-300">
      <span>${step3}</span>
      <input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600">
    </li>
  </ul>
</details>`;
      })
      .join("");

    safe(() => window.lucide && lucide.createIcons());

    const firstSummary = document.querySelector("#compose details.group summary");
    if (firstSummary) updateInstructionPanel(firstSummary);

    document.querySelectorAll("#compose details.group").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (details.open) {
          document.querySelectorAll("#compose details.group").forEach((other) => {
            if (other !== details) other.open = false;
          });
          updateInstructionPanel(details.querySelector("summary"));
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    safe(() => window.lucide && lucide.createIcons());
    document.querySelectorAll("[data-anim]").forEach((el, i) => {
      setTimeout(() => el.classList.add("show"), i * 150);
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    const prefix = `ss:${getParam("t", "anon")}:`;
    document.querySelectorAll('input[type="checkbox"]').forEach((cb, index) => {
      const key = `${prefix}cb:${index}`;
      cb.checked = localStorage.getItem(key) === "1";
      cb.addEventListener("change", () => {
        localStorage.setItem(key, cb.checked ? "1" : "0");
      });
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    const openMap = new WeakMap();

    const openAll = () =>
      document.querySelectorAll("details").forEach((details) => {
        openMap.set(details, details.open);
        details.open = true;
      });

    const restoreAll = () =>
      document.querySelectorAll("details").forEach((details) => {
        const prior = openMap.get(details);
        if (prior !== undefined) details.open = prior;
      });

    document.getElementById("print-plan")?.addEventListener("click", () => {
      openAll();
      setTimeout(() => window.print(), 50);
    });

    window.addEventListener("beforeprint", openAll);
    window.addEventListener("afterprint", restoreAll);
  });

  async function renderComposedGuide() {
    const sidebar = document.getElementById("sidebar-slot");
    if (!sidebar) return;

    const stackKey = getParam("stackKey", "growth");
    const plan = await getPlan(stackKey);
    const apps = normalizeApps(plan);

    renderWhy(plan);
    renderRouting(plan);
    renderSnapshot(stackKey, apps);
    renderScorecard(stackKey, apps);
    renderConfidence(stackKey, apps);
    renderRouteStamp(stackKey, apps);
    renderSidebar(apps);

    const selectedPlanEl = document.getElementById("selected-plan-title");
    if (selectedPlanEl) {
      selectedPlanEl.textContent = titleForPlanKey(stackKey);
    }

    try {
      sessionStorage.setItem("ss_plan", JSON.stringify(plan));
      localStorage.setItem("ss_plan", JSON.stringify(plan));
      localStorage.setItem("ss_route_key", String(stackKey).toLowerCase());
      sessionStorage.setItem("selectedPlanKey", String(stackKey).toLowerCase());
      sessionStorage.setItem("ss_selected", JSON.stringify(String(stackKey).toLowerCase()));
    } catch {}
  }

  window.composeGuide = async function composeGuide(stackKey = "growth") {
    try {
      const plan = await getPlan(stackKey);
      const apps = normalizeApps(plan);

      renderWhy(plan);
      renderRouting(plan);
      renderSnapshot(stackKey, apps);
      renderScorecard(stackKey, apps);
      renderConfidence(stackKey, apps);
      renderRouteStamp(stackKey, apps);
      renderSidebar(apps);

      const selectedPlanEl = document.getElementById("selected-plan-title");
      if (selectedPlanEl) {
        selectedPlanEl.textContent = titleForPlanKey(stackKey);
      }
    } catch (err) {
      console.error("composeGuide → plan fetch failed:", err);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderComposedGuide().catch((err) => {
      console.error("plan.runtime → render failed:", err);
    });
  });
})();
//# sourceMappingURL=plan.runtime.js.map