# Expense Tracker — Full-Stack CRUD App

A complete full-stack loop: a self-built REST API (Node.js + Express) with
JWT authentication, connected to a React frontend with signup/login, global
state via Context API, a multi-field expense form with dual-layer
validation, and a proper drag-and-drop file upload connected to Cloudinary.

**Live demo:** https://expense-tracker-amber-two-10.vercel.app
**API:** https://expense-tracker-api-ochre-rho.vercel.app

## Structure

```
expense-tracker/
├── backend/     → Express REST API (see backend/README.md)
├── frontend/    → React UI (see frontend/README.md)
└── e2e/         → Playwright end-to-end tests (see below)
```

## Architecture overview

```
┌─────────────────┐        HTTPS / JWT         ┌──────────────────────┐
│   React (Vite)   │ ─────────────────────────▶ │  Express API          │
│   Vercel (static) │ ◀───────────────────────── │  Vercel (serverless)  │
└─────────────────┘         JSON responses       └──────────┬───────────┘
        │                                                    │
        │ Google Identity Services (OAuth token)             │ SQL (HTTPS)
        ▼                                                    ▼
┌─────────────────┐                              ┌──────────────────────┐
│   Google OAuth    │                              │  Postgres (Neon)       │
└─────────────────┘                              │  (persistent)          │
                                                   └──────────────────────┘
        Frontend also uploads receipt images
        directly through the backend to:
                    │
                    ▼
        ┌──────────────────────┐
        │  Cloudinary            │
        │  (persistent storage)  │
        └──────────────────────┘
```

- **Frontend** and **backend** are two independent projects, deployed as
  two separate Vercel projects, communicating only over HTTPS via
  `VITE_API_URL` — either could be redeployed, scaled, or replaced without
  touching the other.
- **Auth**: the backend issues a JWT on signup/login (or after verifying a
  Google ID token); the frontend stores it and attaches it to every
  protected request. No server-side session state — the token itself is
  the credential, which is why this scales cleanly on serverless (no
  shared session store needed).
- **Data**: a real Postgres database (Neon's serverless driver — works over
  HTTPS, no persistent connection pool to manage from a serverless
  function). Data is identical across every device/browser you log in
  from, and survives redeploys — see `backend/README.md` for setup.
- **File storage**: receipt images never touch the database or the
  serverless filesystem — they're streamed straight to Cloudinary, and
  only the resulting URL is stored.

## Features

- **Auth** — signup/login with hashed passwords (bcrypt), JWT sessions,
  "Continue with Google", and a protected `/expenses` route.
- **CRUD** — full create/read/update/delete for expenses, scoped per user.
- **Multi-currency** — 40 currencies, with per-currency totals in the header.
- **Detailed expense form** — date, payment method, notes, and a receipt
  image, all validated client-side AND server-side independently.
- **File upload** — a drag-and-drop image uploader with a live progress bar,
  connected to a backend endpoint that stores files on Cloudinary.
- **Analytics dashboard** — bar, line, and donut charts (Recharts) plus stat
  cards, with interactive currency/category/date-range filters.
- **Global state (Context API)** — expense data and toast notifications are
  shared across pages instead of prop-drilled.
- **Loading/empty states everywhere** — skeleton loaders, spinners, and
  explicit empty states; no blank screens while data loads.

