import { useState, useEffect } from 'react';
import { CURRENCIES } from '../lib/currencies';
import './ExpenseForm.css';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Other'];
const emptyForm = { title: '', amount: '', currency: 'USD', category: 'Food', customCategory: '' };

export default function ExpenseForm({ editingExpense, onSubmit, onCancelEdit, submitting, error }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingExpense) {
      const isKnownCategory = CATEGORIES.includes(editingExpense.category);
      setForm({
        title: editingExpense.title,
        amount: String(editingExpense.amount),
        currency: editingExpense.currency || 'USD',
        category: isKnownCategory ? editingExpense.category : 'Other',
        customCategory: isKnownCategory ? '' : editingExpense.category,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingExpense]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      amount: form.amount,
      currency: form.currency,
      category: form.category === 'Other' ? form.customCategory : form.category,
    };
    const ok = await onSubmit(payload);
    if (ok && !editingExpense) {
      setForm(emptyForm);
    }
  };

  const isEditing = Boolean(editingExpense);
  const isOtherCategory = form.category === 'Other';

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="expense-form__header">
        <h2 className="expense-form__title">
          {isEditing ? 'Edit expense' : 'Add an expense'}
        </h2>
        {isEditing && (
          <button type="button" className="expense-form__cancel" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>

      <div className="expense-form__fields">
        <div className="expense-form__field expense-form__field--grow">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Grocery run"
            value={form.title}
            onChange={handleChange('title')}
            disabled={submitting}
          />
        </div>

        <div className="expense-form__field expense-form__field--amount">
          <label htmlFor="amount">Amount</label>
          <div className="expense-form__amount-group">
            <select
              className="expense-form__currency-select"
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
            />
          </div>
        </div>

        <div className="expense-form__field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={handleChange('category')}
            disabled={submitting}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {isOtherCategory && (
          <div className="expense-form__field expense-form__field--grow">
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

        <button className="expense-form__submit" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add expense'}
        </button>
      </div>

      {error && <p className="expense-form__error" role="alert">{error}</p>}
    </form>
  );
}
