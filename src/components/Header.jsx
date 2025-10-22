// src/components/Header.jsx
import { Link, useLocation } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function Header() {
  const { pathname } = useLocation();
  const onWizard = pathname.startsWith("/wizard");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2" aria-label="StackScore — Home">
          <span className="inline-block h-5 w-5 rounded-sm bg-lime-400" />
          <span className="font-semibold tracking-tight group-hover:opacity-90">StackScore</span>
        </Link>

        {/* Top-right nav */}
        <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="Primary">
          <Link to="/pricing" className="text-white/85 hover:text-white">Pricing</Link>
          <Link to="/faq" className="text-white/85 hover:text-white">FAQ</Link>
          <Link to="/support" className="text-white/85 hover:text-white">Support</Link>
          <Link to="/contact" className="text-white/85 hover:text-white">Contact</Link>

          {!onWizard && (
            <Link to="/wizard?fresh=1" className="hidden md:block" aria-label="Build my stack">
              <Button>🚀 Build my stack</Button>
            </Link>
          )}
        </nav>

        {/* Mobile CTA (compact) */}
        {!onWizard && (
          <Link
            to="/wizard?fresh=1"
            className="md:hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
            aria-label="Build my stack"
          >
            Build
          </Link>
        )}
      </div>
    </header>
  );
}
