import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProtectedRoute.css';

export default function ProtectedRoute({ children }) {
  const { status } = useAuth();

  if (status === 'checking') {
    return (
      <div className="protected-route__checking" role="status" aria-live="polite">
        <span className="protected-route__spinner" aria-hidden="true" />
        <p>Checking your session…</p>
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
