import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from './SignupPage';
import { AuthProvider } from '../context/AuthContext';

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

function renderSignupPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SignupPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('SignupPage', () => {
  it('renders the signup form', () => {
    renderSignupPage();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });

  it('shows an error when passwords do not match, without calling the API', async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText('Name'), 'Ayesha');
    await user.type(screen.getByLabelText('Email'), 'ayesha@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'different123');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(api.signup).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText('Name'), 'Ayesha');
    await user.type(screen.getByLabelText('Email'), 'ayesha@example.com');
    await user.type(screen.getByLabelText('Password'), '123');
    await user.type(screen.getByLabelText('Confirm password'), '123');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(api.signup).not.toHaveBeenCalled();
  });
});
