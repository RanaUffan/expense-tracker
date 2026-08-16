import express from 'express';
import cors from 'cors';
import compression from 'compression';
import bcrypt from 'bcryptjs';
import { signToken, requireAuth, verifyGoogleToken } from './auth.js';
import { upload, uploadBufferToCloudinary, isCloudinaryConfigured } from './upload.js';
import * as db from './db.js';

// Creates the tables on cold start if they don't exist yet. Wrapped in
// try/catch so a missing/misconfigured DATABASE_URL doesn't crash the
// whole app at import time — /api/health still works, and DB-dependent
// routes fail with a clear 500 instead of the process refusing to start.
try {
  await db.ensureSchema();
} catch (err) {
  console.warn('Could not ensure DB schema (expected if DATABASE_URL is not set yet):', err.message);
}

// ---------- App setup ----------
const app = express();
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// ---------- Response shape helpers ----------
// Postgres returns snake_case columns and native Date/Numeric types;
// these map rows into the same camelCase JSON shape the frontend has
// always expected.
function mapUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

function mapExpense(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    amount: Number(row.amount),
    currency: row.currency,
    category: row.category,
    date: row.date ? new Date(row.date).toISOString().slice(0, 10) : null,
    paymentMethod: row.payment_method,
    notes: row.notes,
    receiptUrl: row.receipt_url,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

// ---------- Validation helpers ----------
function validateExpense(body) {
  const errors = [];
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push('Title is required.');
  }
  if (body.amount === undefined || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
    errors.push('Amount must be a positive number.');
  }
  if (!body.category || typeof body.category !== 'string' || !body.category.trim()) {
    errors.push('Category is required.');
  }
  return errors;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENCY_RE = /^[A-Za-z]{3}$/;
const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'Other'];

function validateDetailedExpense(body) {
  const errors = {};

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  }

  const amount = Number(body.amount);
  if (body.amount === undefined || body.amount === '' || isNaN(amount) || amount <= 0) {
    errors.amount = 'Enter a valid amount greater than 0.';
  }

  if (body.currency && !CURRENCY_RE.test(body.currency)) {
    errors.currency = 'Select a valid currency.';
  }

  if (!body.category || typeof body.category !== 'string' || !body.category.trim()) {
    errors.category = 'Category is required.';
  }

  if (!body.date) {
    errors.date = 'Date is required.';
  } else {
    const parsed = new Date(body.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (isNaN(parsed.getTime())) {
      errors.date = 'Enter a valid date.';
    } else if (parsed.getTime() > today.getTime()) {
      errors.date = 'Date cannot be in the future.';
    }
  }

  if (!body.paymentMethod || !PAYMENT_METHODS.includes(body.paymentMethod)) {
    errors.paymentMethod = 'Select a payment method.';
  }

  if (body.notes && typeof body.notes === 'string' && body.notes.length > 500) {
    errors.notes = 'Notes must be under 500 characters.';
  }

  if (body.receiptUrl) {
    if (typeof body.receiptUrl !== 'string' || !/^https?:\/\//.test(body.receiptUrl)) {
      errors.receipt = 'Receipt must be a valid uploaded file URL.';
    }
  }

  return errors;
}

// ---------- Routes ----------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ----- File upload -----

app.post('/api/uploads', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File must be smaller than 4MB.'
          : err.message || 'Upload failed.';
      return res.status(400).json({ errors: [message] });
    }
    if (!req.file) {
      return res.status(400).json({ errors: ['No file uploaded.'] });
    }
    if (!isCloudinaryConfigured) {
      return res.status(500).json({
        errors: ['File storage is not configured on the server yet.'],
      });
    }

    try {
      const result = await uploadBufferToCloudinary(req.file.buffer);
      res.status(201).json({ url: result.secure_url, publicId: result.public_id });
    } catch (uploadErr) {
      res.status(502).json({ errors: ['Upload to storage provider failed. Please try again.'] });
    }
  });
});

