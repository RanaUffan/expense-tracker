# Expense Tracker — Frontend

A React UI for the Expense Tracker API — auth, CRUD, a detailed multi-field
form with a drag-and-drop file upload, and global state via Context API.

## Dashboard & charts

`/dashboard` (protected) visualizes the current user's expenses with
[Recharts](https://recharts.org):

- **Stat cards** — total spent, expense count, average per expense, top category
- **Bar chart** — spending by category
- **Donut chart** — category breakdown as a share of total
- **Line chart** — spending over time

**Data flow:** the raw expense list already lives in `ExpensesContext`
(fetched from the backend); `lib/expenseAnalytics.js` does the aggregation
entirely client-side — filtering, grouping by category/date, and computing
stats — so no separate backend endpoint was needed for this task.

**Filters** (all interactive, all recompute every chart instantly):
- **Currency** — since amounts in different currencies can't be summed
  meaningfully, charts always show one currency at a time.
- **Category** — toggle individual categories on/off via chips, or "All".
- **Date range** — quick presets (7D/30D/90D/All time) or custom from/to dates.

**Responsive:** every chart is wrapped in Recharts' `ResponsiveContainer`, and
the two-column chart grid collapses to one column under 800px so nothing
overflows or gets squeezed on mobile.

## Project structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx / .css        → title, nav links, running total, signed-in user, logout
│   │   ├── ExpenseForm.jsx / .css   → quick-add / edit form
│   │   ├── ExpenseList.jsx / .css   → renders a list of ExpenseRow
│   │   ├── ExpenseRow.jsx / .css    → single expense: edit/delete, receipt thumbnail + link
│   │   ├── FileUpload.jsx / .css    → drag-and-drop uploader with progress bar
│   │   ├── LoadingState.jsx / .css  → skeleton rows while fetching
│   │   ├── ErrorState.jsx / .css    → fetch-failure message + retry
│   │   ├── EmptyState.jsx / .css    → "no expenses yet" message
│   │   ├── Toast.jsx / .css         → success/error notification, auto-dismisses
│   │   ├── GoogleButton.jsx         → renders Google's official sign-in button
│   │   ├── AuthForm.css             → shared styling for login/signup
│   │   ├── ProtectedRoute.jsx / .css → redirects to /login if not authenticated
│   │   └── dashboard/
│   │       ├── DashboardFilters.jsx / .css → currency/category/date-range filters
│   │       ├── StatCards.jsx / .css        → total/count/average/top-category cards
│   │       ├── ChartCard.jsx / .css        → shared title + empty-state wrapper
│   │       ├── CategoryBarChart.jsx        → spending by category
│   │       ├── CategoryPieChart.jsx        → category breakdown donut
│   │       └── SpendingLineChart.jsx       → spending over time
│   ├── pages/
│   │   ├── LoginPage.jsx            → email/password + Google + validation
│   │   ├── SignupPage.jsx           → name/email/password/confirm + Google + validation
│   │   ├── ExpensesPage.jsx         → protected dashboard (quick-add form + list)
│   │   ├── NewExpensePage.jsx       → detailed multi-field form (date, receipt, notes)
│   │   └── DashboardPage.jsx        → charts + filters
│   ├── context/
│   │   ├── AuthContext.jsx          → global auth state: user, login, signup, logout
│   │   ├── ExpensesContext.jsx      → global expense data + CRUD
│   │   └── ToastContext.jsx         → global toast notifications
│   ├── lib/
│   │   ├── api.js                   → fetch wrapper; attaches JWT to protected calls
│   │   ├── currencies.js            → currency list + money formatting
│   │   ├── constants.js             → shared category/payment-method lists
│   │   ├── expenseAnalytics.js      → filtering + aggregation for the dashboard
│   │   └── chartColors.js           → categorical color palette for charts
│   ├── App.jsx                      → routes, wrapped in the three providers
│   ├── main.jsx                     → wraps the app in BrowserRouter
│   └── index.css                    → design tokens
└── index.html
```

## File upload component

`FileUpload` is self-contained — it owns its own drag/drop state, does
client-side validation (image type, ≤4MB) before ever touching the network,
shows an instant local preview via `FileReader` while the real upload runs
in the background, tracks upload progress with `XMLHttpRequest`'s
`upload.onprogress` (native `fetch` doesn't expose upload progress), and
hands the parent only the final hosted URL once the backend confirms it's
stored — the parent (`NewExpensePage`) never touches a `File` object at all.

## Global state (Context API)

Three providers wrap the app: `AuthProvider → ToastProvider →
ExpensesProvider`.

**`ExpensesContext`** holds the expense list, its status, and the
create/update/delete actions — shared between `ExpensesPage`,
`NewExpensePage`, and `Header`. Adding an expense on `/expenses/new` updates
the list immediately; going back to `/expenses` shows it with no extra
fetch. `Header` reads the total straight from context, so it needs zero
props and can render on either page.

**`ToastContext`** is one global `showToast(type, message)`, used by both
`ExpensesPage` and `NewExpensePage` instead of each page managing its own
toast state (or, worse, falling back to `alert()`).

**Kept local, deliberately:** `editingExpense` and form field state — only
one screen ever needs them, so they stay as plain `useState`.

## Environment variables

```
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Running locally

```bash
npm install
npm run dev
```

## Testing

```bash
npm test
```

18 tests (Vitest + React Testing Library) across 6 files:

- `EmptyState`, `StatCards` — rendering
- `ExpenseRow` — rendering + click interactions (edit/delete callbacks,
  disabled state while deleting)
- `ExpenseForm` — typing, submission payload, error display, loading state
- `LoginPage`, `SignupPage` — client-side validation (empty fields, bad
  email format, password rules, mismatched confirm-password), confirming
  the API is never called when validation fails

The `../lib/api` module is mocked in the page tests, so the whole suite
runs offline — no backend required.

## Building for production

```bash
npm run build
```
