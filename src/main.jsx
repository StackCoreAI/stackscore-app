// src/main.jsx
import "./app.src.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// ✅ Keep Hero available as a standalone route if needed
import Hero from "./pages/hero.jsx";

// ✅ Long-scroll homepage
import Landing from "./pages/landing.jsx";

import WizardIntro from "./pages/wizardintro.jsx";
import Wizard from "./pages/wizard.jsx";
import Preview from "./pages/preview.jsx";
import Pricing from "./pages/pricing.jsx";
import FAQ from "./pages/faq.jsx";
import Support from "./pages/support.jsx";
import Terms from "./pages/terms.jsx";
import SixSimple from "./pages/sixsimple.jsx";
import About from "./pages/about.jsx";
import ThankYou from "./pages/thankyou.jsx";
import Privacy from "./pages/privacy.jsx";
import Refund from "./pages/refund.jsx";
import Cookies from "./pages/cookies.jsx";
import Contact from "./pages/contact.jsx";

// Lightweight 404
function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center bg-neutral-950 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">404 — Not Found</h1>
        <p className="mt-2 opacity-70">The page you’re looking for doesn’t exist.</p>
        <a
          href="/"
          className="mt-6 inline-block rounded bg-lime-400 px-4 py-2 font-semibold text-black"
        >
          ← Back Home
        </a>
      </div>
    </main>
  );
}

console.log("[boot] before router init");

const router = createBrowserRouter([
  // ✅ Homepage = long-scroll landing page
  { path: "/", element: <Landing />, errorElement: <NotFound /> },

  // ✅ Optional standalone hero route
  { path: "/hero", element: <Hero /> },

  // ✅ Activation runway
  { path: "/activate", element: <WizardIntro /> },

  // ✅ Optional alias to landing
  { path: "/landing", element: <Landing /> },

  // App routes
  { path: "/wizard", element: <Wizard /> },
  { path: "/preview", element: <Preview /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "/faq", element: <FAQ /> },
  { path: "/support", element: <Support /> },
  { path: "/terms", element: <Terms /> },
  { path: "/terms-of-use", element: <Terms /> },
  { path: "/sixsimple", element: <SixSimple /> },
  { path: "/about", element: <About /> },
  { path: "/thankyou", element: <ThankYou /> },
  { path: "/privacy-policy", element: <Privacy /> },
  { path: "/refund-policy", element: <Refund /> },
  { path: "/cookies", element: <Cookies /> },
  { path: "/contact", element: <Contact /> },

  // 404
  { path: "*", element: <NotFound /> },
]);

console.log("[boot] after router init");

// Resilient mount
const mount =
  document.getElementById("root") ||
  document.getElementById("app") ||
  document.body.appendChild(Object.assign(document.createElement("div"), { id: "root" }));

const root = ReactDOM.createRoot(mount);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

console.log("[boot] after render");

// One-time scroll unlock (handles any stray overflow locks)
requestAnimationFrame(() => {
  [document.documentElement, document.body].forEach((el) => {
    el.style.overflow = "auto";
    el.style.overflowY = "auto";
    el.style.position = "static";
    el.style.height = "auto";
    el.style.minHeight = "100%";
  });
});