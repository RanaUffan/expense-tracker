import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ExpensesProvider } from './context/ExpensesContext';
import ProtectedRoute from './components/ProtectedRoute';
import RouteLoading from './components/RouteLoading';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ExpensesPage from './pages/ExpensesPage';

// Code-split the two heaviest routes. DashboardPage pulls in Recharts
// (the single biggest dependency in this app) and NewExpensePage pulls
// in the file-upload UI — neither is needed for the first screen most
// people see (login, then the plain expense list), so there's no reason
// to make everyone download that code up front.
const NewExpensePage = lazy(() => import('./pages/NewExpensePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ExpensesProvider>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <ExpensesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses/new"
                element={
                  <ProtectedRoute>
                    <NewExpensePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/expenses" replace />} />
              <Route path="*" element={<Navigate to="/expenses" replace />} />
            </Routes>
          </Suspense>
        </ExpensesProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
