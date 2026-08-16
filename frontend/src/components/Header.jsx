import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpensesContext';
import { formatMoney } from '../lib/currencies';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { expenses } = useExpenses();

  const totalsByCurrency = useMemo(() => {
    const totals = {};
    for (const e of expenses) {
      const currency = e.currency || 'USD';
      totals[currency] = (totals[currency] || 0) + Number(e.amount);
    }
    return Object.entries(totals);
  }, [expenses]);

  return (
    <header className="header">
      <div className="container header__inner">
        <div>
          <p className="header__eyebrow">Ledger</p>
          <h1 className="header__title">Expense Tracker</h1>
          {user && <p className="header__user">Signed in as {user.name}</p>}
          <nav className="header__nav">
            <NavLink to="/expenses" className={({ isActive }) => isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link'}>
              Expenses
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link'}>
              Dashboard
            </NavLink>
          </nav>
        </div>

        <div className="header__right">
          <div className="header__total">
            <span className="header__total-label">Total spent</span>
            {totalsByCurrency.length === 0 ? (
              <span className="header__total-value">{formatMoney(0, 'USD')}</span>
            ) : (
              totalsByCurrency.map(([currency, amount]) => (
                <span className="header__total-value" key={currency}>
                  {formatMoney(amount, currency)}
                </span>
              ))
            )}
          </div>
          <button className="header__logout" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
