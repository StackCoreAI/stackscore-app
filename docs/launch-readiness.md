# CreditRoute Launch Readiness

CreditRoute is in launch-finalization mode. Production fulfillment is considered working and should not be rebuilt or refactored during launch checks.

## Production Smoke Test

Run one clean smoke test after each production deployment and record the session ID, guide URL, and email timestamp.

| Step | Pass condition | Evidence to capture |
| --- | --- | --- |
| Checkout | Stripe checkout completes successfully. | Checkout session ID. |
| Webhook | `stripe-webhook` returns `200`. | Netlify function log timestamp and event type. |
| Success page | `/success` opens the protected guide. | Final guide URL opened from success page. |
| Guide handoff | Guide URL preserves both `t` and `session_id`. | Full guide URL with values redacted. |
| PDF export | Download PDF button returns a PDF. | HTTP status and downloaded filename. |
| Delivery email | Email sends from `route@creditroute.com`. | Resend event timestamp and recipient. |
| PDF attachment | Attached PDF opens. | Attachment filename. |
| Email download link | Email link downloads the PDF directly. | Link status and downloaded filename. |

If any step fails, stop and fix only the failing component. Do not alter session, payment, webhook, export, or email logic as part of routine launch verification.

## Operational Logging

Current production logs should be enough for launch verification:

- `stripe-webhook` logs trigger, env check, parsed event, delivery completion or failure, and completion status.
- `verify-guide-token` returns the verified `session_id` used by the guide handoff.
- `export-plan-pdf` logs PDF launch and export failures.
- The guide logs blocked PDF downloads when a paid session is missing.

Add logging only when a smoke-test failure cannot be diagnosed from the existing Netlify, Stripe, and Resend records.

## First Launch Channels

Prioritize Facebook and Google for first launch distribution. Reddit is not a first-wave channel.

Facebook support items:

- Confirm Meta pixel/page event coverage for landing, checkout click, and purchase if configured outside the repo.
- Prepare one plain-language launch post and one shorter retargeting variant.
- Use the smoke-tested production URL only.
- Keep support replies focused on payment receipt, protected guide access, and email/PDF delivery.

Google support items:

- Confirm Google Ads conversion action and destination URL before sending traffic.
- Prepare search copy around "credit builder plan", "credit repair guide", and "build credit checklist".
- Use the smoke-tested production URL only.
- Monitor checkout starts, paid sessions, webhook completion, and Resend delivery for the first traffic window.
