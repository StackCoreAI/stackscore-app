export default function Refund() {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 text-white/90">
        <h1 className="text-3xl font-semibold">Refund Policy</h1>
        <p className="mt-2 text-sm opacity-70">Digital product / one-time purchase</p>
        <section className="mt-6 space-y-4">
          <p>
            Your purchase grants immediate access to a downloadable digital brief (PDF + web).
            Because delivery is instant, refunds are generally not provided.
          </p>
          <h2 className="text-xl font-semibold mt-6">We will issue a refund if…</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>You were charged but could not access your brief (technical failure) and support cannot resolve within 72 hours.</li>
            <li>Duplicate purchases within 7 days.</li>
          </ul>
          <p className="mt-4">To request a review, email <a className="underline" href="mailto:support@stackscore.ai">support@stackscore.ai</a> with your order email and session ID.</p>
          <p className="mt-4 text-sm opacity-70">StackScore provides educational information only; not financial advice.</p>
        </section>
      </main>
    );
  }
  