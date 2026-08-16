import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthProvider } from '../context/AuthContext';

// The real api.js would make network calls — mock it so this test
// exercises only LoginPage's client-side validation, with nothing
// reaching (or needing) a real backend.
vi.mock('../lib/api', () => ({
  api: {
    login: vi.fn(),
    signup: vi.fn(),
    googleLogin: vi.fn(),
    me: vi.fn(),
  },
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  AuthError: class AuthError extends Error {},
  ValidationError: class ValidationError extends Error {},
}));

import { api } from '../lib/api';

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderLoginPage();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows field-specific validation errors when submitted empty, without calling the API', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  it('shows an email-format error for an invalid address', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });
});
