/**
 * UI Component Types
 * Type definitions for component props and UI-specific types
 */
import { ReactNode } from 'react';
import { Range, TrainingMode, TrainingQuestion, TrainingSession, User } from '../domain';

// ============================================================================
// Common UI Types
// ============================================================================

export interface WithChildren {
  children: ReactNode;
}

export interface WithClassName {
  className?: string;
}

export interface WithStyle {
  style?: Record<string, unknown>;
}

// ============================================================================
// App Shell Types
// ============================================================================

export interface AppShellProps extends WithChildren {}

// ============================================================================
// App Card Types
// ============================================================================

export interface AppEntry {
  slug: string;
  title: string;
  tagline: string;
  icon: string;
  accent: string;
  soon?: boolean;
}

export interface AppCardProps {
  entry: AppEntry;
  onSelect: (entry: AppEntry) => void;
}

// ============================================================================
// Range Types
// ============================================================================

export interface RangeCardProps {
  range: Range;
  onClick?: (range: Range) => void;
  onEdit?: (range: Range) => void;
  onDelete?: (range: Range) => void;
  selected?: boolean;
}

export interface RangeListProps {
  ranges: Range[];
  onRangeSelect: (range: Range) => void;
  selectedRange?: Range | null;
  onCreate?: () => void;
  onEdit?: (range: Range) => void;
  onDelete?: (range: Range) => void;
}

export interface RangeFormProps {
  range?: Range | null;
  onSubmit: (range: Partial<Range>) => void;
  onCancel?: () => void;
}

// ============================================================================
// Training Types
// ============================================================================

export interface TrainingModeSelectorProps {
  selectedMode: TrainingMode;
  onModeChange: (mode: TrainingMode) => void;
  disabled?: boolean;
}

export interface TrainingQuestionProps {
  question: TrainingQuestion;
  onAnswer: (answer: string) => void;
  onNext?: () => void;
  feedback?: {
    isCorrect: boolean;
    correctAnswer: string | null;
    sessionComplete: boolean;
  } | null;
  questionNumber?: number;
  totalQuestions?: number;
}

export interface TrainingGridQuestionProps extends TrainingQuestionProps {
  // Grid-specific props
}

export interface TrainingGuessRangeQuestionProps extends TrainingQuestionProps {
  // Guess range-specific props
}

// ============================================================================
// Session Types
// ============================================================================

export interface SessionProgressProps {
  session: TrainingSession;
  score: number;
  timeSpent: number;
  onEndSession: () => void;
}

// ============================================================================
// Stats Types
// ============================================================================

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
}

export interface RangeStatsProps {
  range: Range;
}

// ============================================================================
// Equity Types
// ============================================================================

export interface EquityHeatmapGridProps {
  data: Record<string, number>;
  onCellClick?: (hand: string) => void;
  selectedHand?: string;
}

// ============================================================================
// Dialog Types
// ============================================================================

export interface DonationDialogProps {
  open: boolean;
  onClose: () => void;
}

export interface ImportExportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport?: (data: string) => void;
  onExport?: () => string;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface UserMenuProps {
  user?: User;
  onLogin: () => void;
  onLogout: () => void;
  onProfile: () => void;
  onSettings: () => void;
}

// ============================================================================
// Layout Types
// ============================================================================

export interface LayoutProps extends WithChildren {
  title?: string;
  showBackButton?: boolean;
  showDrawer?: boolean;
}

export interface DrawerProps {
  mobileOpen: boolean;
  onToggle: () => void;
  collapsed: boolean;
  activeModule?: string;
}

export interface AppBarProps {
  title: string;
  onMenuClick: () => void;
  onFocusToggle: () => void;
  focusMode: boolean;
  user?: User;
  onLogin: () => void;
  onLogout: () => void;
}
