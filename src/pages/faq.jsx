// src/pages/faq.jsx
import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const FAQ = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [animationStage, setAnimationStage] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((stage, i) => {
      setTimeout(() => setAnimationStage(stage), i * 120);
    });
  }, []);

  const getAnimationClass = (n) =>
    animationStage >= n ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4";

  const toggleFAQ = (i) => setOpenFAQ(openFAQ === i ? null : i);

  const faqData = [
    {
      question: "What is CreditRoute?",
      answer:
        "CreditRoute is a personalized credit routing system. It helps you identify the moves most likely to strengthen your credit profile based on your situation, then organizes those moves into a practical sequence you can actually follow.",
    },
    {
      question: "What is a Credit Route?",
      answer:
        "A Credit Route is your personalized step-by-step path. Instead of pushing one app or generic advice, CreditRoute prioritizes the actions most likely to matter for your profile and then shows you where tools may help you execute those steps.",
    },
    {
      question: "Is CreditRoute a credit builder app?",
      answer:
        "No. CreditRoute is not a credit builder app and it is not a marketplace pretending to be a solution. It is a decision engine that helps you understand what to do first, what to do next, and which tools are worth considering only when they actually help.",
    },
    {
      question: "How is my Credit Route created?",
      answer:
        "Your route is created from your answers about your situation, goals, budget, timeline, and execution style. CreditRoute uses those inputs to identify the levers most likely to move your credit profile and then sequences them into a smarter route.",
    },
    {
      question: "Do you pull my credit or ask for sensitive financial data?",
      answer:
        "No. CreditRoute does not pull your credit report and does not require sensitive financial account data. We use your inputs to build a route around your profile context, budget, and goals.",
    },
    {
      question: "What do I get after I unlock my Credit Route?",
      answer:
        "After activation, you receive your full Credit Route, prioritized next steps, step-by-step execution guidance, tool recommendations where they actually help, reroutes if something is unavailable, and a printable execution blueprint.",
    },
    {
      question: "How is CreditRoute different from credit repair?",
      answer:
        "CreditRoute is not a credit repair service. We do not dispute items, negotiate with creditors, or alter your credit report. CreditRoute is an educational planning and execution tool that helps you focus on the highest-impact actions for your situation.",
    },
    {
      question: "Does CreditRoute guarantee approval or a credit score increase?",
      answer:
        "No. CreditRoute does not guarantee approval and it does not guarantee a score increase. What it does is help you focus on the moves most likely to strengthen your credit profile based on where you are now. Results always vary by profile, reporting timelines, and execution.",
    },
    {
      question: "Why does CreditRoute recommend different routes for different people?",
      answer:
        "Because credit improvement is not one-size-fits-all. A person with a thin, clean file may need a very different route than someone rebuilding around late payments, collections, or utilization issues. Sequence matters, and CreditRoute is designed around that reality.",
    },
    {
      question: "Can I update my Credit Route later?",
      answer:
        "Yes. As your situation changes, your ideal route can change too. You’ll be able to refresh your route later so it can reflect new tools, new priorities, and new opportunities.",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "If you experience a technical issue accessing your Credit Route, contact support at resolve@stackscore.ai and we’ll work quickly to resolve it. CreditRoute is a digital product, so support starts with making sure you can access what you purchased correctly.",
    },
  ];

  return (
    <div
      id="faq"
      className="bg-neutral-950 font-sans text-white antialiased selection:bg-lime-400/30"
    >
      {!embedded && (
        <nav
          className={`mb-6 flex items-center justify-between pl-4 pt-4 transition-all duration-600 ease-out sm:pl-6 sm:pt-6 ${getAnimationClass(
            1
          )}`}
        >
          <Link
            to="/"
            className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-lime-400"
            >
              <path d="M4 4h16v3H4z" />
              <path d="M4 10.5h16v3H4z" />
              <path d="M4 17h16v3H4z" />
            </svg>
            <span className="text-lg font-semibold tracking-tight">CreditRoute</span>
          </Link>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 pr-4 text-sm text-neutral-400 transition-colors hover:text-neutral-50 sm:pr-6"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> Back
          </button>
        </nav>
      )}

      <section
        className={`scroll-mt-24 px-4 text-center transition-all duration-600 ease-out md:scroll-mt-28 ${
          embedded ? "mt-2 mb-8" : "mt-6 mb-10"
        } ${getAnimationClass(2)}`}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-lime-500/10 px-3 py-1 text-xs text-lime-300">
          Frequently Asked Questions
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-lime-400">
          Questions about Credit Routing
        </h1>

        <p className="mt-2 text-sm text-neutral-400">
          What CreditRoute is, how it works, and what to expect from your personalized Credit Route.
        </p>
      </section>

      <section
        className={`mx-auto max-w-3xl space-y-4 px-4 text-sm text-white transition-all duration-600 ease-out ${getAnimationClass(
          3
        )}`}
      >
        {faqData.map((faq, index) => (
          <div
            key={index}
            className={`rounded border border-neutral-800 bg-neutral-900 p-4 transition-all duration-600 ease-out ${getAnimationClass(
              Math.min(4 + index, 9)
            )}`}
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full rounded text-left font-medium text-lime-400 transition-colors hover:text-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
            >
              <div className="flex items-center justify-between gap-4">
                <span>{faq.question}</span>
                <svg
                  className={`h-5 w-5 shrink-0 transform transition-transform duration-200 ${
                    openFAQ === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
                openFAQ === index ? "mt-2 max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="leading-relaxed text-neutral-300">{faq.answer}</p>
            </div>
          </div>
        ))}
      </section>

      {!embedded && (
        <footer
          className={`mt-12 border-t border-neutral-800 px-4 pb-6 text-center text-xs text-neutral-500 transition-all duration-600 ease-out ${getAnimationClass(
            9
          )}`}
        >
          <div className="space-x-4">
            <Link to="/privacy-policy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms-of-use" className="transition hover:text-white">
              Terms of Use
            </Link>
            <Link to="/cookies" className="transition hover:text-white">
              Cookie Disclaimer
            </Link>
          </div>
          <p className="mt-2">
            This site uses cookies to enhance your experience. By continuing, you agree to our use
            of cookies.
          </p>
        </footer>
      )}
    </div>
  );
};

export default FAQ;