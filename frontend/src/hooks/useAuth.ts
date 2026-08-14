import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthApi } from '../api';
import { User } from '../types';

// Hook personnalisé pour gérer l'authentification.
// L'état interne (user, token, error) reste privé : l'UI n'a accès qu'aux
// intentions (register, login, logout, fetchCurrentUser, updateUser) — pas aux
// setters, conformément au principe d'encapsulation (Elegant Objects).
export function useAuth(authApi: AuthApi = new AuthApi()) {
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
        const currentUser = await authApi.me();
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
  }, [authApi]);

  // Inscrire un nouvel utilisateur
  const register = useCallback(async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      await authApi.register(username, email, password);
      // Connecter automatiquement après l'inscription
      const { access_token, user: userData } = await authApi.login(username, password);
      localStorage.setItem('poker_tool_token', access_token);
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Erreur lors de l\'inscription'
        : 'Erreur lors de l\'inscription';
      setError(errorMessage);
      console.error('Error registering:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authApi]);

  // Connecter un utilisateur
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { access_token, user: userData } = await authApi.login(username, password);
      localStorage.setItem('poker_tool_token', access_token);
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Identifiants invalides'
        : 'Identifiants invalides';
      setError(errorMessage);
      console.error('Error logging in:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authApi]);

  // Déconnecter l'utilisateur
  const logout = useCallback(() => {
    localStorage.removeItem('poker_tool_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  // Mettre à jour l'utilisateur
  const updateUser = useCallback(async (userData: Partial<User>) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('User ID not found');
      }

      const response = await authApi.me();
      setUser(response);
      return response;
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil');
      console.error('Error updating user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, token, authApi]);

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
