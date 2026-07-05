import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, AuthResponse } from '../types';

// URL de base pour l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Hook personnalisé pour gérer l'authentification
export function useAuth() {
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
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        setUser(response.data);
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
  }, []);

  // Inscrire un nouvel utilisateur
  const register = useCallback(async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        email,
        password,
      });
      
      // Connecter automatiquement après l'inscription
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });
      
      const { access_token, user: userData } = loginResponse.data as AuthResponse;
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
  }, []);

  // Connecter un utilisateur
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });
      
      const { access_token, user: userData } = response.data as AuthResponse;
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
  }, []);

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
      
      const response = await axios.put(
        `${API_BASE_URL}/auth/me`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setUser(response.data);
      return response.data;
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil');
      console.error('Error updating user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, token]);

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
    setUser,
    setIsAuthenticated,
    setError,
    fetchCurrentUser,
    register,
    login,
    logout,
    updateUser,
  };
}
