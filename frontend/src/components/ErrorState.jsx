import './ErrorState.css';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <p className="error-state__title">Couldn't load your expenses</p>
      <p className="error-state__message">
        {message || 'The server might be down, or your connection dropped.'}
      </p>
      <button className="error-state__retry" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
