import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import Button from "@/components/ui/Button";

function titleForPlanKey(planKey = "growth") {
  const k = String(planKey || "growth").toLowerCase().trim();
  if (k === "foundation") return "Foundation Credit Route";
  if (k === "growth") return "Growth Credit Route";
  if (k === "accelerator") return "Accelerator Credit Route";
  if (k === "elite") return "Elite Credit Route";
  return `${k.charAt(0).toUpperCase()}${k.slice(1)} Credit Route`;
}

export default function ThankYou() {
  const [sp] = useSearchParams();
  const sessionId = sp.get("session_id");
  const stackKeyFromUrl = (sp.get("stackKey") || "growth").toLowerCase();

  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [stackKey, setStackKey] = useState(stackKeyFromUrl);
  const [downloading, setDownloading] = useState(false);

  const planTitle = useMemo(
    () => titleForPlanKey(stackKey || stackKeyFromUrl || "growth"),
    [stackKey, stackKeyFromUrl]
  );

  useEffect(() => {
    (async () => {
      if (!sessionId) {
        setErr("Missing session_id.");
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(
          `/.netlify/functions/get-checkout-session?session_id=${encodeURIComponent(
            sessionId
          )}`,
          { credentials: "include" }
        );

        const json = await res.json().catch(() => ({}));

        if (res.ok && json?.paid) {
          const verifiedKey = String(
            json?.stackKey || stackKeyFromUrl || "growth"
          )
            .toLowerCase()
            .trim();

          try {
            localStorage.setItem("ss_access", "1");
            localStorage.setItem("ss_route_key", verifiedKey);
            sessionStorage.setItem("ss_selected", JSON.stringify(verifiedKey));
            sessionStorage.setItem("selectedPlanKey", verifiedKey);

            if (json?.email) {
              localStorage.setItem("stackscore_paid_email", json.email);
            }
          } catch {}

          setStackKey(verifiedKey);
          setOk(true);
        } else {
          setErr(
            json?.error ||
              "Verification failed. If you were charged, please contact support."
          );
        }
      } catch (e) {
        setErr(e?.message || "Network error while verifying your payment.");
      } finally {
        setChecking(false);
      }
    })();
  }, [sessionId, stackKeyFromUrl]);

  function goToGuide() {
    if (!sessionId) return;

    const key = String(stackKey || stackKeyFromUrl || "growth")
      .toLowerCase()
      .trim();

    window.location.href = `/success?session_id=${encodeURIComponent(
      sessionId
    )}&stackKey=${encodeURIComponent(key)}`;
  }

  async function downloadPlan() {
    if (!sessionId) {
      alert("Missing session. Please refresh and try again.");
      return;
    }

    let answers = null;
    let rawPlan = null;

    try {
      answers = JSON.parse(
        localStorage.getItem("ss_answers") ||
          localStorage.getItem("stackscoreUserData") ||
          localStorage.getItem("stackscore_answers") ||
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
      session_id: sessionId,
      planKey,
      answers: answers || {},
      plans: plansForServer || [],
    };

    try {
      setDownloading(true);

      const res = await fetch("/.netlify/functions/export-plan-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(
          json?.error ||
            "Export failed. If you were charged, please contact support."
        );
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `StackScore-Plan-${planKey}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(
        e?.message || "Download failed. Please try again or contact support."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-12">
        {checking && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-neutral-300">Verifying your purchase…</p>
          </div>
        )}

        {!checking && !ok && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
              <h1 className="text-xl font-semibold text-amber-300">
                We couldn’t verify your payment.
              </h1>
              <p className="mt-2 text-sm text-neutral-200">{err}</p>
            </div>

            <div className="flex gap-3">
              <Link to="/preview" className="inline-flex">
                <Button variant="secondary" size="md">
                  Back to preview
                </Button>
              </Link>
              <Link to="/support" className="inline-flex">
                <Button size="md">Contact support</Button>
              </Link>
            </div>
          </div>
        )}

        {!checking && ok && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="inline-flex items-center rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-300">
                Purchase confirmed
              </div>

              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                Your StackScore Credit Route Is Ready
              </h1>

              <p className="mt-3 text-neutral-300">
                Thank you for your purchase. Your personalized AI-generated
                Credit Route is now available.
              </p>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-lime-300">
                  Route selected
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {planTitle}
                </p>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-white">
                  You can access it in three ways:
                </p>
                <ol className="mt-3 space-y-2 text-sm text-neutral-300 list-decimal pl-5">
                  <li>Open your online Credit Route using the button below</li>
                  <li>Download your printable PDF guide</li>
                  <li>Print or save your route from inside the online guide</li>
                </ol>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={goToGuide}>
                  Access My Credit Route
                </Button>

                <Button
                  size="lg"
                  variant="secondary"
                  onClick={downloadPlan}
                  disabled={downloading}
                >
                  {downloading ? "Preparing PDF…" : "Download Printable PDF"}
                </Button>
              </div>

              <p className="mt-5 text-sm text-neutral-400">
                For security, your access link may be time-limited. We recommend
                opening your route now and downloading the PDF for future
                reference.
              </p>

              <p className="mt-3 text-sm text-neutral-500">
                Didn’t receive an email? Check your spam folder or{" "}
                <Link to="/support" className="underline underline-offset-4">
                  reach out to support
                </Link>
                .
              </p>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}