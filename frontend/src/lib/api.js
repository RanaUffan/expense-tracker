// Central place for talking to the backend, so the base URL only
// needs to change in one spot when moving from local dev to production.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'expense_tracker_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Thrown specifically for 401s so callers (AuthContext) can tell "your
// session expired" apart from an ordinary validation/network error.
export class AuthError extends Error {}

// Thrown for 400s that carry field-specific errors (an object keyed by
// field name), so the form can show each message next to the right
// input rather than one generic banner.
export class ValidationError extends Error {
  constructor(fieldErrors) {
    super('Validation failed');
    this.fieldErrors = fieldErrors;
  }
}

async function request(path, options = {}, { auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401 && auth) {
    clearToken();
    throw new AuthError('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.errors?.length) message = body.errors.join(' ');
    } catch {
      // response had no JSON body — keep the generic message
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  signup: (data) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  googleLogin: (credential) =>
    request('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  me: () => request('/api/auth/me', {}, { auth: true }),

  getExpenses: () => request('/api/expenses', {}, { auth: true }),
  createExpense: (data) =>
    request('/api/expenses', { method: 'POST', body: JSON.stringify(data) }, { auth: true }),
  updateExpense: (id, data) =>
    request(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }, { auth: true }),
  deleteExpense: (id) =>
    request(`/api/expenses/${id}`, { method: 'DELETE' }, { auth: true }),

  // Uses its own fetch (instead of the shared `request` helper) because
  // a 400 here means field-specific errors — the caller needs the raw
  // { field: message } object, not a single joined string.
  createDetailedExpense: async (data) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/api/expenses/detailed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      clearToken();
      throw new AuthError('Session expired. Please log in again.');
    }
    if (response.status === 400) {
      const body = await response.json();
      throw new ValidationError(body.errors || {});
    }
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return response.json();
  },
};
