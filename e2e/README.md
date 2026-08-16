# Expense Tracker — End-to-End Tests

Playwright tests that drive a real browser against the real app (both the
backend and frontend, running for real — not mocked), simulating actual
user flows.

## What's covered

`tests/user-flow.spec.js`:

1. **Sign up → add an expense → see it appear.** A brand-new user signs up
   through the real form, lands on the protected dashboard, adds an expense,
   and the test confirms it renders in the list — with no manual reload.
2. **Protected route enforcement.** An unauthenticated visit to `/expenses`
   is confirmed to redirect to `/login`.

## Running

```bash
npm install
npx playwright install chromium   # one-time browser download (~300MB)
npm test
```

Playwright's `webServer` config (`playwright.config.js`) automatically
starts both `../backend` and `../frontend` in dev mode before the tests
run, and reuses them if you already have them running in your own
terminals. The backend connects to the same Postgres database as everything
else (via `backend/.env`'s `DATABASE_URL`); each run creates a clearly
`e2e-`-prefixed test account so it's easy to tell apart from real data.

## Interactive mode

```bash
npm run test:ui
```

Opens Playwright's UI mode — watch the browser step through the whole
flow live, replay any step, and inspect the DOM at each point. Useful for
debugging a failing test, and for recording a demo video.
