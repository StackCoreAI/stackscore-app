// src/pages/pricing.jsx
import React, { useEffect, useRef, useState } from "react";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import Button from "@/components/ui/Button";
import RouteTierPanel from "../components/RouteTierPanel.jsx";

const Pricing = ({ embedded = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  const [unlocking, setUnlocking] = useState(false);
  const [unlockErr, setUnlockErr] = useState("");
  const checkoutInFlight = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const reset = () => {
      checkoutInFlight.current = false;
      setUnlocking(false);
      setUnlockErr("");
    };

    const onPageShow = () => reset();
    const onVisibility = () => {
      if (!document.hidden) reset();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  async function beginCheckout() {
    if (checkoutInFlight.current) return;
    checkoutInFlight.current = true;

    setUnlocking(true);
    setUnlockErr("");

    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ stackKey: "growth" }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.url) {
        const msg = payload?.error || `Checkout failed (${res.status}). Please try again.`;
        throw new Error(msg);
      }

      window.location.href = payload.url;
    } catch (e) {
      console.error(e);
      setUnlockErr(e?.message || "Couldn’t start checkout. Please try again.");
      setUnlocking(false);
      checkoutInFlight.current = false;
    }
  }

  return (
    <div className="flex flex-col bg-neutral-950 font-sans text-white">
      {!embedded && <SiteHeader />}

      <main
        id="pricing"
        className={`mx-auto w-full max-w-6xl flex-grow px-4 transition-all duration-700 sm:px-6 ${
          embedded ? "pt-6 pb-10" : "pt-10 pb-10"
        } ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-lime-500/10 px-3 py-1 text-xs text-lime-300">
            One-time activation • No subscription
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Unlock Your Personalized <span className="text-lime-400">CreditRoute</span>
          </h1>

          <p className="mt-4 text-lg text-zinc-300">
            One-time activation — <span className="font-semibold text-white">$29</span>
          </p>

          <p className="mx-auto max-w-3xl text-lg text-neutral-300">
            You’re not paying for a random list of apps. You’re unlocking a{" "}
            <span className="font-semibold text-white">personalized CreditRoute</span> that
            prioritizes your highest-impact next moves and shows you where tools actually help.
          </p>

          <p className="text-sm text-neutral-400">
            No credit pull • No sensitive financial data required • Instant access after checkout
          </p>
        </div>

        <section className="mx-auto mt-10 max-w-5xl">
          <RouteTierPanel />
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-base font-semibold text-white">Your Activation Includes</h3>

              <div className="mt-4 grid gap-4 text-sm text-neutral-300 sm:grid-cols-2">
                <ul className="list-disc space-y-2 pl-5">
                  <li>Immediate access to your full CreditRoute</li>
                  <li>Highest-impact actions prioritized for your profile</li>
                  <li>Step-by-step execution guidance</li>
                </ul>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Smart reroutes if a tool is unavailable</li>
                  <li>Printable execution blueprint</li>
                  <li>Built around real-life budget, timing, and goals</li>
                </ul>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-500">
                      What we analyze
                    </div>
                    <div className="mt-1 text-white">Profile, timeline, budget, goals</div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-500">
                      What we identify
                    </div>
                    <div className="mt-1 text-white">
                      The levers most likely to move your credit profile
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-500">
                      What you get
                    </div>
                    <div className="mt-1 text-white">
                      A prioritized route, not a random stack of apps
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-neutral-500">
                CreditRoute does not guarantee approval. It helps you focus on the moves most likely
                to strengthen your credit profile based on your situation.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-base font-semibold text-white">Why $29 Makes Sense</h3>

              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">✓</span>
                  <span>You avoid wasting money on the wrong apps, subscriptions, or credit products.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">✓</span>
                  <span>You get clarity on what to do first instead of guessing your way through credit advice.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-lime-300">✓</span>
                  <span>You unlock a route tailored to your situation, not generic “credit builder” marketing.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-lime-500/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-neutral-300">CreditRoute Activation</div>
                  <div className="mt-1 text-4xl font-extrabold">$29</div>
                  <div className="mt-1 text-sm text-neutral-400">One-time payment</div>
                  <div className="mt-2 text-xs text-neutral-500">
                    Less than the cost of signing up for the wrong credit tool.
                  </div>
                </div>

                <div className="rounded-full border border-lime-400/25 bg-lime-500/10 px-3 py-1 text-xs font-medium text-lime-300">
                  Recommended
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm text-neutral-300">
                <div className="flex items-center gap-2">
                  <span className="text-lime-300">✓</span> Full CreditRoute + reroutes
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lime-300">✓</span> Prioritized next steps for your profile
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lime-300">✓</span> Step-by-step activation guide
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lime-300">✓</span> Printable blueprint
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-lime-500 to-emerald-500 shadow-xl shadow-lime-500/40 transition-all duration-200 hover:scale-[1.02]"
                  onClick={beginCheckout}
                  disabled={unlocking}
                >
                  {unlocking ? "Opening Stripe…" : "Unlock My Full CreditRoute — $29"}
                </Button>

                {unlockErr && <div className="text-sm text-red-300">{unlockErr}</div>}

                <p className="text-xs text-neutral-400">
                  Secure checkout • Instant access • No credit check required
                </p>
              </div>
            </div>
          </div>
        </div>

        <section
          className={`mx-auto mt-14 max-w-3xl space-y-4 border-t border-neutral-800 pt-8 text-center transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "240ms" }}
        >
         <div className="mt-10 text-center text-sm text-neutral-400">
  Your route is ready to activate now.
</div>
        </section>
      </main>

      {!embedded && <SiteFooter />}
    </div>
  );
};

export default Pricing;
