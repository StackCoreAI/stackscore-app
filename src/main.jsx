// /src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// Pages (all lowercase to satisfy Linux/Vercel case sensitivity)
import Hero from "./pages/hero.jsx";
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

function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center bg-neutral-950 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">404 — Not Found</h1>
        <p className="opacity-70 mt-2">The page you’re looking for doesn’t exist.</p>
        <a href="/" className="inline-block mt-6 px-4 py-2 rounded bg-lime-400 text-black font-semibold">
          ← Back Home
        </a>
      </div>
    </main>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <Hero />, errorElement: <NotFound /> },
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
  { path: "*", element: <NotFound /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
