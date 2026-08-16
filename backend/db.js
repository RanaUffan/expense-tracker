import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn(
    'DATABASE_URL is not set — the API will start, but every DB call will fail. ' +
    'See backend/README.md for how to provision a free Neon Postgres database.'
  );
}

// Neon's driver works over plain HTTPS, not a persistent TCP connection —
// exactly what serverless functions need: no connection pool to manage,
// no "too many connections" errors from cold starts spinning up dozens
// of short-lived function instances.
const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

export function requireDb() {
  if (!sql) {
    const err = new Error('Database is not configured on the server.');
    err.status = 500;
    throw err;
  }
  return sql;
}

// UUIDs are generated here in Node (not via a Postgres extension like
// pgcrypto) — one less thing that has to be enabled/available on
// whatever Postgres provider is behind DATABASE_URL.
export async function ensureSchema() {
  const db = requireDb();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      google_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      category TEXT NOT NULL,
      date DATE,
      payment_method TEXT,
      notes TEXT,
      receipt_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

// ---------- Users ----------

export async function findUserByEmail(email) {
  const db = requireDb();
  const rows = await db`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return rows[0] || null;
}

export async function findUserById(id) {
  const db = requireDb();
  const rows = await db`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function createUser({ name, email, passwordHash = null, googleId = null }) {
  const db = requireDb();
  const id = randomUUID();
  const rows = await db`
    INSERT INTO users (id, name, email, password_hash, google_id)
    VALUES (${id}, ${name}, ${email}, ${passwordHash}, ${googleId})
    RETURNING *
  `;
  return rows[0];
}

export async function linkGoogleId(userId, googleId) {
  const db = requireDb();
  await db`UPDATE users SET google_id = ${googleId} WHERE id = ${userId}`;
}

// ---------- Expenses ----------

export async function listExpenses(userId) {
  const db = requireDb();
  return db`
    SELECT * FROM expenses
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
}

export async function createExpense(userId, data) {
  const db = requireDb();
  const id = randomUUID();
  const rows = await db`
    INSERT INTO expenses (id, user_id, title, amount, currency, category, date, payment_method, notes, receipt_url)
    VALUES (
      ${id}, ${userId}, ${data.title}, ${data.amount}, ${data.currency}, ${data.category},
      ${data.date || null}, ${data.paymentMethod || null}, ${data.notes || null}, ${data.receiptUrl || null}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function updateExpense(id, userId, data) {
  const db = requireDb();
  const rows = await db`
    UPDATE expenses
    SET title = ${data.title}, amount = ${data.amount}, currency = ${data.currency}, category = ${data.category}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  return rows[0] || null;
}

export async function deleteExpense(id, userId) {
  const db = requireDb();
  const rows = await db`
    DELETE FROM expenses WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length > 0;
}

// ---------- Test-only helper ----------

// Used exclusively by the backend test suite to clean up accounts it
// created (all test emails are prefixed "test-") so repeated test runs
// don't pile up rows in the real database forever.
export async function deleteTestUsers(emailPrefix) {
  const db = requireDb();
  await db`DELETE FROM users WHERE email LIKE ${emailPrefix + '%'}`;
}
