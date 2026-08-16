import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import '../components/AuthForm.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_RE.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export default function SignupPage() {
  useDocumentTitle('Sign up');
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleCredential = async (credential) => {
    setGoogleLoading(true);
    setSubmitError('');
    try {
      await loginWithGoogle(credential);
      navigate('/expenses', { replace: true });
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
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate('/expenses', { replace: true });
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
        <h1 className="auth-form__title">Create your account</h1>
        <p className="auth-form__subtitle">Start tracking your expenses in seconds.</p>

        <div className="auth-form__fields">
          <div className="auth-form__field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name && <span className="auth-form__field-error">{fieldErrors.name}</span>}
          </div>

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
            {fieldErrors.password ? (
              <span className="auth-form__field-error">{fieldErrors.password}</span>
            ) : (
              <span className="auth-form__hint">At least 8 characters.</span>
            )}
          </div>

          <div className="auth-form__field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
            {fieldErrors.confirmPassword && (
              <span className="auth-form__field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button className="auth-form__submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
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
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
