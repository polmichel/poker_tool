// Types pour les mains de poker
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Suit = 's' | 'h' | 'd' | 'c';

export interface Hand {
  rank1: Rank;
  rank2: Rank;
  suited: boolean;
  is_pair?: boolean;
  notation: string;
}

// Types pour les actions
export type ActionType = 
  | 'open'
  | 'call'
  | 'raise'
  | 'all_in'
  | 'fold'
  | 'check'
  | 'bet'
  | 'undefined';

// Couleurs associées aux actions (pour le frontend)
export const ACTION_COLORS: Record<ActionType, string> = {
  open: '#4CAF50',     // Vert
  call: '#2196F3',     // Bleu
  raise: '#FF9800',    // Orange
  all_in: '#F44336',   // Rouge
  fold: '#9E9E9E',     // Gris
  check: '#FFEB3B',    // Jaune
  bet: '#9C27B0',      // Violet
  undefined: '#FFFFFF', // Blanc
};

// Types pour les ranges
export type RangeType = 'preflop' | 'postflop' | 'push_fold';
export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB' | 'undefined';

export interface Range {
  id?: number;
  name: string;
  description: string;
  range_type: RangeType;
  position: Position;
  hands: Record<string, ActionType>; // {"AKs": "open", "AA": "raise", ...}
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

// Types pour les scénarios
export type ScenarioType = 'cash_game' | 'tournament' | 'push_fold' | 'heads_up';

export interface Scenario {
  id?: number;
  name: string;
  description: string;
  scenario_type: ScenarioType;
  stack_size?: number;
  position: Position;
  action: string;
  range_id?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

// Types pour l'entraînement
export type TrainingMode = 'fill' | 'guess' | 'complete';

export interface TrainingQuestion {
  type: TrainingMode;
  hand: string;
  question: string;
  correct_answer: string;
}

export interface TrainingSession {
  id?: number;
  user_id?: number;
  range_id: number;
  mode: TrainingMode;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent: number;
  details: {
    questions?: TrainingQuestion[];
    current_question?: number;
    start_time?: string;
  };
  created_at?: string;
}

// Types pour les statistiques
export interface Stats {
  total_ranges: number;
  total_training_sessions: number;
  avg_score: number;
  total_time_spent: number;
}

export interface UserStats extends Stats {
  mode_stats: Record<TrainingMode, {
    total_sessions: number;
    total_questions: number;
    correct_answers: number;
    avg_score: number;
  }>;
  range_stats: Record<number, {
    total_sessions: number;
    total_questions: number;
    correct_answers: number;
    avg_score: number;
  }>;
}

// Types pour les réponses de l'API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Types pour l'authentification
export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Types pour la grille de range
export interface RangeGridCell {
  hand: string;
  action: ActionType;
  color: string;
}

export type RangeGrid = RangeGridCell[][];

// Constantes pour les ranks et les mains
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

// Générer toutes les mains possibles (169 combinaisons)
export function generateAllHands(): Hand[] {
  const hands: Hand[] = [];
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = 0; j < RANKS.length; j++) {
      if (i < j) {
        // Mains non-paires et non-symétriques (ex: AK, AQ)
        hands.push({ rank1: RANKS[i], rank2: RANKS[j], suited: true, notation: `${RANKS[i]}${RANKS[j]}s` });   // Suited
        hands.push({ rank1: RANKS[i], rank2: RANKS[j], suited: false, notation: `${RANKS[i]}${RANKS[j]}o` }); // Offsuit
      } else if (i === j) {
        // Paires (ex: AA, KK)
        hands.push({ rank1: RANKS[i], rank2: RANKS[j], suited: false, is_pair: true, notation: `${RANKS[i]}${RANKS[j]}` });
      }
    }
  }
  return hands;
}

// Générer une grille 13x13 pour l'affichage
export function generateHandGrid(): string[][] {
  const grid: string[][] = [];
  for (const rank1 of RANKS) {
    const row: string[] = [];
    for (const rank2 of RANKS) {
      const i = RANKS.indexOf(rank1);
      const j = RANKS.indexOf(rank2);
      if (i < j) {
        row.push(`${rank1}${rank2}s`); // Suited
      } else if (i > j) {
        row.push(`${rank2}${rank1}o`); // Offsuit (inversé pour éviter les doublons)
      } else {
        row.push(`${rank1}${rank2}`);   // Pair
      }
    }
    grid.push(row);
  }
  return grid;
}

// Convertir une notation de main en objet Hand
export function handFromString(handStr: string): Hand {
  const upperHand = handStr.toUpperCase();
  let suited = false;
  let handStrClean = upperHand;
  
  if (handStrClean.endsWith('S')) {
    suited = true;
    handStrClean = handStrClean.slice(0, -1);
  } else if (handStrClean.endsWith('O')) {
    suited = false;
    handStrClean = handStrClean.slice(0, -1);
  }
  
  if (handStrClean.length === 2) {
    const rank1 = handStrClean[0] as Rank;
    const rank2 = handStrClean[1] as Rank;
    const isPair = rank1 === rank2;
    return { rank1, rank2, suited, is_pair: isPair, notation: upperHand };
  }
  
  throw new Error(`Invalid hand string: ${handStr}`);
}

// Vérifier si une main est valide
export function isValidHand(handStr: string): boolean {
  try {
    handFromString(handStr);
    return true;
  } catch {
    return false;
  }
}
