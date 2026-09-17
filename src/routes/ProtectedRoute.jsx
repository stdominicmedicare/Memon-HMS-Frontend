/**
 * Wraps routes that require authentication.
 * Enforces password expiry and mandatory Admin MFA enrollment / AAL2.
 */
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuthContext } from '../auth/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, profile, role } = useAuthContext();
  const location = useLocation();
  const [mfaState, setMfaState] = useState({ checking: true, enrolled: false, aal2: false });

  const isAdmin = role === 'Admin' || profile?.role === 'Admin';
  const onSecurityPage = location.pathname === '/admin/security';
  const onChangePassword = location.pathname === '/change-password';

  useEffect(() => {
    let cancelled = false;
    async function checkMfa() {
      if (!isAuthenticated || !isAdmin || onChangePassword) {
        if (!cancelled) setMfaState({ checking: false, enrolled: true, aal2: true });
        return;
      }
      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const factors = await supabase.auth.mfa.listFactors();
        const totp = factors.data?.totp?.filter((f) => f.status === 'verified') || [];
        if (!cancelled) {
          setMfaState({
            checking: false,
            enrolled: totp.length > 0,
            aal2: aal?.currentLevel === 'aal2',
          });
        }
      } catch {
        // MFA not enabled in project — do not soft-block the UI; API still enforces when available
        if (!cancelled) setMfaState({ checking: false, enrolled: false, aal2: false });
      }
    }
    checkMfa();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, onChangePassword, location.pathname]);

  if (loading || (isAuthenticated && isAdmin && !onChangePassword && mfaState.checking)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.password_expired && !onChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (isAdmin && !onChangePassword) {
    if (!mfaState.enrolled && !onSecurityPage) {
      return <Navigate to="/admin/security" replace />;
    }
    if (mfaState.enrolled && !mfaState.aal2 && !onSecurityPage) {
      return <Navigate to="/login" state={{ from: location, mfaNeeded: true }} replace />;
    }
  }

  return children;
}
