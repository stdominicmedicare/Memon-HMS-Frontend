/**
 * Wraps routes that require authentication. Redirects to /login if not signed in.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
