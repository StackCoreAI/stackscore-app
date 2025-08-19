import { Link } from "react-router-dom";

export default function LogoLink({ className = "" }) {
  return (
    <Link to="/" className={`flex items-center gap-2 group ${className}`} aria-label="Go to homepage">
      <svg
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        width="28" height="28"
        className="text-lime-400 group-hover:text-lime-300 transition-colors"
        fill="none" stroke="currentColor" strokeWidth="2"
      >
        <path d="M4 4h16v3H4z" />
        <path d="M4 10.5h16v3H4z" />
        <path d="M4 17h16v3H4z" />
      </svg>
      <span className="text-white font-semibold tracking-tight">StackScore</span>
    </Link>
  );
}
