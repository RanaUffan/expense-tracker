import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useExpenses } from '../context/ExpensesContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import './ExpensesPage.css';

export default function ExpensesPage() {
  useDocumentTitle('Expenses');
  const { expenses, status, loadError, deletingId, loadExpenses, addExpense, replaceExpense, removeExpense } =
    useExpenses();
  const { showToast } = useToast();

  const [editingExpense, setEditingExpense] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleFormSubmit = async (form) => {
    setFormSubmitting(true);
    setFormError('');
    try {
      if (editingExpense) {
        const updated = await api.updateExpense(editingExpense.id, form);
        replaceExpense(updated);
        setEditingExpense(null);
        showToast('success', 'Expense updated.');
      } else {
        const created = await api.createExpense(form);
        addExpense(created);
        showToast('success', 'Expense added.');
      }
      return true;
    } catch (err) {
      setFormError(err.message);
      return false;
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setFormError('');
  };

  const handleDelete = async (id) => {
    try {
      await removeExpense(id);
      if (editingExpense?.id === id) setEditingExpense(null);
      showToast('success', 'Expense deleted.');
    } catch (err) {
      showToast('error', `Couldn't delete this expense: ${err.message}`);
    }
  };

  return (
    <>
      <Header />

      <main className="container">
        <ExpenseForm
          editingExpense={editingExpense}
          onSubmit={handleFormSubmit}
          onCancelEdit={handleCancelEdit}
          submitting={formSubmitting}
          error={formError}
        />

        <p className="expenses-page__detailed-link">
          Need to attach a receipt or add more detail?{' '}
          <Link to="/expenses/new">Add a detailed expense →</Link>
        </p>

        {status === 'loading' && <LoadingState />}

        {status === 'error' && (
          <ErrorState message={loadError} onRetry={loadExpenses} />
        )}

        {status === 'success' && expenses.length === 0 && <EmptyState />}

        {status === 'success' && expenses.length > 0 && (
          <ExpenseList
            expenses={expenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </main>
    </>
  );
}
