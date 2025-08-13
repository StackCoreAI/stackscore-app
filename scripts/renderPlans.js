export function renderPlans(plans, { blurLocked = true } = {}) {
    const root = document.getElementById('plans-root');
    if (!root) return;
    root.innerHTML = '';
    plans.forEach((p, i) => {
      const locked = blurLocked && i > 0; // lock B–D for now
      const card = document.createElement('div');
      card.className = 'plan-card';
      card.innerHTML = `
        <h3>${p.id}. ${p.title}</h3>
        <p>${p.summary}</p>
        <ol>${p.apps.map(a => `<li>${a.app_name} – ${a.why}</li>`).join('')}</ol>
        <button ${locked ? 'disabled' : ''} data-plan="${p.id}">${locked ? 'Unlock Stack' : 'Try This Stack'}</button>
      `;
      root.appendChild(card);
    });
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-plan]');
      if (!btn) return;
      localStorage.setItem('selectedPlan', btn.dataset.plan);
      alert(`Selected Plan ${btn.dataset.plan}`);
    });
  }
  