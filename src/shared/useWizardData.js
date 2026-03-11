const KEY = "wizardPayload";

export function getWizardData() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setWizardData(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj || {}));
  } catch {}
}

export function clearWizardData() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
