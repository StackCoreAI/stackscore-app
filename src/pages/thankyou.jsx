// src/pages/thankyou.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import Button from "@/components/ui/Button";

export default function ThankYou() {
  const [sp] = useSearchParams();
  const sessionId = sp.get("session_id");
  const stackKeyFromUrl = (sp.get("stackKey") || "growth").toLowerCase();

  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [stackKey, setStackKey] = useState(stackKeyFromUrl);

  useEffect(() => {
    (async () => {
      if (!sessionId) {
        setErr("Missing session_id.");
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`,
          { credentials: "include" }
        );
        const json = await res.json().catch(() => ({}));

        if (res.ok && json?.ok) {
          const verifiedKey = String(json?.stackKey || stackKeyFromUrl || "growth").toLowerCase();

          try {
            localStorage.setItem("ss_access", "1");
            localStorage.setItem("ss_route_key", verifiedKey);
            sessionStorage.setItem("ss_selected", JSON.stringify(verifiedKey));
            sessionStorage.setItem("selectedPlanKey", verifiedKey);
          } catch {}

          setStackKey(verifiedKey);
          setOk(true);
        } else {
          setErr(json?.error || "Verification failed. If you were charged, please contact support.");
        }
      } catch (e) {
        setErr(e?.message || "Network error while verifying your payment.");
      } finally {
        setChecking(false);
      }
    })();
  }, [sessionId, stackKeyFromUrl]);

  function goToGuide() {
    window.location.href = `/guides/82.html?stackKey=${encodeURIComponent(stackKey)}`;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-xl px-4 py-12">
        {checking && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-neutral-300">Verifying your purchase…</p>
          </div>
        )}

        {!checking && !ok && (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-5">
              <h1 className="text-xl font-semibold text-amber-300">
                We couldn’t verify your payment.
              </h1>
              <p className="mt-2 text-sm text-neutral-200">{err}</p>
            </div>

            <div className="flex gap-3">
              <Link to="/preview" className="inline-flex">
                <Button variant="secondary" size="md">Back to preview</Button>
              </Link>
              <Link to="/support" className="inline-flex">
                <Button size="md">Contact support</Button>
              </Link>
            </div>
          </div>
        )}

        {!checking && ok && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Thank you! 🎉</h1>

            <p className="text-neutral-300">
              Your optimized stack is unlocked. You can access your Credit Route now
              and download your digital brief for future reference.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={goToGuide}>
                Access my Credit Route
              </Button>

              <Button size="lg" variant="secondary" onClick={downloadPlan}>
                Download my plan
              </Button>
            </div>

            <p className="text-sm text-neutral-400">
              We recommend bookmarking or downloading your guide for future access.
            </p>

            <p className="text-sm text-neutral-500">
              Didn’t receive an email? Check your spam folder or{" "}
              <Link to="/support" className="underline">reach out to support</Link>.
            </p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );

  async function downloadPlan() {
    let answers = null, rawPlan = null;

    try {
      answers = JSON.parse(
        localStorage.getItem("ss_answers") ||
        localStorage.getItem("stackscoreUserData") ||
        "null"
      );
    } catch {}

    try {
      rawPlan = JSON.parse(sessionStorage.getItem("ss_plan") || "null");
    } catch {}

    let plansForServer = rawPlan;
    if (rawPlan && typeof rawPlan === "object") {
      if (rawPlan.plans) plansForServer = rawPlan.plans;
      else if (rawPlan.plan) plansForServer = rawPlan.plan;
    }

    let planKey = stackKey || "growth";
    try {
      const sel = JSON.parse(sessionStorage.getItem("ss_selected") || "null");
      if (typeof sel === "string") planKey = sel;
      else if (sel?.planKey) planKey = sel.planKey;
    } catch {}

    const body = {
      ss_access: "1",
      planKey,
      answers: answers || {},
      plans: plansForServer || [],
    };

    try {
      const res = await fetch(`/api/plan/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        alert("Export failed. If you were charged, please contact support.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `StackScore-Plan-${planKey}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Please try again or contact support.");
    }
  }
}