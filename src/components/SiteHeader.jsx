// src/components/SiteHeader.jsx
import LogoLink from "./LogoLink.jsx";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button"; // alias for parity

export default function SiteHeader({ right = null }) {
  const RightSlot = right ?? (
    <>
      {/* Desktop CTA (brand gradient) */}
      <Link to="/wizard?fresh=1" className="hidden sm:block" aria-label="Build my stack">
        <Button>🚀 Build my stack</Button>
      </Link>

      {/* Mobile CTA (compact ghost-style) */}
      <Link
        to="/wizard?fresh=1"
        className="sm:hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
        aria-label="Build my stack"
      >
        Build
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <LogoLink />

        <nav className="hidden items-center gap-5 text-sm sm:flex">
          <Link to="/pricing" className="text-white/85 hover:text-white">Pricing</Link>
          <Link to="/faq" className="text-white/85 hover:text-white">FAQ</Link>
          <Link to="/support" className="text-white/85 hover:text-white">Support</Link>
          <Link to="/contact" className="text-white/85 hover:text-white">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          {RightSlot}
        </div>
      </div>
    </header>
  );
}
