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
export type ActionType = 'open' | 'call' | 'raise' | 'all_in' | 'fold' | 'check' | 'undefined';

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

// Type de question : les modes classiques plus le mode grille à peindre.
export type TrainingQuestionKind = TrainingMode | 'grid_paint';
export interface TrainingQuestion {
  type: TrainingQuestionKind;
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

// Types pour le simulateur d'équité (range vs main)
export interface EquityByHand {
  hand: string;
  combos: number;
  win: number;
  tie: number;
  lose: number;
}

export interface EquityResult {
  hero: string;
  win: number;
  tie: number;
  lose: number;
  iterations: number;
  by_hand: EquityByHand[];
}
