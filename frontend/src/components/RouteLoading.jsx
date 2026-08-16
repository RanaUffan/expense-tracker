import './RouteLoading.css';

// Shown briefly while a lazy-loaded route's code downloads (see
// App.jsx). On a fast connection this is barely visible; on a slow one,
// it's the difference between a spinner and a blank white screen.
export default function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-loading__spinner" aria-hidden="true" />
    </div>
  );
}
