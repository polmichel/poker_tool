/**
 * Main application shell
 *
 * Composes layout components:
 * - NavigationDrawer for side navigation
 * - TopAppBar for top toolbar
 * - FocusModeIndicator for focus mode display
 *
 * E2E contract preserved: the "Connexion" button appears when anonymous,
 * the username button + "Déconnexion" menu item appear when authenticated.
 *
 * Supports focus mode and collapsible drawer for maximum screen space.
 */
import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, Fade } from '@mui/material';
import { useLocation } from 'react-router-dom';

import { useFocusMode } from '../contexts/FocusModeContext';
import { NavigationDrawer } from '../components/layout/NavigationDrawer';
import { TopAppBar } from '../components/layout/TopAppBar';
import { FocusModeIndicator } from '../components/layout/FocusModeIndicator';
import { MODULE_ROUTES, resolveModule } from './theme';

const DRAWER_WIDTH = 256;

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { focusMode, drawerCollapsed, setFocusMode, setDrawerCollapsed } = useFocusMode();
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // Toggle drawer collapsed state
  const handleToggleDrawerCollapsed = () => {
    setDrawerCollapsed(!drawerCollapsed);
  };

  // Toggle focus mode
  const handleToggleFocusMode = () => {
    setFocusMode(!focusMode);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const activeModule = resolveModule(location.pathname);
  const onHub = location.pathname === '/';
  const title = onHub ? 'Accueil' : (MODULE_ROUTES[activeModule ?? '']?.title ?? 'Poker Tool');

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Top App Bar */}
      <TopAppBar
        title={title}
        onHub={onHub}
        drawerCollapsed={drawerCollapsed}
        onToggleDrawerCollapsed={handleToggleDrawerCollapsed}
        onToggleFocusMode={handleToggleFocusMode}
        focusMode={focusMode}
      />

      {/* Navigation Drawer - hidden in focus mode */}
      <Fade in={!focusMode}>
        <NavigationDrawer
          mobileOpen={mobileOpen}
          onMobileClose={handleDrawerToggle}
          collapsed={drawerCollapsed}
          activeModule={activeModule ?? undefined}
          onHub={onHub}
        />
      </Fade>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: drawerCollapsed ? '100%' : { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          transition: 'width 0.3s ease',
        }}
      >
        {!focusMode && <Box sx={{ height: 64 }} />} {/* AppBar spacer */}
        {children}
      </Box>

      {/* Focus mode indicator (only visible when in focus mode) */}
      {focusMode && <FocusModeIndicator onExitFocusMode={handleToggleFocusMode} />}
    </Box>
  );
};
