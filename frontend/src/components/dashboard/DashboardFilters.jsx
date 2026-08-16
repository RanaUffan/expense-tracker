import './DashboardFilters.css';

const PRESETS = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'all', label: 'All time' },
];

export default function DashboardFilters({
  currencies,
  currency,
  onCurrencyChange,
  categories,
  selectedCategories,
  onToggleCategory,
  onSelectAllCategories,
  activePreset,
  onPresetChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}) {
  const allSelected = selectedCategories.length === categories.length;

  return (
    <div className="dashboard-filters">
      <div className="dashboard-filters__row">
        <div className="dashboard-filters__group">
          <span className="dashboard-filters__label">Currency</span>
          <select value={currency} onChange={(e) => onCurrencyChange(e.target.value)}>
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="dashboard-filters__group">
          <span className="dashboard-filters__label">Date range</span>
          <div className="dashboard-filters__presets">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`dashboard-filters__preset ${activePreset === p.key ? 'dashboard-filters__preset--active' : ''}`}
                onClick={() => onPresetChange(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-filters__group">
          <span className="dashboard-filters__label">Custom</span>
          <div className="dashboard-filters__dates">
            <input
              type="date"
              value={dateFrom || ''}
              onChange={(e) => onDateFromChange(e.target.value)}
              aria-label="From date"
            />
            <span>–</span>
            <input
              type="date"
              value={dateTo || ''}
              onChange={(e) => onDateToChange(e.target.value)}
              aria-label="To date"
            />
          </div>
        </div>
      </div>

      <div className="dashboard-filters__categories">
        <span className="dashboard-filters__label">Categories</span>
        <div className="dashboard-filters__chips">
          <button
            type="button"
            className={`dashboard-filters__chip ${allSelected ? 'dashboard-filters__chip--active' : ''}`}
            onClick={onSelectAllCategories}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`dashboard-filters__chip ${selectedCategories.includes(cat) ? 'dashboard-filters__chip--active' : ''}`}
              onClick={() => onToggleCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
