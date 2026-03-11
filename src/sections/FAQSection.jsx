// src/sections/FAQSection.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function FAQSection() {
  const [stage, setStage] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    // Staggered animation timing (header + 4 FAQs)
    [1, 2, 3, 4, 5].forEach((s, i) => {
      setTimeout(() => setStage(s), i * 150);
    });
  }, []);

  const show = (n) =>
    stage >= n ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4";
  const toggleFAQ = (i) => setOpenFAQ(openFAQ === i ? null : i);

  const faqData = [
    {
      question: "How is my StackScore plan created?",
      answer:
        "Your plan is personalized from your answers and our verified stack library.",
    },
    {
      question: "Can I change my plan later?",
      answer:
        "Yes—refresh after 120 days for $14.50 when your goals change.",
    },
    {
      question: "What's included in my purchase?",
      answer: (
        <>
          A one-time tailored plan with best-fit apps and steps for{" "}
          <span className="text-lime-400 font-semibold">$29</span>.
        </>
      ),
    },
    {
      question: "Do you offer refunds?",
      answer: (
        <>
          Email{" "}
          <a
            href="mailto:resolve@stackscore.ai"
            className="text-lime-400 hover:underline"
          >
            resolve@stackscore.ai
          </a>{" "}
          and we’ll help.
        </>
      ),
    },
  ];

  return (
    <section id="faq" className="section py-20 bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div
          className={`text-center mb-8 transition-all duration-600 ease-out ${show(
            1
          )}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-lime-400">
            Frequently Asked Questions
          </h2>
          <p className="text-neutral-400 mt-2 text-sm">
            Answers to common questions about your StackScore experience.
          </p>
        </div>

        {/* Accordion */}
        <div className="max-w-2xl mx-auto space-y-4 text-sm">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className={`bg-neutral-900 border border-neutral-800 rounded p-4 transition-all duration-600 ease-out ${show(
                2 + index
              )}`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left font-medium text-lime-400 hover:text-lime-300 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-400/50 rounded"
              >
                <div className="flex items-center justify-between">
                  <span>{faq.question}</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform duration-200 ${
                      openFAQ === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openFAQ === index ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-neutral-300 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        {/* View-all link (optional) */}
        <div className={`text-center mt-8 transition ${show(5)}`}>
          <Link
            to="/faq"
            className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2 text-white/90 hover:text-white hover:bg-white/5 transition"
          >
            View all FAQs
          </Link>
        </div>
      </div>
    </section>
  );
}
