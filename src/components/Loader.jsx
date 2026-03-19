export default function Loader({ label = "Building your Credit Route…" }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-6"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-ping rounded-full border-4 border-slate-300" />
        <div className="absolute inset-2 animate-pulse rounded-full border-4 border-slate-400" />
      </div>
      <p className="text-slate-600">{label}</p>
    </div>
  );
}