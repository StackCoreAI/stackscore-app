export default function Privacy() {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 text-white/90">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm opacity-70">Last updated: Aug 17, 2025</p>
        <section className="mt-6 space-y-4">
          <p>
            StackScore (“we”, “our”) provides a digital brief that helps you organize
            credit-building apps and actions. This policy explains what we collect and how we use it.
          </p>
          <h2 className="text-xl font-semibold mt-6">Information we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-medium">Checkout details:</span> email and payment status via Stripe (we never see full card data).</li>
            <li><span className="font-medium">Answers you provide:</span> non-sensitive inputs used to generate your plan.</li>
            <li><span className="font-medium">Usage data:</span> basic analytics (page views, clicks, device/browser).</li>
          </ul>
          <h2 className="text-xl font-semibold mt-6">How we use information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Create and deliver your digital brief.</li>
            <li>Customer support and troubleshooting.</li>
            <li>Fraud prevention and compliance.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-6">Data sharing</h2>
          <p>We share data with service providers (e.g., Stripe for payments, analytics) strictly to operate the service.
          We do not sell personal information.</p>
          <h2 className="text-xl font-semibold mt-6">Your choices</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Request access or deletion: email <a className="underline" href="mailto:support@stackscore.ai">support@stackscore.ai</a>.</li>
            <li>Opt out of non-essential cookies; see our Cookie Policy.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-6">Contact</h2>
          <p>Email <a className="underline" href="mailto:support@stackscore.ai">support@stackscore.ai</a>.</p>
        </section>
      </main>
    );
  }
  