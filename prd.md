# StackScore MVP PRD (Closeout)

## MVP Definition (Locked)
User completes onboarding stepper → generates Plan A/B/C (JSON) → plan renders cleanly → substitutes available → paywall unlocks full steps.

## Feature 1: Capture (Stepper → Storage)
Acceptance:
- Stepper loads on localhost:5173
- User can complete stepper without errors
- Answers persist (localStorage OR DB) and survive refresh
- One function returns normalized userProfile payload for plan generation

## Feature 2: Generate (Plan JSON)
Acceptance:
- Clicking “Generate Plan” calls API (local dev: localhost:3001)
- API returns valid JSON conforming to the Plan Contract
- If GPT fails, a deterministic fallback plan is returned (no blank state)

## Feature 3: Render (Plan UI)
Acceptance:
- Plan A/B/C renders without console errors
- Each plan shows apps + rationale + steps
- User can switch between plans without regeneration

## Feature 4: Substitutes
Acceptance:
- Each recommended app includes 1–3 substitutes
- Substitutes render in UI and are included in exported outputs (if any)
- If an app is unavailable, UI can suggest substitutes without breaking

## Feature 5: Paywall (Unlock Full Steps)
Acceptance:
- Free tier shows plan names + partial content (teaser)
- Locked content is visibly gated
- After unlock, full steps appear and persist across refresh

## Non-Goals (MVP Exclusions)
- No full vendor/app monitoring
- No heavy analytics pipeline
- No deep personalization beyond plan rules + GPT output
