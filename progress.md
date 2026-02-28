# StackScore Closeout Progress

## Today’s Status
- [x] Git working on new Mac
- [x] Node/npm installed
- [x] Dev stack running (WEB 5173, API 3001)

## Feature 1: Capture
- [ ] Identify stepper entry component
- [ ] Confirm storage keys + payload shape
- [ ] Confirm refresh persistence

## Feature 2: Generate
- [ ] Identify API endpoint used for generate-plan
- [ ] Confirm request payload from UI
- [ ] Confirm response matches Plan Contract
- [ ] Confirm fallback works when GPT is off

## Feature 3: Render
- [ ] Identify plan renderer component/page
- [ ] Confirm Plan A/B/C renders without errors
- [ ] Confirm plan switch UI

## Feature 4: Substitutes
- [ ] Identify substitute mapping logic (where it lives)
- [ ] Confirm substitutes in UI
- [ ] Confirm substitutes in export (if used)

## Feature 5: Paywall
- [ ] Identify Stripe/unlock mechanism
- [ ] Confirm locked vs unlocked UI
- [ ] Persist unlock state

## Tests (Lightweight)
- [ ] API returns valid JSON for sample profile
- [ ] Renderer handles valid JSON + fallback JSON
- [ ] Locked state hides steps until unlocked
