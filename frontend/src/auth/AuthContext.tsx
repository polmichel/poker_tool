/**
 * Shared authentication context.
 *
 * Without this, every component calling useAuth() got its own independent
 * state — so when Login set isAuthenticated=true, AppShell still saw
 * isAuthenticated=false and kept showing the "Connexion" button.
 *
 * AuthProvider wraps the app and calls useAuth() once; useAuthContext()
 * lets every component read the same shared state.
 */
import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

type AuthContextValue = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}
