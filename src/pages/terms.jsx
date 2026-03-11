// src/pages/terms.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

const Terms = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 font-sans flex flex-col">
      {/* Global header with tiny back control on the right */}
      <SiteHeader
        right={
          <button
            onClick={handleBack}
            className="text-xs sm:text-sm text-white/70 hover:text-white transition-colors"
            aria-label="Go back"
          >
            ← Back
          </button>
        }
      />

      <main className="flex-1">
        {/* Header */}
        <section className="text-center px-4 mt-8 mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-lime-400">
            Terms of Use
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">Last updated: July 2025</p>
        </section>

        {/* Content */}
        <section className="max-w-2xl mx-auto px-4 text-neutral-300 text-sm space-y-6 leading-relaxed divide-y divide-neutral-800">
          <div
            ref={sectionRef}
            className={`space-y-6 pb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p>
              <strong className="text-white">1. Use of the Site</strong><br />
              StackScore provides personalized plans for educational purposes only. We are{" "}
              <strong className="text-white">
                not a credit repair service, financial advisor, or lender
              </strong>. Don’t misuse the site or share plan results without permission.
            </p>

            <p>
              <strong className="text-white">2. Ownership</strong><br />
              All content and branding are StackScore IP. Plans are for your personal use.
            </p>

            <p>
              <strong className="text-white">3. Refunds</strong><br />
              All sales are final once delivered. See our{" "}
              <Link to="/refund-policy" className="text-lime-400 hover:underline">
                Refund Policy
              </Link>.
            </p>

            <p>
              <strong className="text-white">4. Liability</strong><br />
              We cannot guarantee specific outcomes. You are responsible for how you use the information provided.
            </p>

            <p>
              By using this site, you agree to these terms. We may update them without prior notice.
            </p>
          </div>
        </section>
      </main>

      {/* Brighter, consistent site footer */}
      <SiteFooter />
    </div>
  );
};

export default Terms;
