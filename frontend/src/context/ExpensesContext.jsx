import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const ExpensesContext = createContext(null);

export function ExpensesProvider({ children }) {
  const { status: authStatus } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [loadError, setLoadError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadExpenses = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const data = await api.getExpenses();
      setExpenses(data);
      setStatus('success');
    } catch (err) {
      setLoadError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'authed') {
      loadExpenses();
    } else if (authStatus === 'guest') {
      setExpenses([]);
      setStatus('idle');
    }
  }, [authStatus, loadExpenses]);

  const addExpense = useCallback((expense) => {
    setExpenses((list) => [expense, ...list]);
  }, []);

  const replaceExpense = useCallback((updated) => {
    setExpenses((list) => list.map((e) => (e.id === updated.id ? updated : e)));
  }, []);

  const removeExpense = useCallback(async (id) => {
    setDeletingId(id);
    try {
      await api.deleteExpense(id);
      setExpenses((list) => list.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }, []);

  const value = {
    expenses,
    status,
    loadError,
    deletingId,
    loadExpenses,
    addExpense,
    replaceExpense,
    removeExpense,
  };

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
}
