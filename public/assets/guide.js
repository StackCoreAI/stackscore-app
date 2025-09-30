// public/assets/guide.js

// Mark <html> as JS-enabled (so .js .init-opacity rules can apply safely)
document.documentElement.classList.add('js');

/** ────────────────────────────────────────────────────────────────────────────
 * Icons + Reveal
 *  - Stagger any [data-anim] blocks
 *  - Safety net: ensure ANY .init-opacity becomes visible (even without [data-anim])
 *  - Runs once on DOMContentLoaded
 * ─────────────────────────────────────────────────────────────────────────── */
function initIconsAndAnim() {
  // Initialize lucide icons first so we don't animate empty <i> placeholders
  try {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  } catch {}

  // Stagger reveal for [data-anim]
  const anim = document.querySelectorAll('[data-anim]');
  anim.forEach((el, i) => {
    // Avoid re-applying if already visible (e.g., during hot reloads)
    if (!el.classList.contains('show')) {
      setTimeout(() => el.classList.add('show'), i * 120);
    }
  });

  // Safety net: guarantee visibility for any node that still has .init-opacity
  const hidden = document.querySelectorAll('.init-opacity');
  hidden.forEach(el => el.classList.add('show'));
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
  // NOTE: order matters a little — reveal near the top so UX doesn't feel “muted”
  initIconsAndAnim();       // reveals BOTH [data-anim] and .init-opacity  ← merged safety net
  initLocalProgress();
  initInstructionsBinder();
  initLearnMore();
});
