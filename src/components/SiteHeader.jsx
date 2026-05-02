// src/components/SiteHeader.jsx
import React from "react";
import LogoLink from "./LogoLink.jsx";
import { Link, useInRouterContext } from "react-router-dom";
import Button from "@/components/ui/Button";

function SmartLink({ to, className, children, ...rest }) {
  const inRouter = useInRouterContext();

  if (!inRouter) {
    return (
      <a href={to} className={className} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className} {...rest}>
      {children}
    </Link>
  );
}

export default function SiteHeader({ right = null }) {
  const RightSlot =
    right ??
    (
      <>
        {/* Desktop CTA */}
        <SmartLink to="/activate" className="hidden sm:block" aria-label="Start my CreditRoute">
          <Button>Start My CreditRoute</Button>
        </SmartLink>

        {/* Mobile CTA */}
        <SmartLink
          to="/wizard?fresh=1"
          className="sm:hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
          aria-label="Start my CreditRoute"
        >
          Start
        </SmartLink>
      </>
    );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <LogoLink />

        <nav className="hidden items-center gap-5 text-sm sm:flex">
          <a href="#how-it-works" className="text-white/85 hover:text-white">
            How It Works
          </a>
          <a href="#pricing" className="text-white/85 hover:text-white">
            Pricing
          </a>
          <a href="#faq" className="text-white/85 hover:text-white">
            FAQ
          </a>
          <SmartLink to="/support" className="text-white/85 hover:text-white">
            Support
          </SmartLink>
          <SmartLink to="/contact" className="text-white/85 hover:text-white">
            Contact
          </SmartLink>
        </nav>

        <div className="flex items-center gap-3">{RightSlot}</div>
      </div>
    </header>
  );
}