import { useState, useEffect, useMemo } from 'react';
import { useExpenses } from '../context/ExpensesContext';
import Header from '../components/Header';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import DashboardFilters from '../components/dashboard/DashboardFilters';
import StatCards from '../components/dashboard/StatCards';
import CategoryBarChart from '../components/dashboard/CategoryBarChart';
import SpendingLineChart from '../components/dashboard/SpendingLineChart';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import {
  uniqueCurrencies,
  uniqueCategories,
  filterExpenses,
  aggregateByCategory,
  aggregateByDate,
  computeStats,
  datePreset,
} from '../lib/expenseAnalytics';
import './DashboardPage.css';

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { expenses, status, loadError, loadExpenses } = useExpenses();

  const [currency, setCurrency] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(null);
  const [activePreset, setActivePreset] = useState('all');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const availableCurrencies = useMemo(() => uniqueCurrencies(expenses), [expenses]);
  const availableCategories = useMemo(() => uniqueCategories(expenses), [expenses]);

  // Pick sensible defaults the first time real data shows up, without
  // overwriting the user's choice on every re-render afterward.
  useEffect(() => {
    if (currency === null && availableCurrencies.length) {
      setCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, currency]);

  useEffect(() => {
    if (selectedCategories === null && availableCategories.length) {
      setSelectedCategories(availableCategories);
    }
  }, [availableCategories, selectedCategories]);

  const filtered = useMemo(() => {
    if (!currency || !selectedCategories) return [];
    return filterExpenses(expenses, { currency, categories: selectedCategories, dateFrom, dateTo });
  }, [expenses, currency, selectedCategories, dateFrom, dateTo]);

  const byCategory = useMemo(() => aggregateByCategory(filtered), [filtered]);
  const byDate = useMemo(() => aggregateByDate(filtered), [filtered]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const handlePresetChange = (key) => {
    const { from, to } = datePreset(key);
    setDateFrom(from);
    setDateTo(to);
    setActivePreset(key);
  };

  const handleDateFromChange = (value) => {
    setDateFrom(value || null);
    setActivePreset(null);
  };

  const handleDateToChange = (value) => {
    setDateTo(value || null);
    setActivePreset(null);
  };

  const toggleCategory = (cat) => {
    setSelectedCategories((list) =>
      list.includes(cat) ? list.filter((c) => c !== cat) : [...list, cat]
    );
  };

  const selectAllCategories = () => setSelectedCategories(availableCategories);

  const filtersReady = Boolean(currency) && Boolean(selectedCategories);

  return (
    <>
      <Header />

      <main className="container dashboard-page">
        <p className="dashboard-page__eyebrow">Ledger</p>
        <h1 className="dashboard-page__title">Dashboard</h1>
        <p className="dashboard-page__subtitle">
          Visualize where your money is going, and filter by date, category, or currency.
        </p>

        {status === 'loading' && <LoadingState />}

        {status === 'error' && <ErrorState message={loadError} onRetry={loadExpenses} />}

        {status === 'success' && expenses.length === 0 && (
          <div className="dashboard-page__empty">
            <p className="dashboard-page__empty-title">Nothing to visualize yet</p>
            <p className="dashboard-page__empty-hint">Add a few expenses first, then come back here.</p>
          </div>
        )}

        {status === 'success' && expenses.length > 0 && filtersReady && (
          <>
            <DashboardFilters
              currencies={availableCurrencies}
              currency={currency}
              onCurrencyChange={setCurrency}
              categories={availableCategories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              onSelectAllCategories={selectAllCategories}
              activePreset={activePreset}
              onPresetChange={handlePresetChange}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={handleDateFromChange}
              onDateToChange={handleDateToChange}
            />

            <div className="dashboard-page__stats">
              <StatCards stats={stats} currency={currency} />
            </div>

            <div className="dashboard-page__charts">
              <CategoryBarChart data={byCategory} currency={currency} />
              <CategoryPieChart data={byCategory} currency={currency} />
              <div className="dashboard-page__chart-full">
                <SpendingLineChart data={byDate} currency={currency} />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
