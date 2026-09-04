/**
 * NavigationDrawer - Side navigation drawer component
 *
 * Handles both mobile (temporary) and desktop (permanent) drawer modes
 * Supports collapsed state for maximum screen space
 * Displays app branding, module navigation, and settings
 *
 * @component
 */
import React from 'react';
import {
  Box,
  Drawer,
  Toolbar,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  GridView as GridViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { THEME_COLORS } from '../../utils/constants';
import { APP_ENTRIES, MODULE_ROUTES, moduleRoute, resolveModule } from '../../app/theme';
import { getIcon } from '../../app/icons';

export interface NavigationDrawerProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  activeModule?: string;
  onHub: boolean;
}

const DRAWER_WIDTH = 256;
const DRAWER_COLLAPSED_WIDTH = 48;

/**
 * NavigationDrawer component
 */
export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  mobileOpen,
  onMobileClose,
  collapsed,
  activeModule,
  onHub,
}) => {
  const navigate = useNavigate();

  /**
   * Brand section with logo and app name
   */
  const BrandSection = () => (
    <Toolbar
      sx={{
        gap: 1.25,
        cursor: 'pointer',
        px: collapsed ? 1 : 2.5,
        py: 2.5,
        justifyContent: collapsed ? 'center' : 'flex-start',
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
      {!collapsed && (
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
  );

  /**
   * Navigation item for the hub/home
   */
  const HubNavItem = () => (
    <ListItem disablePadding>
      <Tooltip title={collapsed ? 'Accueil' : ''} placement="right" arrow>
        <ListItemButton selected={onHub} onClick={() => navigate('/')}>
          <ListItemIcon
            sx={{
              color: onHub ? THEME_COLORS.primaryLight : 'inherit',
              minWidth: collapsed ? 'auto' : 38,
              justifyContent: 'center',
            }}
          >
            <GridViewIcon />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary="Accueil"
              secondary="Tous les modules"
              secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );

  /**
   * Navigation item for a module
   */
  const ModuleNavItem: React.FC<{ entry: typeof APP_ENTRIES[number] }> = ({ entry }) => {
    const Icon = getIcon(entry.icon);
    const isActive = activeModule === entry.slug;
    const route = moduleRoute(entry.slug);
    const disabled = !route || !!entry.soon;

    return (
      <ListItem key={entry.slug} disablePadding>
        <Tooltip title={collapsed ? entry.title : ''} placement="right" arrow>
          <ListItemButton
            selected={isActive}
            disabled={disabled}
            onClick={() => route && !disabled && navigate(route)}
            sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <ListItemIcon
              sx={{
                color: isActive ? entry.accent : 'inherit',
                minWidth: collapsed ? 'auto' : 38,
                justifyContent: 'center',
              }}
            >
              <Icon fontSize="medium" />
            </ListItemIcon>
            {!collapsed && (
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
            {entry.soon && !collapsed && (
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
  };

  /**
   * Settings navigation item
   */
  const SettingsNavItem = () => (
    <ListItem disablePadding>
      <Tooltip title={collapsed ? 'Paramètres' : ''} placement="right" arrow>
        <ListItemButton onClick={() => navigate('/settings')}>
          <ListItemIcon
            sx={{ minWidth: collapsed ? 'auto' : 38, justifyContent: 'center' }}
          >
            <SettingsIcon />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Paramètres" />}
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );

  /**
   * Drawer content (shared between mobile and desktop)
   */
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BrandSection />
      <Divider sx={{ borderColor: THEME_COLORS.border }} />

      {/* Navigation list with tooltips for collapsed state */}
      <List sx={{ flex: 1, pt: 1.5 }}>
        <HubNavItem />

        {APP_ENTRIES.map((entry) => (
          <ModuleNavItem key={entry.slug} entry={entry} />
        ))}
      </List>

      <Divider sx={{ borderColor: THEME_COLORS.border }} />
      <List>
        <SettingsNavItem />
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: collapsed ? DRAWER_COLLAPSED_WIDTH : { sm: DRAWER_WIDTH },
        flexShrink: { sm: 0 },
        transition: 'width 0.3s ease',
      }}
      aria-label="navigation"
    >
      {/* Mobile drawer (temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
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
        {drawerContent}
      </Drawer>

      {/* Desktop drawer (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
