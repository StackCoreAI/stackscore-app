(() => {
  // Helpers
  function safe(fn) { try { fn && fn(); } catch (_) {} }
  function getParam(name, fallback) { const u = new URLSearchParams(location.search); return u.get(name) || fallback; }
  function tryParse(v){ if(typeof v!=="string") return null; try{ return JSON.parse(v);}catch{ return null; } }
  function iconFor(n=""){ n=n.toLowerCase();
    if(n.includes("boost")) return "zap";
    if(n.includes("kikoff")) return "credit-card";
    if(n.includes("kovo"))   return "trending-up";
    if(n.includes("rent"))   return "home";
    if(n.includes("dispute"))return "shield-check";
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

  // Icons + entrance anim
  document.addEventListener("DOMContentLoaded", () => {
    safe(() => window.lucide && lucide.createIcons());
    document.querySelectorAll("[data-anim]").forEach((el,i)=> setTimeout(()=> el.classList.add("show"), i*150));
  });

  // Local progress
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

  // Instructions binder
  window.initInstructions = function initInstructions(){
    const lastKey = `ss:${getParam("t","anon")}:lastApp`;
    const form = document.querySelector("#instructions form") || document.querySelector("main#instructions form");
    if (!form) return;
    const url=form.querySelector('input[type="url"]'),
          s1 =form.querySelector('input[placeholder*="First"]'),
          s2 =form.querySelector('input[placeholder*="Second"]'),
          s3 =form.querySelector('input[placeholder*="Third"]'),
          tip=form.querySelector("textarea");
    function apply(sum){ if(!sum) return; const d=sum.dataset||{};
      if(url) url.value=d.url||""; if(s1) s1.value=d.step1||""; if(s2) s2.value=d.step2||""; if(s3) s3.value=d.step3||"";
      if(tip) tip.value=d.tip||""; if(d.app) localStorage.setItem(lastKey,d.app);
    }
    // reset listeners
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
    if(last){ const sum=[...document.querySelectorAll("#compose details.group summary")].find(s=>(s.dataset.app||"").toLowerCase()===last.toLowerCase());
      if(sum){ const det=sum.closest("details.group"); if(det) det.open=true; apply(sum); restored=true; }
    }
    if(!restored){ const sum=document.querySelector("#compose details.group[open] summary")||document.querySelector("#compose details.group summary"); if(sum) apply(sum); }
  };
  document.addEventListener("DOMContentLoaded", ()=> safe(()=> window.initInstructions?.()));

  // Print helpers
  document.addEventListener("DOMContentLoaded", ()=>{
    const state=new WeakMap();
    const expand=()=> document.querySelectorAll("details").forEach(d=>{ state.set(d,d.open); d.open=true; });
    const restore=()=> document.querySelectorAll("details").forEach(d=>{ const v=state.get(d); if(v!==void 0) d.open=v; });
    document.getElementById("print-plan")?.addEventListener("click", ()=>{ expand(); setTimeout(()=>window.print(),50); });
    window.addEventListener("beforeprint", expand);
    window.addEventListener("afterprint", restore);
  });

  // Sidebar fetch + render (SSR-safe)
  document.addEventListener("DOMContentLoaded", async ()=>{
    try{
      const slot=document.getElementById("sidebar-slot"); if(!slot) return;
      // if SSR already filled, hydrate only
      if (slot.children.length>0){ safe(()=>window.lucide&&lucide.createIcons()); safe(()=>window.initInstructions&&window.initInstructions()); return; }

      const stackKey=getParam("stackKey","foundation");
      const resp=await fetch(`/api/gpt-plan?stackKey=${encodeURIComponent(stackKey)}`,{method:"GET"});
      if(!resp.ok) throw new Error(`/api/gpt-plan ${resp.status}`);
      const payload=await resp.json();

      function deriveApps(data){
        if (Array.isArray(data?.apps)) return data.apps;
        let plans=[];
        if (Array.isArray(data?.plans)) plans=data.plans;
        else if (data?.plan) plans=[data.plan];
        else {
          const nest=tryParse(data?.result)||tryParse(data?.output)||tryParse(data?.plan_json)||tryParse(data);
          if (Array.isArray(nest?.plans)) plans=nest.plans; else if (nest?.plan) plans=[nest.plan];
        }
        const seen=new Set(), out=[];
        const add=(a)=>{ const n=(a?.app_name||"").trim(); if(!n||seen.has(n)) return; seen.add(n); out.push(a); };
        if(plans[0]?.apps) (plans[0].apps||[]).forEach(add);
        for(let i=1;i<plans.length && out.length<5;i++) (plans[i].apps||[]).forEach(add);
        const fallbacks=[{app_name:"Experian Boost",app_url:"https://www.experian.com/boost"},
                         {app_name:"Kikoff",app_url:"https://www.kikoff.com/"},
                         {app_name:"Kovo",app_url:"https://www.kovo.com/"}];
        for(const f of fallbacks){ if(out.length>=3) break; if(!seen.has(f.app_name)) out.push(f); }
        return out.slice(0,5);
      }

      const apps=deriveApps(payload);

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
    }catch(err){ console.error("plan.runtime → API wire failed:", err); }
  });
})();
