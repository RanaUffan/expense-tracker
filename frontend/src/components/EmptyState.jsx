import './EmptyState.css';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </div>
      <p className="empty-state__title">No expenses yet</p>
      <p className="empty-state__hint">Add your first one using the form above.</p>
    </div>
  );
}
