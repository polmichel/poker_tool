/**
 * FocusModeContext - Gestion du mode focus et du menu collapsible
 *
 * Fournit un état global pour :
 * - Le mode focus (masquage complet du menu et de la barre)
 * - Le menu latéral collapsible (48px au lieu de 256px)
 * - Le raccourci clavier Ctrl+M / Cmd+M pour basculer le mode focus
 */
import React, { createContext, useState, useContext, useEffect } from 'react';

interface FocusModeContextType {
  focusMode: boolean; // Mode focus activé ?
  setFocusMode: (value: boolean) => void;
  drawerCollapsed: boolean; // Menu latéral réduit ?
  setDrawerCollapsed: (value: boolean) => void;
}

const FocusModeContext = createContext<FocusModeContextType>({
  focusMode: false,
  setFocusMode: () => {},
  drawerCollapsed: false,
  setDrawerCollapsed: () => {},
});

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusMode, setFocusMode] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);

  // Gestion du raccourci clavier Ctrl+M / Cmd+M
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Vérifier si Ctrl+M (Windows/Linux) ou Cmd+M (Mac)
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      if (isCtrlOrCmd && event.key === 'm') {
        event.preventDefault();
        setFocusMode(!focusMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  // Auto-collapser le menu sur les petits écrans
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setDrawerCollapsed(true);
      } else {
        // Ne pas ré-étendre automatiquement si l'utilisateur a manuellement réduit
        // On garde l'état actuel
      }
    };

    // Vérifier au chargement
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <FocusModeContext.Provider
      value={{ focusMode, setFocusMode, drawerCollapsed, setDrawerCollapsed }}
    >
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => useContext(FocusModeContext);
