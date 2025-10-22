// src/components/ui/Button.jsx
export default function Button({
  as: As = "button",
  variant = "primary",   // "primary" | "secondary" | "ghost"
  size = "md",           // "sm" | "md" | "lg"
  className = "",
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-full font-semibold transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-6 py-3 text-lg",
  };

  // EXACT match to AC Hero v2
  const variants = {
    primary:
      // lime→emerald, dark text, hover scale + brightness (as in AC Hero v2)
      "bg-gradient-to-r from-lime-400 to-emerald-500 text-black " +
      "hover:scale-105 hover:shadow-md hover:brightness-110",
    secondary:
      // slate border, white text, subtle lime hover bg/border (as in AC Hero v2)
      "border border-slate-600 text-white " +
      "hover:border-lime-400/60 hover:bg-lime-400/10",
    ghost:
      "bg-transparent text-white hover:bg-white/5",
  };

  const classes = [base, sizes[size], variants[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <As className={classes} {...props}>
      {children}
    </As>
  );
}
