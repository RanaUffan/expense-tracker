// Quick-add expenses only have `createdAt`; detailed-form expenses have
// an explicit `date`. This normalizes both into one YYYY-MM-DD string so
// every chart/filter can treat all expenses the same way.
export function getExpenseDate(expense) {
  return expense.date || expense.createdAt.slice(0, 10);
}

export function uniqueCurrencies(expenses) {
  const set = new Set(expenses.map((e) => e.currency || 'USD'));
  return Array.from(set).sort();
}

export function uniqueCategories(expenses) {
  const set = new Set(expenses.map((e) => e.category));
  return Array.from(set).sort();
}

export function filterExpenses(expenses, { currency, categories, dateFrom, dateTo }) {
  return expenses.filter((e) => {
    if ((e.currency || 'USD') !== currency) return false;
    if (categories && categories.length && !categories.includes(e.category)) return false;
    const d = getExpenseDate(e);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });
}

export function aggregateByCategory(expenses) {
  const totals = {};
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
  }
  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function aggregateByDate(expenses) {
  const totals = {};
  for (const e of expenses) {
    const d = getExpenseDate(e);
    totals[d] = (totals[d] || 0) + Number(e.amount);
  }
  return Object.entries(totals)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeStats(expenses) {
  const count = expenses.length;
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const average = count ? total / count : 0;

  const byCategory = aggregateByCategory(expenses);
  const topCategory = byCategory[0] || null;

  return { count, total, average, topCategory };
}

// Presets for the date-range filter, each returning { from, to } as
// YYYY-MM-DD strings (or nulls for "All time").
export function datePreset(preset) {
  const today = new Date();
  const toStr = (d) => d.toISOString().slice(0, 10);

  if (preset === 'all') return { from: null, to: null };

  const days = { '7d': 7, '30d': 30, '90d': 90 }[preset];
  if (!days) return { from: null, to: null };

  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: toStr(from), to: toStr(today) };
}
