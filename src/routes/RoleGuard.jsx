/**
 * Restricts access by role. Redirects to role dashboard or /unauthorized if wrong role.
 * When user is signed in but profile failed to load (e.g. timeout), shows a Retry screen instead of "Access denied".
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthContext';
import { ROLE_ROUTES } from '../utils/constants';
import { Button, Card } from '../components/common';

export default function RoleGuard({ children, allowedRoles }) {
  const { role, loading, dashboardPath, isAuthenticated, profileError, refreshProfile, profileLoading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  const allowed = Array.isArray(allowedRoles) ? allowedRoles.includes(role) : allowedRoles === role;

  // Signed in but profile failed (e.g. timeout) — show Retry instead of "Access denied"
  if (!allowed && isAuthenticated && profileError && !profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light p-4">
        <Card className="w-full max-w-md text-center">
          <p className="text-lg font-semibold text-text-primary">Profile couldn&apos;t be loaded</p>
          <p className="mt-2 text-sm text-text-secondary">
            Your session is valid but we couldn&apos;t load your profile in time. This can happen on a slow connection or if the server is busy.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => refreshProfile()}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!allowed) {
    if (dashboardPath) return <Navigate to={dashboardPath} replace />;
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
}
