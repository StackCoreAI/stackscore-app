export default function Cookies() {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 text-white/90">
        <h1 className="text-3xl font-semibold">Cookie Policy</h1>
        <section className="mt-6 space-y-4">
          <p>We use cookies to keep you signed in (entitlement cookie), remember preferences, and measure product usage.</p>
          <h2 className="text-xl font-semibold mt-6">Types</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-medium">Strictly necessary:</span> access cookie after checkout (HttpOnly).</li>
            <li><span className="font-medium">Preferences:</span> wizard answers, selected plan.</li>
            <li><span className="font-medium">Analytics:</span> anonymized product usage.</li>
          </ul>
          <p className="mt-4">You can clear cookies in your browser settings. Some features may stop working without them.</p>
        </section>
      </main>
    );
  }
  