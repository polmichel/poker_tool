/**
 * Main application shell: a fluid app bar with a brand mark, module-aware
 * breadcrumb (with a back-to-hub action), a module navigation drawer and
 * the user menu.
 *
 * E2E contract preserved: the "Connexion" button appears when anonymous,
 * the username button + "Déconnexion" menu item appear when authenticated.
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  GridView as GridViewIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthContext';
import { THEME_COLORS } from '../utils/constants';
import { APP_ENTRIES, MODULE_ROUTES, moduleRoute, resolveModule } from './theme';
import { getIcon } from './icons';

const DRAWER_WIDTH = 256;

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, isAuthenticated, logout } = useAuthContext();
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

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const activeModule = resolveModule(location.pathname);
  const onHub = location.pathname === '/';
  const title = onHub ? 'Accueil' : (MODULE_ROUTES[activeModule ?? '']?.title ?? 'Poker Tool');

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand */}
      <Toolbar
        sx={{
          gap: 1.25,
          cursor: 'pointer',
          px: 2.5,
          py: 2.5,
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
        <Box sx={{ lineHeight: 1.1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
            Poker Tool
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Suite d'entraînement
          </Typography>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: THEME_COLORS.border }} />

      <List sx={{ flex: 1, pt: 1.5 }}>
        <ListItem disablePadding>
          <ListItemButton selected={onHub} onClick={() => navigate('/')}>
            <ListItemIcon
              sx={{ color: onHub ? THEME_COLORS.primaryLight : 'inherit', minWidth: 38 }}
            >
              <GridViewIcon />
            </ListItemIcon>
            <ListItemText
              primary="Accueil"
              secondary="Tous les modules"
              secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
            />
          </ListItemButton>
        </ListItem>

        {APP_ENTRIES.map((entry) => {
          const Icon = getIcon(entry.icon);
          const isActive = activeModule === entry.slug;
          const route = moduleRoute(entry.slug);
          return (
            <ListItem key={entry.slug} disablePadding>
              <ListItemButton
                selected={isActive}
                disabled={!route}
                onClick={() => route && navigate(route)}
              >
                <ListItemIcon sx={{ color: isActive ? entry.accent : 'inherit', minWidth: 38 }}>
                  <Icon fontSize="medium" />
                </ListItemIcon>
                <ListItemText
                  primary={entry.title}
                  secondary={entry.tagline}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                    noWrap: true,
                  }}
                />
                {entry.soon && (
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
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: THEME_COLORS.border }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/settings')}>
            <ListItemIcon sx={{ minWidth: 38 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Paramètres" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { sm: 'none' } }}
          >
            <MenuIcon />
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

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
        aria-label="navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};