// ----- Auth -----

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const errors = [];
    if (!req.body.name || !req.body.name.trim()) errors.push('Name is required.');
    if (!req.body.email || !EMAIL_RE.test(req.body.email)) errors.push('A valid email is required.');
    if (!req.body.password || req.body.password.length < 8) errors.push('Password must be at least 8 characters.');
    if (errors.length) return res.status(400).json({ errors });

    const email = req.body.email.trim().toLowerCase();
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ errors: ['An account with this email already exists.'] });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await db.createUser({ name: req.body.name.trim(), email, passwordHash });

    const token = signToken(user);
    res.status(201).json({ token, user: mapUser(user) });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ errors: ['Email and password are required.'] });
    }

    const user = await db.findUserByEmail(email);
    const invalidCredentials = () =>
      res.status(401).json({ errors: ['Invalid email or password.'] });

    if (!user) return invalidCredentials();

    if (!user.password_hash) {
      return res.status(401).json({
        errors: ['This account uses Google Sign-In. Use "Continue with Google" to log in.'],
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return invalidCredentials();

    const token = signToken(user);
    res.json({ token, user: mapUser(user) });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ errors: ['Missing Google credential.'] });
    }

    let payload;
    try {
      payload = await verifyGoogleToken(credential);
    } catch {
      return res.status(401).json({ errors: ['Google sign-in failed. Please try again.'] });
    }

    let user = await db.findUserByEmail(payload.email);
    if (!user) {
      user = await db.createUser({
        name: payload.name,
        email: payload.email,
        passwordHash: null,
        googleId: payload.googleId,
      });
    } else if (!user.google_id) {
      await db.linkGoogleId(user.id, payload.googleId);
    }

    const token = signToken(user);
    res.json({ token, user: mapUser(user) });
  } catch (err) {
    next(err);
  }
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ errors: ['User not found.'] });
    res.json({ user: mapUser(user) });
  } catch (err) {
    next(err);
  }
});

// ----- Expenses (protected) -----

app.get('/api/expenses', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.listExpenses(req.user.id);
    res.json(rows.map(mapExpense));
  } catch (err) {
    next(err);
  }
});

app.post('/api/expenses', requireAuth, async (req, res, next) => {
  try {
    const errors = validateExpense(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const created = await db.createExpense(req.user.id, {
      title: req.body.title.trim(),
      amount: Number(req.body.amount),
      currency: (req.body.currency || 'USD').toUpperCase(),
      category: req.body.category.trim(),
    });

    res.status(201).json(mapExpense(created));
  } catch (err) {
    next(err);
  }
});

app.post('/api/expenses/detailed', requireAuth, async (req, res, next) => {
  try {
    const fieldErrors = validateDetailedExpense(req.body);
    if (Object.keys(fieldErrors).length) {
      return res.status(400).json({ errors: fieldErrors });
    }

    const created = await db.createExpense(req.user.id, {
      title: req.body.title.trim(),
      amount: Number(req.body.amount),
      currency: (req.body.currency || 'USD').toUpperCase(),
      category: req.body.category.trim(),
      date: req.body.date,
      paymentMethod: req.body.paymentMethod,
      notes: (req.body.notes || '').trim(),
      receiptUrl: req.body.receiptUrl || null,
    });

    res.status(201).json(mapExpense(created));
  } catch (err) {
    next(err);
  }
});

app.put('/api/expenses/:id', requireAuth, async (req, res, next) => {
  try {
    const errors = validateExpense(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const updated = await db.updateExpense(req.params.id, req.user.id, {
      title: req.body.title.trim(),
      amount: Number(req.body.amount),
      currency: (req.body.currency || 'USD').toUpperCase(),
      category: req.body.category.trim(),
    });

    if (!updated) return res.status(404).json({ errors: ['Expense not found.'] });
    res.json(mapExpense(updated));
  } catch (err) {
    next(err);
  }
});

app.delete('/api/expenses/:id', requireAuth, async (req, res, next) => {
  try {
    const ok = await db.deleteExpense(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ errors: ['Expense not found.'] });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Catches anything thrown/rejected in a route above (e.g. DATABASE_URL
// missing, or Neon momentarily unreachable) and returns clean JSON
// instead of an HTML stack trace or a hung request.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ errors: [err.message || 'Something went wrong.'] });
});

export default app;
