import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getWizardData } from "./useWizardData.js";

export function useEntryGuard() {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const payload = getWizardData();
    if (!payload) {
      nav("/wizard", { replace: true, state: { from: loc.pathname } });
    }
  }, [loc.pathname, nav]);
}
