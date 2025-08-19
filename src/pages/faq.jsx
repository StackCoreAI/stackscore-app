import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const FAQ = () => {
  const navigate = useNavigate();
  const [animationStage, setAnimationStage] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    // Staggered animation timing (header, section, 4 FAQs, footer)
    [1, 2, 3, 4, 5, 6, 7].forEach((stage, i) => {
      setTimeout(() => setAnimationStage(stage), i * 150);
    });
  }, []);

  const getAnimationClass = (n) => (animationStage >= n ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4");
  const toggleFAQ = (i) => setOpenFAQ(openFAQ === i ? null : i);

  const faqData = [
    { question: "How is my StackScore plan created?", answer: "Your plan is personalized from your answers and our verified stack library." },
    { question: "Can I change my plan later?", answer: "Yes—refresh after 120 days for $14.50 when your goals change." },
    { question: "What's included in my purchase?", answer: <>A one-time tailored plan with best-fit apps and steps for <span className="text-lime-400 font-semibold">$29</span>.</> },
    { question: "Do you offer refunds?", answer: <>Email <a href="mailto:resolve@stackscore.ai" className="text-lime-400 hover:underline">resolve@stackscore.ai</a> and we’ll help.</> }
  ];

  return (
    <div className="bg-neutral-950 text-white font-sans antialiased selection:bg-lime-400/30 min-h-screen">
      {/* Top Navigation */}
      <nav className={`flex items-center justify-between mb-6 pl-4 pt-4 sm:pl-6 sm:pt-6 transition-all duration-600 ease-out ${getAnimationClass(1)}`}>
        <Link to="/" className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400/70">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-lime-400">
            <path d="M4 4h16v3H4z" /><path d="M4 10.5h16v3H4z" /><path d="M4 17h16v3H4z" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">StackScore</span>
        </Link>

        <button onClick={() => navigate("/")} className="text-sm text-neutral-400 hover:text-neutral-50 pr-4 sm:pr-6 flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} /> Back
        </button>
      </nav>

      {/* Header */}
      <section className={`text-center px-4 mt-6 mb-10 transition-all duration-600 ease-out ${getAnimationClass(2)}`}>
        <h1 className="text-3xl font-semibold tracking-tight text-lime-400">Frequently Asked Questions</h1>
        <p className="text-neutral-400 mt-2 text-sm">Answers to common questions about your StackScore experience.</p>
      </section>

      {/* FAQs */}
      <section className={`max-w-2xl mx-auto px-4 space-y-4 text-white text-sm transition-all duration-600 ease-out ${getAnimationClass(3)}`}>
        {faqData.map((faq, index) => (
          <div key={index} className={`bg-neutral-900 border border-neutral-800 rounded p-4 transition-all duration-600 ease-out ${getAnimationClass(4 + index)}`}>
            <button onClick={() => toggleFAQ(index)} className="w-full text-left font-medium text-lime-400 hover:text-lime-300 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-400/50 rounded">
              <div className="flex items-center justify-between">
                <span>{faq.question}</span>
                <svg className={`w-5 h-5 transform transition-transform duration-200 ${openFAQ === index ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFAQ === index ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
              <p className="text-neutral-300 leading-relaxed">{faq.answer}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className={`text-xs text-neutral-500 text-center px-4 mt-12 pb-6 border-t border-neutral-800 transition-all duration-600 ease-out ${getAnimationClass(7)}`}>
        <div className="space-x-4">
          <Link to="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
          <Link to="/terms-of-use" className="hover:text-white transition">Terms of Use</Link>
          <Link to="/cookies" className="hover:text-white transition">Cookie Disclaimer</Link>
        </div>
        <p className="mt-2">This site uses cookies to enhance your experience. By continuing, you agree to our use of cookies.</p>
      </footer>
    </div>
  );
};

export default FAQ;
