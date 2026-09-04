/**
 * TopAppBar - Application toolbar component
 *
 * Displays:
 * - Module title with breadcrumb navigation
 * - Focus mode toggle
 * - User authentication menu
 *
 * @component
 */
import React from 'react';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Fade,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../auth/AuthContext';
import { useFocusMode } from '../../contexts/FocusModeContext';
import { THEME_COLORS } from '../../utils/constants';

export interface TopAppBarProps {
  title: string;
  onHub: boolean;
  drawerCollapsed: boolean;
  onToggleDrawerCollapsed: () => void;
  onToggleFocusMode: () => void;
  focusMode: boolean;
}

const DRAWER_WIDTH = 256;

/**
 * TopAppBar component
 */
export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  onHub,
  drawerCollapsed,
  onToggleDrawerCollapsed,
  onToggleFocusMode,
  focusMode,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthContext();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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

  /**
   * User menu component
   */
  const UserMenu = () => (
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
              <ListItemText>Parametres</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Deconnexion</ListItemText>
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
  );

  return (
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
            onClick={onToggleDrawerCollapsed}
            sx={{ mr: 1 }}
            aria-label={drawerCollapsed ? 'Etendre le menu' : 'Reduire le menu'}
          >
            {drawerCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>

          {/* Back to hub when inside a module */}
          {!onHub && (
            <IconButton
              color="inherit"
              onClick={() => navigate('/')}
              aria-label="retour a l'accueil"
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
              onClick={onToggleFocusMode}
              sx={{ mr: 1 }}
              aria-label={focusMode ? 'Quitter le mode focus' : 'Activer le mode focus'}
            >
              {focusMode ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>

          {/* User menu */}
          <UserMenu />
        </Toolbar>
      </AppBar>
    </Fade>
  );
};
