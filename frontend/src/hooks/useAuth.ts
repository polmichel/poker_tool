import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AuthApi } from '../api';
import { User } from '../types';

// Hook personnalisé pour gérer l'authentification.
// L'état interne (user, token, error) reste privé : l'UI n'a accès qu'aux
// intentions (register, login, logout, fetchCurrentUser, updateUser) — pas aux
// setters, conformément au principe d'encapsulation (Elegant Objects).
export function useAuth(authApi?: AuthApi) {
  // Keep a stable AuthApi instance across renders. A default parameter
  // (authApi = new AuthApi()) would create a new instance on every render,
  // which re-triggers every useCallback/useEffect that depends on it and
  // causes infinite re-render loops. useRef avoids that.
  const authApiRef = useRef<AuthApi>(authApi ?? new AuthApi());
  const api = authApiRef.current;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  // Charger l'utilisateur actuel (si un token existe)
  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const storedToken = localStorage.getItem('poker_tool_token');
      if (storedToken) {
        setToken(storedToken);
        const currentUser = await api.me();
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    } catch (err) {
      // Si le token est invalide, le supprimer
      localStorage.removeItem('poker_tool_token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Inscrire un nouvel utilisateur
  const register = useCallback(
    async (username: string, email: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        await api.register(username, email, password);
        // Connecter automatiquement après l'inscription
        const { access_token, user: userData } = await api.login(username, password);
        localStorage.setItem('poker_tool_token', access_token);
        setToken(access_token);
        setUser(userData);
        setIsAuthenticated(true);

        return userData;
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.error || err.response?.statusText || "Erreur lors de l'inscription"
          : "Erreur lors de l'inscription";
        setError(errorMessage);
        console.error('Error registering:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Connecter un utilisateur
  const login = useCallback(
    async (username: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        const { access_token, user: userData } = await api.login(username, password);
        localStorage.setItem('poker_tool_token', access_token);
        setToken(access_token);
        setUser(userData);
        setIsAuthenticated(true);

        return userData;
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.error || err.response?.statusText || 'Identifiants invalides'
          : 'Identifiants invalides';
        setError(errorMessage);
        console.error('Error logging in:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Déconnecter l'utilisateur
  const logout = useCallback(() => {
    localStorage.removeItem('poker_tool_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  // Mettre à jour l'utilisateur
  const updateUser = useCallback(
    async (_userData: Partial<User>) => {
      setLoading(true);
      setError(null);

      try {
        if (!user?.id) {
          throw new Error('User ID not found');
        }

        const response = await api.me();
        setUser(response);
        return response;
      } catch (err) {
        setError('Erreur lors de la mise à jour du profil');
        console.error('Error updating user:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, api],
  );

  // Initialiser le hook
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    token,
    fetchCurrentUser,
    register,
    login,
    logout,
    updateUser,
  };
}
