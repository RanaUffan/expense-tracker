import './LoadingState.css';

export default function LoadingState() {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="loading-state__row" key={i}>
          <div className="loading-state__line loading-state__line--wide" />
          <div className="loading-state__line loading-state__line--narrow" />
        </div>
      ))}
      <p className="loading-state__label">Loading expenses…</p>
    </div>
  );
}
