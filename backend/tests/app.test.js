import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';

// Vitest doesn't read .env files the way our `--env-file-if-exists` npm
// scripts do — load backend/.env here too (if present) so DATABASE_URL
// etc. are available. Node 20.6+ ships process.loadEnvFile() for this.
try {
  process.loadEnvFile();
} catch {
  // No local .env — fine if DATABASE_URL is already set some other way.
}

process.env.JWT_SECRET ||= 'test-secret-for-vitest';

const { default: app } = await import('../app.js');
const dbModule = await import('../db.js');

// Every test-created account uses this prefix so we can clean them all
// up afterward — these tests run against the real database (not a
// throwaway file), so leaving accounts behind would accumulate forever.
const TEST_EMAIL_PREFIX = 'vitest-';

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}${randomUUID()}@example.com`;
}

async function signUpAndGetToken(overrides = {}) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Expense Tester', email: uniqueEmail(), password: 'password123', ...overrides });
  return res.body.token;
}

afterAll(async () => {
  await dbModule.deleteTestUsers(TEST_EMAIL_PREFIX);
});

describe('GET /api/health', () => {
  it('responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/auth/signup', () => {
  it('creates a new user and returns a token (happy path)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test User', email: uniqueEmail(), password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a password shorter than 8 characters (failure case)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test', email: uniqueEmail(), password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects a duplicate email (failure case)', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/signup').send({ name: 'A', email, password: 'password123' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'B', email, password: 'password123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials (happy path)', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/signup').send({ name: 'Login Test', email, password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects an incorrect password (failure case)', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/signup').send({ name: 'Wrong Pass', email, password: 'password123' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'not-the-password' });

    expect(res.status).toBe(401);
  });
});

describe('Expense endpoints (protected)', () => {
  it('rejects fetching expenses without a token (failure case)', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });

  it('creates an expense for the authenticated user (happy path)', async () => {
    const token = await signUpAndGetToken();

    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Coffee', amount: 5, category: 'Food' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Coffee');
    expect(res.body.currency).toBe('USD');
  });

  it('rejects an expense with a missing title (failure case)', async () => {
    const token = await signUpAndGetToken();

    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5, category: 'Food' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('Title is required.');
  });

  it('only returns the current users own expenses', async () => {
    const tokenA = await signUpAndGetToken();
    const tokenB = await signUpAndGetToken();

    await request(app).post('/api/expenses').set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Belongs to A', amount: 12, category: 'Food' });

    const resB = await request(app).get('/api/expenses').set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    expect(resB.body).toEqual([]);
  });

  it('deletes an expense and it no longer appears in the list', async () => {
    const token = await signUpAndGetToken();

    const created = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete', amount: 1, category: 'Other' });

    const del = await request(app)
      .delete(`/api/expenses/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const list = await request(app).get('/api/expenses').set('Authorization', `Bearer ${token}`);
    expect(list.body.find((e) => e.id === created.body.id)).toBeUndefined();
  });
});
