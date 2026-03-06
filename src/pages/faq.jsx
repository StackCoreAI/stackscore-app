// src/pages/faq.jsx
import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const FAQ = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [animationStage, setAnimationStage] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    [1, 2, 3, 4, 5, 6, 7].forEach((stage, i) => {
      setTimeout(() => setAnimationStage(stage), i * 150);
    });
  }, []);

  const getAnimationClass = (n) =>
    animationStage >= n ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4";

  const toggleFAQ = (i) => setOpenFAQ(openFAQ === i ? null : i);

  const faqData = [
  {
    question: "What is a Credit Route?",
    answer:
      "A Credit Route is your personalized sequence of credit-building tools and reporting features designed to work together. Instead of guessing which apps to use, StackScore maps the highest-impact path to improve your credit profile."
  },
  {
    question: "How is my Credit Route created?",
    answer:
      "Your route is generated from your answers to six quick questions about your situation, goals, and budget. StackScore then analyzes reporting opportunities and recombines the strongest features across tools to create your optimal route."
  },
  {
    question: "Do you pull my credit or ask for financial data?",
    answer:
      "No. StackScore does not pull your credit report and does not require sensitive financial information. We only analyze your preferences and habits to design your Credit Route."
  },
  {
    question: "What happens after I unlock my Credit Route?",
    answer:
      "After activation, you receive your full Credit Route with direct links to the tools in your plan, step-by-step activation guidance, and a printable execution blueprint."
  },
  {
    question: "Can I update my Credit Route later?",
    answer:
      "Yes. As your goals or credit profile evolve, you’ll be able to refresh your route to incorporate new reporting tools and opportunities."
  },
  {
    question: "Is StackScore a credit repair service?",
    answer:
      "No. StackScore is an educational planning tool that helps you organize and execute credit-building strategies. We do not dispute items or modify your credit report."
  },
  {
    question: "Do you offer refunds?",
    answer:
      "If you experience a technical issue accessing your Credit Route, contact support at resolve@stackscore.ai and we’ll help resolve it quickly."
  }
];

  return (
    <div className="bg-neutral-950 font-sans text-white antialiased selection:bg-lime-400/30">
      {!embedded && (
        <nav
          className={`flex items-center justify-between mb-6 pl-4 pt-4 sm:pl-6 sm:pt-6 transition-all duration-600 ease-out ${getAnimationClass(
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
            <span className="text-lg font-semibold tracking-tight">StackScore</span>
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
        className={`text-center px-4 transition-all duration-600 ease-out ${
          embedded ? "mt-2 mb-8" : "mt-6 mb-10"
        } ${getAnimationClass(2)}`}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-lime-400">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          How Credit Routing works and what to expect from your StackScore plan.
        </p>
      </section>

      <section
        className={`mx-auto max-w-2xl space-y-4 px-4 text-sm text-white transition-all duration-600 ease-out ${getAnimationClass(
          3
        )}`}
      >
        {faqData.map((faq, index) => (
          <div
            key={index}
            className={`rounded border border-neutral-800 bg-neutral-900 p-4 transition-all duration-600 ease-out ${getAnimationClass(
              4 + index
            )}`}
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full rounded text-left font-medium text-lime-400 transition-colors hover:text-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
            >
              <div className="flex items-center justify-between">
                <span>{faq.question}</span>
                <svg
                  className={`h-5 w-5 transform transition-transform duration-200 ${
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
            7
          )}`}
        >
          <div className="space-x-4">
            <Link to="/privacy-policy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link to="/terms-of-use" className="hover:text-white transition">
              Terms of Use
            </Link>
            <Link to="/cookies" className="hover:text-white transition">
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