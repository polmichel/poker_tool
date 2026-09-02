/**
 * Main application shell: a fluid app bar with a brand mark, module-aware
 * breadcrumb (with a back-to-hub action), a module navigation drawer and
 * the user menu.
 *
 * E2E contract preserved: the "Connexion" button appears when anonymous,
 * the username button + "Déconnexion" menu item appear when authenticated.
 *
 * NEW: Supports focus mode and collapsible drawer for maximum screen space.
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  Toolbar,
  AppBar,
  IconButton,
  Typography,
  Divider,
  Button,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  GridView as GridViewIcon,
  ArrowBack as ArrowBackIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthContext';
import { useFocusMode } from '../contexts/FocusModeContext';
import { THEME_COLORS } from '../utils/constants';
import { APP_ENTRIES, MODULE_ROUTES, moduleRoute, resolveModule } from './theme';
import { getIcon } from './icons';

const DRAWER_WIDTH = 256;
const DRAWER_COLLAPSED_WIDTH = 48;

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, isAuthenticated, logout } = useAuthContext();
  const { focusMode, drawerCollapsed, setFocusMode, setDrawerCollapsed } = useFocusMode();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
    handleMenuClose();
  };

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

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand - adapted for collapsed state */}
      <Toolbar
        sx={{
          gap: 1.25,
          cursor: 'pointer',
          px: drawerCollapsed ? 1 : 2.5,
          py: 2.5,
          justifyContent: drawerCollapsed ? 'center' : 'flex-start',
          '&:hover': { opacity: 0.9 },
        }}
        onClick={() => navigate('/')}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: THEME_COLORS.background,
            background: `linear-gradient(135deg, ${THEME_COLORS.primaryLight}, ${THEME_COLORS.primaryDark})`,
            boxShadow: `0 8px 20px -8px ${THEME_COLORS.primary}cc`,
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          ♠
        </Box>
        {!drawerCollapsed && (
          <Box sx={{ lineHeight: 1.1, ml: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
              Poker Tool
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Suite d'entraînement
            </Typography>
          </Box>
        )}
      </Toolbar>

      <Divider sx={{ borderColor: THEME_COLORS.border }} />

      {/* Navigation list with tooltips for collapsed state */}
      <List sx={{ flex: 1, pt: 1.5 }}>
        <ListItem disablePadding>
          <Tooltip title={drawerCollapsed ? 'Accueil' : ''} placement="right" arrow>
            <ListItemButton selected={onHub} onClick={() => navigate('/')}>
              <ListItemIcon
                sx={{
                  color: onHub ? THEME_COLORS.primaryLight : 'inherit',
                  minWidth: drawerCollapsed ? 'auto' : 38,
                  justifyContent: 'center',
                }}
              >
                <GridViewIcon />
              </ListItemIcon>
              {!drawerCollapsed && (
                <ListItemText
                  primary="Accueil"
                  secondary="Tous les modules"
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {APP_ENTRIES.map((entry) => {
          const Icon = getIcon(entry.icon);
          const isActive = activeModule === entry.slug;
          const route = moduleRoute(entry.slug);
          const disabled = !route || !!entry.soon;
          return (
            <ListItem key={entry.slug} disablePadding>
              <Tooltip title={drawerCollapsed ? entry.title : ''} placement="right" arrow>
                <ListItemButton
                  selected={isActive}
                  disabled={disabled}
                  onClick={() => route && !disabled && navigate(route)}
                  sx={{ justifyContent: drawerCollapsed ? 'center' : 'flex-start' }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? entry.accent : 'inherit',
                      minWidth: drawerCollapsed ? 'auto' : 38,
                      justifyContent: 'center',
                    }}
                  >
                    <Icon fontSize="medium" />
                  </ListItemIcon>
                  {!drawerCollapsed && (
                    <ListItemText
                      primary={entry.title}
                      secondary={entry.tagline}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary',
                        noWrap: true,
                      }}
                    />
                  )}
                  {entry.soon && !drawerCollapsed && (
                    <Box
                      component="span"
                      sx={{
                        ml: 1,
                        px: 0.75,
                        py: 0.25,
                        height: 18,
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 9,
                        fontSize: 10,
                        fontWeight: 600,
                        color: THEME_COLORS.textMuted,
                        backgroundColor: 'rgba(148,163,184,0.12)',
                        border: `1px solid ${THEME_COLORS.border}`,
                      }}
                    >
                      Soon
                    </Box>
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: THEME_COLORS.border }} />
      <List>
        <ListItem disablePadding>
          <Tooltip title={drawerCollapsed ? 'Paramètres' : ''} placement="right" arrow>
            <ListItemButton onClick={() => navigate('/settings')}>
              <ListItemIcon
                sx={{ minWidth: drawerCollapsed ? 'auto' : 38, justifyContent: 'center' }}
              >
                <SettingsIcon />
              </ListItemIcon>
              {!drawerCollapsed && <ListItemText primary="Paramètres" />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* App Bar - hidden in focus mode */}
      <Fade in={!focusMode}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: drawerCollapsed ? '100%' : { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: drawerCollapsed ? 0 : { sm: `${DRAWER_WIDTH}px` },
            transition: 'width 0.3s ease, margin-left 0.3s ease',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {/* Toggle drawer collapsed button */}
            <IconButton
              color="inherit"
              onClick={handleToggleDrawerCollapsed}
              sx={{ mr: 1 }}
              aria-label={drawerCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
            >
              {drawerCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
            </IconButton>

            {/* Back to hub when inside a module */}
            {!onHub && (
              <IconButton
                color="inherit"
                onClick={() => navigate('/')}
                aria-label="retour à l'accueil"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}

            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
              {title}
            </Typography>

            {/* Focus mode toggle button in the app bar */}
            <Tooltip
              title={focusMode ? 'Quitter le mode focus' : 'Activer le mode focus (Ctrl+M)'}
              arrow
            >
              <IconButton
                color="inherit"
                onClick={handleToggleFocusMode}
                sx={{ mr: 1 }}
                aria-label={focusMode ? 'Quitter le mode focus' : 'Activer le mode focus'}
              >
                {focusMode ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>

            {/* User menu */}
            <Box>
              {isAuthenticated && user ? (
                <>
                  <Button
                    color="inherit"
                    startIcon={<PersonIcon />}
                    onClick={handleMenuOpen}
                    sx={{
                      borderRadius: 999,
                      border: `1px solid ${THEME_COLORS.borderStrong}`,
                      px: 1.5,
                    }}
                  >
                    {user.username}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{ sx: { mt: '45px', minWidth: 200 } }}
                  >
                    <MenuItem onClick={handleMenuClose}>
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Profil</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleMenuClose}>
                      <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Paramètres</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText>Déconnexion</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  color="inherit"
                  startIcon={<LoginIcon />}
                  onClick={handleLogin}
                  sx={{ borderRadius: 999, border: `1px solid ${THEME_COLORS.borderStrong}` }}
                >
                  Connexion
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>
      </Fade>

      {/* Drawer - hidden in focus mode */}
      <Fade in={!focusMode}>
        <Box
          component="nav"
          sx={{
            width: drawerCollapsed ? DRAWER_COLLAPSED_WIDTH : { sm: DRAWER_WIDTH },
            flexShrink: { sm: 0 },
            transition: 'width 0.3s ease',
          }}
          aria-label="navigation"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                transition: 'width 0.3s ease',
              },
            }}
          >
            {drawer}
          </Drawer>

          {/* Permanent drawer for desktop */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
                transition: 'width 0.3s ease',
                overflowX: 'hidden',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
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
        {!focusMode && <Toolbar />}
        {children}
      </Box>

      {/* Focus mode indicator (only visible when in focus mode) */}
      {focusMode && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: 2,
            backgroundColor: 'rgba(11,15,20,0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${THEME_COLORS.border}`,
            zIndex: 1200,
            transition: 'opacity 0.3s ease',
          }}
        >
          <Tooltip title="Quitter le mode focus (Ctrl+M)" arrow>
            <IconButton
              color="inherit"
              onClick={handleToggleFocusMode}
              sx={{
                color: THEME_COLORS.textPrimary,
                backgroundColor: THEME_COLORS.paper,
                border: `1px solid ${THEME_COLORS.border}`,
                '&:hover': {
                  backgroundColor: THEME_COLORS.paperElevated,
                },
              }}
              aria-label="Quitter le mode focus"
            >
              <FullscreenExitIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};
