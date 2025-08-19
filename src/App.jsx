// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Outlet } from "react-router-dom";

import Hero from "./pages/hero.jsx";
import Wizard from "./pages/wizard.jsx";
import Preview from "./pages/preview.jsx";
import FAQ from "./pages/faq.jsx";
import Pricing from "./pages/pricing.jsx";
import Support from "./pages/support.jsx";
import Terms from "./pages/terms.jsx";
import ThankYou from "./pages/thankyou.jsx";
import SixSimple from "./pages/sixsimple.jsx";
import About from "./pages/about.jsx";

// Policy / contact
import Privacy from "./pages/privacy.jsx";
import Refund from "./pages/refund.jsx";
import Cookies from "./pages/cookies.jsx";
import Contact from "./pages/contact.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Main */}
          <Route index element={<Hero />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/thankyou" element={<ThankYou />} />

          {/* Informational */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<Support />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/terms-of-use" element={<Terms />} />
          <Route path="/sixsimple" element={<SixSimple />} />
          <Route path="/six-simple" element={<SixSimple />} />
          <Route path="/about" element={<About />} />

          {/* Policies */}
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/refund-policy" element={<Refund />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/contact" element={<Contact />} />

          {/* Aliases & utilities */}
          <Route path="/start" element={<Navigate to="/wizard" replace />} />
          <Route path="/build" element={<Navigate to="/wizard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Hero />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

/* ---------------- Minimal layout (pages render their own SiteHeader/SiteFooter) ---------------- */
function Layout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
