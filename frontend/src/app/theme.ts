/**
 * Application theme (single source of truth for the dark theme).
 */
import { createTheme } from '@mui/material';
import { THEME_COLORS } from '../utils/constants';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: THEME_COLORS.primary },
    secondary: { main: THEME_COLORS.secondary },
    background: {
      default: THEME_COLORS.background,
      paper: THEME_COLORS.paper,
    },
    text: {
      primary: THEME_COLORS.textPrimary,
      secondary: THEME_COLORS.textSecondary,
    },
    error: { main: THEME_COLORS.error },
    warning: { main: THEME_COLORS.warning },
    info: { main: THEME_COLORS.info },
    success: { main: THEME_COLORS.success },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: THEME_COLORS.paper },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundColor: THEME_COLORS.paper },
      },
    },
  },
});
