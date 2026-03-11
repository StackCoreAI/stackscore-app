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
