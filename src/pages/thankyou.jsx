// src/pages/thankyou.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function ThankYou() {
  const [ok, setOk] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState("");

  const sessionId = new URLSearchParams(location.search).get("session_id");

  useEffect(() => {
    (async () => {
      if (!sessionId) { setErr("Missing session_id"); setChecking(false); return; }
      try {
        const res = await fetch(`${API_BASE}/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`, {
          credentials: "include"
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.ok) {
          localStorage.setItem("ss_access", "1");
          setOk(true);
        } else {
          setErr("Verification failed");
        }
      } catch (e) {
        setErr(e?.message || "Network error");
      } finally {
        setChecking(false);
      }
    })();
  }, [sessionId]);

  if (checking) return <div className="p-6">Verifying your payment…</div>;
  if (!ok) return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">We couldn’t verify your payment.</h1>
      <p className="mt-2 text-sm opacity-80">{err}</p>
      <Link to="/preview" className="inline-block mt-6 px-4 py-2 rounded bg-gray-800 text-white">Back to preview</Link>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Thank you! Your optimized stack is unlocked</h1>
      <p className="mt-2 opacity-80">You can now download your digital brief.</p>
      <button className="mt-6 px-4 py-2 rounded bg-black text-white" onClick={downloadPlan}>
        Download my plan
      </button>
      <Link to="/preview" className="ml-3 inline-block mt-6 px-4 py-2 rounded border border-white/30">
        Back to preview
      </Link>
    </div>
  );

  async function downloadPlan() {
    let answers = null, plans = null;
    try { answers = JSON.parse(localStorage.getItem("ss_answers") || localStorage.getItem("stackscoreUserData") || "null"); } catch {}
    try { plans = JSON.parse(sessionStorage.getItem("ss_plan") || "null"); } catch {}

    const body = { ss_access: "1", planKey: "growth", answers: answers || {}, plans: plans?.plans || [] };
    const res = await fetch(`${API_BASE}/api/plan/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) { alert("Export failed. If you were charged, please contact support."); return; }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "StackScore-Plan.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }
}
