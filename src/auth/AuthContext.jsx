import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './useAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuth();
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => auth, [
    auth.user?.id, // Only re-render when user ID changes
    auth.profile?.id, // Or profile ID changes
    auth.loading, // Or loading state changes
    auth.error, // Or error changes
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}