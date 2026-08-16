import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import '../components/AuthForm.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.password) errors.password = 'Password is required.';
  return errors;
}

export default function LoginPage() {
  useDocumentTitle('Log in');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectAfterAuth = () => {
    const redirectTo = location.state?.from || '/expenses';
    navigate(redirectTo, { replace: true });
  };

  const handleGoogleCredential = async (credential) => {
    setGoogleLoading(true);
    setSubmitError('');
    try {
      await loginWithGoogle(credential);
      redirectAfterAuth();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      await login(form);
      redirectAfterAuth();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <p className="auth-form__eyebrow">Ledger</p>
        <h1 className="auth-form__title">Welcome back</h1>
        <p className="auth-form__subtitle">Log in to see your expenses.</p>

        <div className="auth-form__fields">
          <div className="auth-form__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && <span className="auth-form__field-error">{fieldErrors.email}</span>}
          </div>

          <div className="auth-form__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password && <span className="auth-form__field-error">{fieldErrors.password}</span>}
          </div>

          <button className="auth-form__submit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </div>

        {submitError && <p className="auth-form__error" role="alert">{submitError}</p>}

        <div className="auth-form__divider"><span>or</span></div>

        <div className="auth-form__google">
          {googleLoading ? (
            <p className="auth-form__hint">Signing in…</p>
          ) : (
            <GoogleButton onCredential={handleGoogleCredential} onError={setSubmitError} />
          )}
        </div>

        <p className="auth-form__footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
