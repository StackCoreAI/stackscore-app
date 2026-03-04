// scripts/plan.runtime.src.js
(() => {
  // ---------- Small utils ----------
  function safe(fn) { try { fn && fn(); } catch (_) {} }
  function getParam(name, fallback) {
    const u = new URLSearchParams(location.search);
    return u.get(name) || fallback;
  }
  function tryParse(v){ if(typeof v!=="string") return null; try{ return JSON.parse(v);}catch{ return null; } }

  // Prefer canonical answers; support legacy keys.
  function readAnswersRaw() {
    return (
      // ✅ canonical key used by plan.runtime.min.js in prod builds
      tryParse(localStorage.getItem("stackscore_answers")) ||
      // ✅ some flows store under this key
      tryParse(localStorage.getItem("stackscore_answers")) ||
      // ✅ newer SPA keys
      tryParse(localStorage.getItem("ss_answers")) ||
      tryParse(localStorage.getItem("stackscoreUserData")) ||
      // ✅ legacy
      tryParse(localStorage.getItem("stackscore_answers")) ||
      {}
    );
  }

  // Read onboarding answers (no PII). This is what generate-plan expects.
  function readAnswers() {
    const a = readAnswersRaw();
    return {
      living: a.living || a.housing || "",
      budget: a.budget || "",
      timeline: a.timeline || a.goal || "",
      employment: a.employment || "",
      rent_backdate: a.rent_backdate || "",
    };
  }

  // ---------- Cache layer (90%+ OpenAI call reduction) ----------
  function stableStringify(obj) {
    try { return JSON.stringify(obj, Object.keys(obj || {}).sort()); }
    catch { return String(obj); }
  }

  function cacheKey(stackKey) {
    const k = String(stackKey || "growth").toLowerCase();
    const answers = readAnswers();
    const hash = stableStringify(answers);
    return `ss_plan_cache_v1:${k}:${hash}`;
  }

  const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

  function readCachedPlan(stackKey) {
    try {
      const raw = localStorage.getItem(cacheKey(stackKey));
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;

      if (obj._cachedAt && Date.now() - obj._cachedAt > CACHE_TTL_MS) return null;
      return obj.payload || obj;
    } catch {
      return null;
    }
  }

  function writeCachedPlan(stackKey, payload) {
    try {
      localStorage.setItem(cacheKey(stackKey), JSON.stringify({ _cachedAt: Date.now(), payload }));
    } catch {}
  }

  // ---------- Netlify Function endpoint ----------
  const PLAN_FN_URL = `${window.location.origin}/.netlify/functions/generate-plan`;

  async function fetchPlanFromApi(stackKey){
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

  async function fetchPlanWithCache(stackKey) {
    const cached = readCachedPlan(stackKey);
    if (cached) return cached;

    const fresh = await fetchPlanFromApi(stackKey);
    writeCachedPlan(stackKey, fresh);
    return fresh;
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

  // ---------- Normalize plan → 3–5 apps ----------
  function deriveApps(data){
    if (Array.isArray(data?.apps) && data.apps.length) return data.apps.slice(0,5);

    let plans=[];
    if (Array.isArray(data?.plans)) plans=data.plans;
    else if (data?.plan) plans=[data.plan];
    else {
      const nest=tryParse(data?.result)||tryParse(data?.output)||tryParse(data?.plan_json)||tryParse(data);
      if (Array.isArray(nest?.plans)) plans=nest.plans;
      else if (nest?.plan) plans=[nest.plan];
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

  // ---------- Guide renderers ----------
  function setText(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
  }

  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
  }

  function renderWhy(payload) {
    const why =
      payload?.why_overview ||
      payload?.why ||
      payload?.overview ||
      payload?.reasoning ||
      payload?.explanation ||
      payload?.narrative ||
      "";

    const assumptions =
      payload?.assumptions ||
      payload?.why_assumptions ||
      payload?.notes ||
      payload?.bullets ||
      [];

    if (why) setText("why-overview", String(why));

    const ul = document.getElementById("why-assumptions");
    if (ul && Array.isArray(assumptions) && assumptions.length) {
      ul.style.display = "block";
      ul.innerHTML = assumptions.slice(0, 10).map((t) => `<li>• ${String(t)}</li>`).join("");
    }
  }

  function renderRouting(payload) {
    const slot = document.getElementById("routing-slot");
    if (!slot) return;

    const summaryEl = slot.querySelector('[data-hook="routing-summary"]');
    const stepsEl = slot.querySelector('[data-hook="route-steps"]');
    const reroutesWrap = slot.querySelector('[data-hook="reroutes"]');
    const reroutesList = slot.querySelector(".routing-reroutes-list");

    const summary =
      payload?.routing_summary ||
      payload?.route_summary ||
      payload?.summary ||
      "";

    const steps =
      payload?.route_steps ||
      payload?.routing_steps ||
      payload?.steps ||
      [];

    const reroutes =
      payload?.reroutes ||
      payload?.fallbacks ||
      [];

    const hasAny =
      (summary && String(summary).trim()) ||
      (Array.isArray(steps) && steps.length) ||
      (Array.isArray(reroutes) && reroutes.length);

    if (!hasAny) return;

    slot.style.display = "block";
    slot.classList.add("show");

    if (summaryEl && summary) summaryEl.textContent = String(summary);

    if (stepsEl && Array.isArray(steps) && steps.length) {
      stepsEl.innerHTML = steps.slice(0, 8).map((s) => `<li>• ${String(s)}</li>`).join("");
    }

    if (reroutesWrap && reroutesList && Array.isArray(reroutes) && reroutes.length) {
      reroutesWrap.style.display = "block";
      reroutesList.innerHTML = reroutes.slice(0, 8).map((r) => `<li>• ${String(r)}</li>`).join("");
    }
  }

  // Fill the read-only instruction panel (82.html has data-hook slots)
  function applyInstruction(summaryEl) {
    if (!summaryEl) return;
    const d = summaryEl.dataset || {};

    const websiteLink = document.querySelector('[data-hook="inst-website"]');
    const whyEl = document.querySelector('[data-hook="inst-why"]');
    const stepsUl = document.querySelector('[data-hook="inst-steps"]');
    const risksUl = document.querySelector('[data-hook="inst-risks"]');
    const fallbacksUl = document.querySelector('[data-hook="inst-fallbacks"]');

    const url = d.url || "";
    const step1 = d.step1 || "";
    const step2 = d.step2 || "";
    const step3 = d.step3 || "";

    if (websiteLink) {
      websiteLink.textContent = url || "—";
      websiteLink.href = url || "#";
    }

    if (whyEl) {
      whyEl.textContent = d.tip || "Follow the steps below to activate the key feature(s) for your route.";
    }

    if (stepsUl) {
      const items = [step1, step2, step3].filter(Boolean);
      stepsUl.innerHTML = (items.length ? items : ["—"])
        .map((x) => `<li>${String(x)}</li>`)
        .join("");
    }

    // Execution Insights (premium, not cautionary)
if (risksUl) {
  const insights = [
    "Most reporting updates show within 7–14 days (varies by tool and bureau).",
    "Autopay improves consistency and reduces missed-payment risk.",
    "If verification is required (landlord/utility), complete it early to avoid delays."
  ];
  risksUl.innerHTML = insights.map((x) => `<li>${x}</li>`).join("");
}

// Route Flexibility (intentional alternates, not “substitutes”)
if (fallbacksUl) {
  const routeFlexText = [
    "This route includes alternate tools that preserve similar reporting signals if availability changes."
  ];

  // If the plan returns fallbacks on the app object, use them.
  // Accept several possible shapes so we don’t depend on one schema.
  const fallbacks =
    tryParse(d.fallbacks) ||
    tryParse(d.reroutes) ||
    [];

  if (Array.isArray(fallbacks) && fallbacks.length) {
    fallbacksUl.innerHTML =
      routeFlexText.map((x) => `<li>${x}</li>`).join("") +
      fallbacks.slice(0, 6).map((f) => `<li>${String(f)}</li>`).join("");
  } else {
    // no structured reroutes for this app → still provide the premium message
    fallbacksUl.innerHTML = routeFlexText.map((x) => `<li>${x}</li>`).join("");
  }
}

  // ---------- Render into Sidebar slot ----------
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

    const firstSummary = document.querySelector("#compose details.group summary");
    if (firstSummary) applyInstruction(firstSummary);

    document.querySelectorAll("#compose details.group").forEach(el=>{
      el.addEventListener("toggle",()=>{ if(!el.open) return;
        document.querySelectorAll("#compose details.group").forEach(x=>{ if(x!==el) x.open=false; });
        applyInstruction(el.querySelector("summary"));
      });
    });
  }

  // ---------- Icons + entrance anim ----------
  document.addEventListener("DOMContentLoaded", () => {
    safe(() => window.lucide && lucide.createIcons());
    document.querySelectorAll("[data-anim]").forEach((el,i)=> setTimeout(()=> el.classList.add("show"), i*150));
  });

  // ---------- Local progress ----------
  document.addEventListener("DOMContentLoaded", () => {
    const ns = `ss:${getParam("t","anon")}:`;
    document.querySelectorAll('input[type="checkbox"]').forEach((cb,i)=>{
      const key = `${ns}cb:${i}`;
      cb.checked = localStorage.getItem(key)==="1";
      cb.addEventListener("change", ()=> localStorage.setItem(key, cb.checked?"1":"0"));
    });
  });

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
    if(!slot) return;

    if (slot.children.length>0){
      safe(()=>window.lucide&&lucide.createIcons());
      return;
    }

    const stackKey=getParam("stackKey","growth");
    const payload=await fetchPlanWithCache(stackKey);

    renderWhy(payload);
    renderRouting(payload);

    const apps=deriveApps(payload);
    renderAppsIntoSlot(apps);
  }

  window.composeGuide = async function(stackKey="growth"){
    try {
      const payload = await fetchPlanWithCache(stackKey);
      renderWhy(payload);
      renderRouting(payload);
      const apps = deriveApps(payload);
      renderAppsIntoSlot(apps);
    } catch (err) {
      console.error("composeGuide → plan fetch failed:", err);
    }
  };

  document.addEventListener("DOMContentLoaded", ()=> {
    renderForCurrentPage().catch(err=>console.error("plan.runtime → render failed:", err));
  });
})();