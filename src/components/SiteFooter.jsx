import { Link } from "react-router-dom";

export default function SiteFooter() {
  const y = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-white/80">© {y} StackScore. All rights reserved.</span>
          <nav className="flex flex-wrap gap-4">
            <Link className="text-white/85 hover:text-white" to="/privacy-policy">Privacy</Link>
            <Link className="text-white/85 hover:text-white" to="/terms">Terms of Use</Link>
            <Link className="text-white/85 hover:text-white" to="/refund-policy">Refunds</Link>
            <Link className="text-white/85 hover:text-white" to="/cookies">Cookie Policy</Link>
            <Link className="text-white/85 hover:text-white" to="/contact">Contact</Link>
          </nav>
        </div>
        <p className="mt-3 text-xs text-white/75 text-center">
          Educational information only; not financial advice. Results vary.
        </p>
      </div>
    </footer>
  );
}

