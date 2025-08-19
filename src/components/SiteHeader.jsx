import LogoLink from "./LogoLink.jsx";
import { Link } from "react-router-dom";

export default function SiteHeader({ right = null }) {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <LogoLink />
        <nav className="hidden sm:flex items-center gap-5 text-sm">
          <Link to="/pricing" className="text-white/85 hover:text-white">Pricing</Link>
          <Link to="/faq" className="text-white/85 hover:text-white">FAQ</Link>
          <Link to="/support" className="text-white/85 hover:text-white">Support</Link>
          <Link to="/contact" className="text-white/85 hover:text-white">Contact</Link>
        </nav>
        {right}
      </div>
    </header>
  );
}
