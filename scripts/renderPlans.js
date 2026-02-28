// scripts/renderPlans.js

export function renderPlans(plans, { blurLocked = true } = {}) {
  const root = document.getElementById("plans-root");
  if (!root) return;

  // ---------------------------------------------
  // Access helpers (dev-friendly)
  // ---------------------------------------------
  function getAccess() {
    const url = new URL(location.href);
    if (url.searchParams.has("unlock")) localStorage.setItem("ss_access", "1");
    if (url.searchParams.has("lock")) localStorage.removeItem("ss_access");
    return localStorage.getItem("ss_access") === "1";
  }

  const hasAccess = getAccess();
  const MAX_WHEN_OPEN = 7;
  const MIN_WHEN_LOCKED = 1;

  function visibleApps(apps) {
    if (!Array.isArray(apps)) return [];
    return hasAccess
      ? apps.slice(0, Math.min(MAX_WHEN_OPEN, apps.length))
      : apps.slice(0, Math.min(MIN_WHEN_LOCKED, apps.length));
  }

  // ---------------------------------------------
  // Render
  // ---------------------------------------------
  root.innerHTML = "";

  (plans || []).forEach((p) => {
    const total = Array.isArray(p.apps) ? p.apps.length : 0;
    const apps = visibleApps(p.apps || []);
    const isLocked = !hasAccess;

    const card = document.createElement("div");
    card.className = "plan-card";
    if (isLocked && blurLocked) card.classList.add("blur-locked");

    const lockNote = isLocked
      ? `<div class="lock-note">${apps.length} of ${total} visible (route locked)</div>`
      : "";

    const items = apps
      .map((a) => {
        const desc = a.why ?? a.app_description ?? "";
        return `<li class="${isLocked && blurLocked ? "locked" : ""}">
                  <strong>${a.app_name}</strong> – ${desc}
                </li>`;
      })
      .join("");

    const planId = p.id ?? "";
    const title = p.title ?? "";
    const summary = p.summary ?? "";

    card.innerHTML = `
      <h3>${planId}. ${title}</h3>
      <p>${summary}</p>
      ${lockNote}
      <ol>${items}</ol>
      <button data-plan="${planId}">
        ${isLocked ? "Unlock Route" : "Choose This Route"}
      </button>
    `;

    root.appendChild(card);
  });

  // ---------------------------------------------
  // Interactions
  // ---------------------------------------------
  root.onclick = (e) => {
    const btn = e.target.closest("button[data-plan]");
    if (!btn) return;

    // If locked, clicking the button unlocks (dev flow) and re-renders
    if (!hasAccess) {
      localStorage.setItem("ss_access", "1");
      renderPlans(plans, { blurLocked });
      return;
    }

    // Unlocked → select plan (keep storage key stable)
    localStorage.setItem("selectedPlan", btn.dataset.plan);
    alert(`Selected Route ${btn.dataset.plan}`);
  };
}