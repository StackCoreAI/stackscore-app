# CreditRoute Repo Operating Model

CreditRoute uses a two-repo operating model for launch.

## Repo A: Production App

- Repository: `StackCoreAI/stackscore-app`
- Local path: `/Users/ejosephmartin/Documents/stackscore-app`
- Production branch: `main`
- Role: production app, checkout, Stripe, webhook, guide, PDF, email delivery, fulfillment, protected downloads, and session validation.

Repo A is launch-stable. Treat the fulfillment path as frozen unless a production smoke test fails. Distribution experiments, ad-copy tests, market-language changes, signal extraction, and campaign hooks should not modify checkout, webhook, session validation, protected guide access, PDF export, or delivery email logic.

## Repo B: Launch, Signal, And Content

- Current repository: `jxplex/creditroute`
- Local path: `/Users/ejosephmartin/Projects/creditroute`
- Observed branch: `recovery/path-a-clean`
- Role: launch assets, hooks, ad copy, campaign tests, signal extraction, market language, and Facebook/Google launch materials.

Repo B is the iteration space for distribution and signal work. Repo B outputs may inform copy, campaign assets, and launch support docs, but they should be promoted into Repo A only through deliberate, small, reviewed changes that do not touch fulfillment logic.

## Promotion Rules

- Keep Stripe, webhook, session, guide access, PDF generation, protected download, and Resend delivery changes out of distribution experiments.
- Use Repo B for creative tests, hook variants, market language, content snippets, signal pipelines, and channel-specific launch materials.
- Promote only finalized, production-safe copy or documentation into Repo A.
- If a fulfillment smoke test fails, fix only the failing production component in Repo A and record the reason.

## First Launch Channels

Prioritize Facebook and Google as the first distribution channels. Reddit is not a first-wave launch channel.

Suggested Repo B folders for channel work:

- `facebook/` for hooks, ad copy, comments/replies, and creative briefs.
- `google/` for search terms, ad groups, headlines, descriptions, and landing-message tests.
- `signals/` for reusable signal extraction outputs.
- `launch-assets/` for approved creative and campaign support materials.
