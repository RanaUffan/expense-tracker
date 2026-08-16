# Expense Tracker — Backend

A REST API built with Node.js, Express, Postgres (via Neon's serverless
driver), JWT auth, and Cloudinary for file storage.

## Endpoints

| Method | Path                     | Auth | Description |
|--------|--------------------------|:---:|--------------|
| GET    | `/api/health`             |  | Health check |
| POST   | `/api/auth/signup`        |  | Create an account, returns a JWT |
| POST   | `/api/auth/login`         |  | Log in, returns a JWT |
| POST   | `/api/auth/google`        |  | Log in / sign up with a Google ID token |
| GET    | `/api/auth/me`            | ✅ | Returns the current user |
| POST   | `/api/uploads`            | ✅ | Upload an image (multipart), returns its Cloudinary URL |
| GET    | `/api/expenses`           | ✅ | List the current user's expenses (newest first) |
| POST   | `/api/expenses`           | ✅ | Create an expense (quick-add) |
| POST   | `/api/expenses/detailed`  | ✅ | Create an expense with date, payment method, notes, receipt URL — field-specific validation errors |
| PUT    | `/api/expenses/:id`       | ✅ | Update an expense |
| DELETE | `/api/expenses/:id`       | ✅ | Delete an expense |

Protected routes expect `Authorization: Bearer <token>`.

All responses are gzip-compressed (`compression` middleware) — smaller
JSON payloads over the wire, especially as the expense list grows.

## Database (Postgres via Neon)

Data is stored in a real, persistent Postgres database — not a JSON file —
so it survives cold starts, redeploys, and is the same data no matter
which device or browser you log in from. `db.js` owns all the SQL; `app.js`
never touches the database directly.

Two tables (`users`, `expenses`), created automatically on first request if
they don't exist yet (`ensureSchema()` in `db.js`) — no manual migration
step needed.

### Setting up a free database (Neon)

1. Sign up free at [neon.tech](https://neon.tech) (or, if deploying to
   Vercel, use **Storage → Create Database → Postgres (powered by Neon)**
   directly from your Vercel project — it auto-fills the env var for you).
2. Copy the connection string it gives you (looks like
   `postgresql://user:password@ep-xxxx.aws.neon.tech/neondb?sslmode=require`).
3. Add it as `DATABASE_URL`:
   - Locally: `backend/.env` — see `backend/.env.example`.
   - On Vercel: Project → Settings → Environment Variables.

Without `DATABASE_URL` set, the server still starts (so `/api/health`
works), but every DB-dependent route returns a clear `500` explaining
what's missing, instead of crashing.

## File uploads

`POST /api/uploads` accepts a single file under the field name `file`
(`multipart/form-data`). It's validated **server-side** independently of
whatever the frontend already checked:

- **Type**: rejected via `multer`'s `fileFilter` unless the MIME type starts
  with `image/`.
- **Size**: capped at 4MB via `multer`'s `limits.fileSize` (kept under
  Vercel's ~4.5MB serverless request-body limit).

The file is held in memory (never written to disk) and streamed straight to
Cloudinary. The response is `{ url, publicId }`; only the `url` is stored
on the expense record.

If Cloudinary isn't configured (missing env vars), the endpoint returns a
clear `500` with an explanatory message rather than crashing.

## Environment variables

DATABASE_URL=postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require
JWT_SECRET=some-long-random-string
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

See above for `DATABASE_URL`, and the root `README.md` for Cloudinary and
Google. `JWT_SECRET` can be any long random string you generate yourself.

## Running locally

```bash
npm install
npm run dev
```

Runs on `http://localhost:4000`.

## Testing

```bash
npm test
```

11 tests (Vitest + Supertest), covering: signup (happy path, weak
password, duplicate email), login (happy path, wrong password), and
expense CRUD (create, validation failure, create-then-list, delete,
plus confirming one user never sees another user's expenses).

These run against the **real Postgres database** pointed to by
`DATABASE_URL` (loaded from `backend/.env` automatically) — every test
account is created with a `vitest-` email prefix, and an `afterAll` hook
deletes all of them once the suite finishes, so repeated runs don't leave
data behind.

## Deploying (Vercel)

This backend runs both locally (`server.js`) and as a Vercel serverless
function (`api/index.js` exports the same Express app; `vercel.json` routes
all requests to it).

1. Push this `backend` folder to GitHub.
2. In Vercel: **Add New → Project** → import the repo.
3. Set **Root Directory** to `backend`.
4. Add the environment variables listed above (or provision `DATABASE_URL`
   directly via Vercel's Storage tab — see above).
5. Framework preset: **Other** (Vercel detects `api/index.js` automatically).
6. Deploy.

Because the database is a real external Postgres instance (not local disk),
data is identical and available immediately across every device, browser,
and deployment — no more "added it on my laptop, don't see it on my phone."