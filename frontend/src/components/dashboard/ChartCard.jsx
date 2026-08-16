import './ChartCard.css';

export default function ChartCard({ title, isEmpty, children }) {
  return (
    <div className="chart-card">
      <h3 className="chart-card__title">{title}</h3>
      {isEmpty ? (
        <div className="chart-card__empty">No data for the selected filters.</div>
      ) : (
        <div className="chart-card__body">{children}</div>
      )}
    </div>
  );
}
