/**
 * Application theme — single source of truth for the dark, modern theme.
 *
 * Design language:
 *  - Deep charcoal canvas with subtle elevation steps and a felt-table glow.
 *  - Emerald primary + electric cyan accent.
 *  - Rounded corners, soft shadows, smooth transitions for a fluid feel.
 */
import { createTheme, type ThemeOptions } from '@mui/material';
import { THEME_COLORS } from '../utils/constants';

/**
 * App-entry descriptor used by the home hub and the shell navigation.
 * Each "module" is a focused sub-application reachable from the hub.
 */
export interface AppEntry {
  /** Route segment the module lives under, e.g. "ranger". */
  slug: string;
  /** Human title shown on the hub vignette. */
  title: string;
  /** One-line tagline. */
  tagline: string;
  /** Longer description for the hub. */
  description: string;
  /** Accent color used for the vignette glow + icon tint. */
  accent: string;
  /** Material icon name from @mui/icons-material. */
  icon: string;
  /** Marks not-yet-available modules (shown as "bientôt"). */
  soon?: boolean;
}

/**
 * The hub of sub-applications. Existing features are grouped into
 * "Le Ranger" (range management) and "Le Simulateur" (training),
 * leaving room for future poker modules.
 */
export const APP_ENTRIES: AppEntry[] = [
  {
    slug: 'ranger',
    title: 'Le Ranger',
    tagline: 'Créer, éditer & visualiser vos ranges',
    description:
      'Construisez vos ranges préflop/postflop sur la grille 13x13, peignez à la souris et organisez votre bibliothèque de positions.',
    accent: '#10b981',
    icon: 'GridOn',
  },
  {
    slug: 'simulateur',
    title: 'Le Simulateur',
    tagline: "S'entraîner à reconnaître vos ranges",
    description:
      "Lancez des sessions d'entraînement (remplir, deviner, compléter) et recevez un feedback instantané sur chaque main.",
    accent: '#22d3ee',
    icon: 'Casino',
  },
  {
    slug: 'stats',
    title: 'Statistiques',
    tagline: 'Suivre vos progrès',
    description:
      "Visualisez votre précision, vos sessions et votre temps d'entraînement au fil du temps.",
    accent: '#a78bfa',
    icon: 'Insights',
    soon: true,
  },
  {
    slug: 'data',
    title: 'Import / Export',
    tagline: 'Sauvegarder & partager vos ranges',
    description:
      'Importez ou exportez vos ranges en JSON, CSV ou texte brut pour les sauvegarder ou les échanger.',
    accent: '#fbbf24',
    icon: 'ImportExport',
    soon: true,
  },
  {
    slug: 'equity',
    title: "Calculateur d'Équité",
    tagline: "Équité d'une main contre une range",
    description:
      "Comparez l'équité de vos mains contre des ranges adverses (notation QQ+, ATs+, KTs-JTs).",
    accent: '#f43f5e',
    icon: 'Calculate',
  },
  {
    slug: 'icm',
    title: 'ICM / Push-Fold',
    tagline: 'Bientôt disponible',
    description: "Outils de prise de décision en fin de tournoi : push/fold Nash et calculs d'ICM.",
    accent: '#34d399',
    icon: 'Leaderboard',
    soon: true,
  },
];

/**
 * Maps a module slug to the routes that belong to it. Used by the shell
 * to highlight the active module and to resolve the breadcrumb title.
 *
 * Note: range detail routes (/ranges/:id/...) resolve to the ranger module
 * via the startsWith match on "/ranges".
 */
export const MODULE_ROUTES: Record<string, { title: string; paths: string[] }> = {
  ranger: { title: 'Le Ranger', paths: ['/ranges'] },
  simulateur: { title: 'Le Simulateur', paths: ['/training'] },
  stats: { title: 'Statistiques', paths: ['/stats'] },
  data: { title: 'Import / Export', paths: ['/import-export'] },
  equity: { title: "Calculateur d'Équité", paths: ['/equity'] },
};

/** Resolve the active module slug from a pathname. */
export function resolveModule(pathname: string): string | null {
  for (const [slug, def] of Object.entries(MODULE_ROUTES)) {
    if (def.paths.some((p) => pathname.startsWith(p))) {
      return slug;
    }
  }
  return null;
}

/** Resolve the hub vignette to open for a given module slug. */
export function moduleEntry(slug: string): AppEntry | undefined {
  return APP_ENTRIES.find((e) => e.slug === slug);
}

/** Resolve the route to open when selecting a module from the hub. */
export function moduleRoute(slug: string): string | null {
  switch (slug) {
    case 'ranger':
      return '/ranges';
    case 'simulateur':
      return '/training';
    case 'stats':
      return '/stats';
    case 'data':
      return '/import-export';
    case 'equity':
      return '/equity';
    default:
      return null;
  }
}

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: THEME_COLORS.primary,
      dark: THEME_COLORS.primaryDark,
      light: THEME_COLORS.primaryLight,
    },
    secondary: { main: THEME_COLORS.secondary, dark: THEME_COLORS.secondaryDark },
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
    divider: THEME_COLORS.border,
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: THEME_COLORS.background,
          backgroundImage: THEME_COLORS.backgroundGradient,
          backgroundAttachment: 'fixed',
        },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(148,163,184,0.22)',
          borderRadius: 999,
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(148,163,184,0.4)',
          backgroundClip: 'padding-box',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'transform .15s ease, box-shadow .15s ease, background-color .15s ease',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${THEME_COLORS.primaryLight}, ${THEME_COLORS.primaryDark})`,
          boxShadow: `0 6px 18px -6px ${THEME_COLORS.primary}99`,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: `0 10px 24px -8px ${THEME_COLORS.primary}cc`,
          },
        },
        outlined: {
          borderColor: THEME_COLORS.borderStrong,
          '&:hover': {
            borderColor: THEME_COLORS.primary,
            backgroundColor: 'rgba(16,185,129,0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: THEME_COLORS.paper,
          backgroundImage: 'none',
          borderColor: THEME_COLORS.border,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: THEME_COLORS.paper,
          borderRadius: 16,
          border: `1px solid ${THEME_COLORS.border}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(11,15,20,0.72)',
          backdropFilter: 'blur(14px)',
          backgroundImage: 'none',
          borderBottom: `1px solid ${THEME_COLORS.border}`,
          color: THEME_COLORS.textPrimary,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(15,21,30,0.92)',
          backdropFilter: 'blur(16px)',
          borderRight: `1px solid ${THEME_COLORS.border}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          transition: 'background-color .15s ease, color .15s ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(16,185,129,0.14)',
            color: THEME_COLORS.primaryLight,
            '&:hover': { backgroundColor: 'rgba(16,185,129,0.20)' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: THEME_COLORS.paperElevated,
          border: `1px solid ${THEME_COLORS.border}`,
          fontSize: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: THEME_COLORS.paper,
          border: `1px solid ${THEME_COLORS.border}`,
          borderRadius: 18,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: THEME_COLORS.borderStrong,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: THEME_COLORS.primary,
          },
        },
      },
    },
  },
};

export const darkTheme = createTheme(themeOptions);
