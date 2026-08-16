import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ValidationError, AuthError } from '../lib/api';
import { CURRENCIES } from '../lib/currencies';
import { CATEGORIES, PAYMENT_METHODS, todayStr } from '../lib/constants';
import { useExpenses } from '../context/ExpensesContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import FileUpload from '../components/FileUpload';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import './NewExpensePage.css';

const emptyForm = {
  title: '',
  amount: '',
  currency: 'USD',
  category: 'Food',
  customCategory: '',
  date: todayStr(),
  paymentMethod: 'Card',
  notes: '',
  receiptUrl: null,
};

// Mirrors the backend's validateDetailedExpense rules — instant,
// field-specific feedback client-side. The server independently
// re-checks all of it (never trust the client alone). The receipt
// itself isn't validated here since FileUpload already rejects bad
// files before an upload is even attempted.
function validate(form) {
  const errors = {};

  if (!form.title.trim() || form.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  }

  const amount = Number(form.amount);
  if (form.amount === '' || isNaN(amount) || amount <= 0) {
    errors.amount = 'Enter a valid amount greater than 0.';
  }

  if (form.category === 'Other' && !form.customCategory.trim()) {
    errors.category = 'Enter a custom category name.';
  } else if (!form.category) {
    errors.category = 'Category is required.';
  }

  if (!form.date) {
    errors.date = 'Date is required.';
  } else if (form.date > todayStr()) {
    errors.date = 'Date cannot be in the future.';
  }

  if (!form.paymentMethod) {
    errors.paymentMethod = 'Select a payment method.';
  }

  if (form.notes.length > 500) {
    errors.notes = 'Notes must be under 500 characters.';
  }

  return errors;
}

export default function NewExpensePage() {
  useDocumentTitle('Add expense');
  const navigate = useNavigate();
  const { addExpense } = useExpenses();
  const { showToast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      showToast('error', 'Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createDetailedExpense({
        title: form.title.trim(),
        amount: form.amount,
        currency: form.currency,
        category: form.category === 'Other' ? form.customCategory.trim() : form.category,
        date: form.date,
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim(),
        receiptUrl: form.receiptUrl || undefined,
      });
      addExpense(created);
      showToast('success', 'Expense added successfully.');
      resetForm();
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.fieldErrors);
        showToast('error', 'The server rejected some fields — see below.');
      } else if (err instanceof AuthError) {
        showToast('error', err.message);
        navigate('/login');
      } else {
        showToast('error', err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isOtherCategory = form.category === 'Other';

  return (
    <>
      <Header />
      <div className="new-expense-page">
        <div className="container new-expense-page__inner">
          <Link to="/expenses" className="new-expense-page__back">← Back to expenses</Link>

          <p className="new-expense-page__eyebrow">Ledger</p>
          <h1 className="new-expense-page__title">Add a detailed expense</h1>
          <p className="new-expense-page__subtitle">
            Attach a receipt, pick a date, and note how you paid.
          </p>

          <form className="detail-form" onSubmit={handleSubmit} noValidate>
            <div className="detail-form__grid">
              <div className="detail-form__field detail-form__field--span2">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Team lunch with client"
                  value={form.title}
                  onChange={handleChange('title')}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.title)}
                />
                {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
              </div>

              <div className="detail-form__field">
                <label htmlFor="amount">Amount</label>
                <div className="detail-form__amount-group">
                  <select
                    value={form.currency}
                    onChange={handleChange('currency')}
                    disabled={submitting}
                    aria-label="Currency"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleChange('amount')}
                    disabled={submitting}
                    aria-invalid={Boolean(fieldErrors.amount)}
                  />
                </div>
                {fieldErrors.amount && <span className="field-error">{fieldErrors.amount}</span>}
              </div>

              <div className="detail-form__field">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  max={todayStr()}
                  onChange={handleChange('date')}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.date)}
                />
                {fieldErrors.date && <span className="field-error">{fieldErrors.date}</span>}
              </div>

              <div className="detail-form__field">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={handleChange('category')}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.category)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
              </div>

              {isOtherCategory && (
                <div className="detail-form__field">
                  <label htmlFor="customCategory">Custom category</label>
                  <input
                    id="customCategory"
                    type="text"
                    placeholder="Type your own category…"
                    value={form.customCategory}
                    onChange={handleChange('customCategory')}
                    disabled={submitting}
                    autoFocus
                  />
                </div>
              )}

              <div className="detail-form__field">
                <label htmlFor="paymentMethod">Payment method</label>
                <select
                  id="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange('paymentMethod')}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.paymentMethod)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {fieldErrors.paymentMethod && <span className="field-error">{fieldErrors.paymentMethod}</span>}
              </div>

              <div className="detail-form__field detail-form__field--span2">
                <label htmlFor="receipt">Receipt (optional)</label>
                <FileUpload
                  value={form.receiptUrl}
                  onUploaded={(url) => setForm((f) => ({ ...f, receiptUrl: url }))}
                  disabled={submitting}
                />
              </div>

              <div className="detail-form__field detail-form__field--span2">
                <label htmlFor="notes">
                  Notes (optional) <span className="detail-form__counter">{form.notes.length}/500</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Any extra context…"
                  value={form.notes}
                  onChange={handleChange('notes')}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.notes)}
                />
                {fieldErrors.notes && <span className="field-error">{fieldErrors.notes}</span>}
              </div>
            </div>

            <button className="detail-form__submit" type="submit" disabled={submitting}>
              {submitting && <span className="detail-form__spinner" aria-hidden="true" />}
              {submitting ? 'Saving…' : 'Add expense'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
