/**
 * Centralized icon registry.
 *
 * Lets data files (APP_ENTRIES, menu configs) reference icons by name string
 * instead of importing JSX in non-component modules.
 */
import type { SvgIconTypeMap } from '@mui/material';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import {
  GridOn,
  Casino,
  Insights,
  ImportExport,
  Calculate,
  Leaderboard,
  Home,
  List as ListIcon,
  School,
  BarChart,
  Settings,
  Login,
  Logout,
  Person,
  ArrowBack,
} from '@mui/icons-material';

export type IconComponent = OverridableComponent<SvgIconTypeMap<{}, 'svg'>>;

const ICONS: Record<string, IconComponent> = {
  GridOn,
  Casino,
  Insights,
  ImportExport,
  Calculate,
  Leaderboard,
  Home,
  List: ListIcon,
  School,
  BarChart,
  Settings,
  Login,
  Logout,
  Person,
  ArrowBack,
};

/** Resolve an icon name to its component. Falls back to Home. */
export function getIcon(name: string): IconComponent {
  return ICONS[name] ?? Home;
}
