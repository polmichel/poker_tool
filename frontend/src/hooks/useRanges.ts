import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Range, ActionType } from '../types';

// URL de base pour l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Hook personnalisé pour gérer les ranges
export function useRanges() {
  const [ranges, setRanges] = useState<Range[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  // Charger toutes les ranges
  const fetchRanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/ranges/`);
      setRanges(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des ranges');
      console.error('Error fetching ranges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger une range spécifique
  const fetchRange = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/ranges/${id}`);
      setSelectedRange(response.data);
      return response.data;
    } catch (err) {
      setError(`Erreur lors du chargement de la range ${id}`);
      console.error(`Error fetching range ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer une nouvelle range
  const createRange = useCallback(async (rangeData: Omit<Range, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/ranges/`, rangeData);
      setRanges(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError('Erreur lors de la création de la range');
      console.error('Error creating range:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour une range
  const updateRange = useCallback(async (id: number, rangeData: Partial<Range>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`${API_BASE_URL}/ranges/${id}`, rangeData);
      setRanges(prev => prev.map(r => r.id === id ? response.data : r));
      if (selectedRange?.id === id) {
        setSelectedRange(response.data);
      }
      return response.data;
    } catch (err) {
      setError(`Erreur lors de la mise à jour de la range ${id}`);
      console.error(`Error updating range ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  // Supprimer une range
  const deleteRange = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${API_BASE_URL}/ranges/${id}`);
      setRanges(prev => prev.filter(r => r.id !== id));
      if (selectedRange?.id === id) {
        setSelectedRange(null);
      }
      return true;
    } catch (err) {
      setError(`Erreur lors de la suppression de la range ${id}`);
      console.error(`Error deleting range ${id}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  // Mettre à jour l'action d'une main dans une range
  const updateHandAction = useCallback(async (
    rangeId: number,
    handStr: string,
    action: ActionType
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/ranges/${rangeId}/hands/${handStr}`,
        { action }
      );
      setRanges(prev => prev.map(r => r.id === rangeId ? response.data : r));
      if (selectedRange?.id === rangeId) {
        setSelectedRange(response.data);
      }
      return response.data;
    } catch (err) {
      setError(`Erreur lors de la mise à jour de la main ${handStr}`);
      console.error(`Error updating hand ${handStr}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  // Retirer une main d'une range
  const removeHandFromRange = useCallback(async (rangeId: number, handStr: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/ranges/${rangeId}/hands/${handStr}`
      );
      setRanges(prev => prev.map(r => r.id === rangeId ? response.data : r));
      if (selectedRange?.id === rangeId) {
        setSelectedRange(response.data);
      }
      return response.data;
    } catch (err) {
      setError(`Erreur lors de la suppression de la main ${handStr}`);
      console.error(`Error removing hand ${handStr}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  // Exporter une range
  const exportRange = useCallback(async (rangeId: number, format: 'json' | 'text' | 'csv' = 'json') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/ranges/export/${rangeId}?format=${format}`
      );
      return response.data;
    } catch (err) {
      setError(`Erreur lors de l'export de la range ${rangeId}`);
      console.error(`Error exporting range ${rangeId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Importer une range
  const importRange = useCallback(async (content: string, format: 'json' | 'text' | 'csv' = 'json') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/ranges/import`,
        { content, format }
      );
      setRanges(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError('Erreur lors de l\'import de la range');
      console.error('Error importing range:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir les statistiques d'une range
  const getRangeStats = useCallback(async (rangeId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/ranges/${rangeId}/stats`);
      return response.data;
    } catch (err) {
      setError(`Erreur lors du chargement des statistiques de la range ${rangeId}`);
      console.error(`Error fetching stats for range ${rangeId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir la grille d'une range
  const getRangeGrid = useCallback(async (rangeId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/ranges/${rangeId}/grid`);
      return response.data;
    } catch (err) {
      setError(`Erreur lors du chargement de la grille de la range ${rangeId}`);
      console.error(`Error fetching grid for range ${rangeId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les ranges par défaut
  const fetchDefaultRanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/ranges/default`);
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement des ranges par défaut');
      console.error('Error fetching default ranges:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialiser le hook
  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  return {
    ranges,
    loading,
    error,
    selectedRange,
    setSelectedRange,
    fetchRanges,
    fetchRange,
    createRange,
    updateRange,
    deleteRange,
    updateHandAction,
    removeHandFromRange,
    exportRange,
    importRange,
    getRangeStats,
    getRangeGrid,
    fetchDefaultRanges,
  };
}