## Running both locally

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev      # runs on http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev       # runs on http://localhost:5173
```

The frontend reads the backend URL from `VITE_API_URL` in `frontend/.env`.

## Setting up file uploads (Cloudinary)

Receipt images are stored on [Cloudinary](https://cloudinary.com) — free,
no credit card required for the tier this app needs.

1. Sign up at [cloudinary.com](https://cloudinary.com/users/register/free).
2. On your dashboard, copy three values: **Cloud name**, **API Key**, and
   **API Secret**.
3. Add them as backend environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
   (Locally: create `backend/.env` — see `backend/.env.example`. On Vercel:
   Project → Settings → Environment Variables.)

Without this, the rest of the app works fine — the upload endpoint just
returns a clear "not configured" error instead of silently failing.

## Setting up "Continue with Google"

See `frontend/README.md` for the Google Cloud Console steps — same idea as
Cloudinary above: get a Client ID, add it as an env var in both the frontend
and backend, and the button appears automatically.

## Performance & SEO

Fixes made after running a Lighthouse audit on the deployed frontend:

1. **Code-split the two heaviest routes.** `DashboardPage` (which pulls in
   Recharts) and `NewExpensePage` are lazy-loaded (`React.lazy` +
   `Suspense`) instead of bundled into the main chunk. This cut the main
   JS bundle from **673KB → 252KB** (**~198KB → ~80KB gzipped**) — the
   pages most people hit first (login, then the expense list) no longer
   download charting code they may never use.
2. **Per-page document titles.** Previously every route showed the same
   static `<title>Expense Tracker</title>`; each page now sets its own
   (`Log in · Expense Tracker`, `Dashboard · Expense Tracker`, etc.) via a
   small `useDocumentTitle` hook — better for SEO snippets, browser
   history, and multi-tab navigation.
3. **SEO/meta essentials**: a proper `meta description`, Open Graph tags,
   `theme-color`, and a `robots.txt` that allows crawling the public
   login/signup pages while disallowing the authenticated app pages
   (nothing behind login is meaningful to index).
4. **Images**: descriptive `alt` text (e.g. `"Receipt for Team Lunch"`,
   not just `"Receipt"`) and `loading="lazy"` on receipt thumbnails in the
   list, since they're often below the fold.
5. **Gzip compression** on all backend API responses (`compression`
   middleware) — smaller JSON payloads, particularly as the expense list
   grows.

### Running your own Lighthouse audit

1. Open the deployed frontend in Chrome.
2. DevTools (F12) → **Lighthouse** tab → run an audit (or use
   [PageSpeed Insights](https://pagespeed.web.dev) with the live URL
   directly — no DevTools needed).
3. Compare Performance/SEO/Best Practices/Accessibility scores before and
   after the fixes above.

## Mobile & desktop verification

After deploying, confirm on the **live URL** (not just localhost):
- Resize the browser / use Chrome DevTools' device toolbar to check
  common breakpoints (360px, 768px, 1280px+).
- On an actual phone, check: the amount+currency input group doesn't
  overflow, chart cards in `/dashboard` stack to one column, and the
  file-upload dropzone is usable with touch (the click-to-browse
  fallback handles this, since touch devices don't support drag-and-drop).

## Testing

Three separate test suites, one per layer:

### Backend (11 tests — Vitest + Supertest)

Hits the real Express app in-memory (no server actually listening, no
real network) against a throwaway database file, covering auth
(signup/login, happy path + failure cases) and expense CRUD (including
that one user can never see another user's expenses).

```bash
cd backend
npm install
npm test
```

### Frontend (18 tests — Vitest + React Testing Library)

Component rendering, user interactions (typing, clicking, form
submission), and client-side validation — across `EmptyState`,
`StatCards`, `ExpenseRow`, `ExpenseForm`, `LoginPage`, and `SignupPage`.
The API module is mocked, so these run fully offline — no backend needed.

```bash
cd frontend
npm install
npm test
```

### End-to-end (Playwright)

A real browser drives the actual app against the actual backend,
simulating a full user flow: sign up → land on the dashboard → add an
expense → see it appear in the list, with no page reload. A second test
confirms an unauthenticated visitor is redirected away from `/expenses`.

Playwright automatically starts both the backend and frontend dev servers
before running (see `e2e/playwright.config.js`), so you don't need them
running separately first.

```bash
cd e2e
npm install
npx playwright install chromium   # one-time browser download
npm test
```

(`npm run test:ui` opens Playwright's interactive UI mode, useful for
watching the browser step through the flow live.)
