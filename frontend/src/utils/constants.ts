// Constantes pour l'application

// Couleurs des actions (même ordre que dans le backend)
export const ACTION_COLORS = {
  open: '#4CAF50',     // Vert
  call: '#2196F3',     // Bleu
  raise: '#FF9800',    // Orange
  all_in: '#F44336',   // Rouge
  fold: '#9E9E9E',     // Gris
  check: '#FFEB3B',    // Jaune
  bet: '#9C27B0',      // Violet
  undefined: '#607D8B', // Gris-bleu (visible sur fond clair et foncé)
};

// Noms des actions en français
export const ACTION_LABELS: Record<string, string> = {
  open: 'Ouvrir',
  call: 'Suivre',
  raise: 'Relancer',
  all_in: 'All-In',
  fold: 'Passer',
  check: 'Checker',
  bet: 'Miser',
  undefined: 'Non défini',
};

// Positions
export const POSITIONS = [
  { value: 'UTG', label: 'UTG' },
  { value: 'MP', label: 'MP' },
  { value: 'CO', label: 'CO' },
  { value: 'BTN', label: 'BTN' },
  { value: 'SB', label: 'SB' },
  { value: 'BB', label: 'BB' },
];

// Types de ranges
export const RANGE_TYPES = [
  { value: 'preflop', label: 'Préflop' },
  { value: 'postflop', label: 'Postflop' },
  { value: 'push_fold', label: 'Push/Fold' },
];

// Types de scénarios
export const SCENARIO_TYPES = [
  { value: 'cash_game', label: 'Cash Game' },
  { value: 'tournament', label: 'Tournoi' },
  { value: 'push_fold', label: 'Push/Fold' },
  { value: 'heads_up', label: 'Heads-Up' },
];

// Modes d'entraînement
export const TRAINING_MODES = [
  { value: 'fill', label: 'Remplir une range' },
  { value: 'guess', label: 'Deviner une range' },
  { value: 'complete', label: 'Compléter une range' },
];

// Ranks (ordres des cartes)
export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Grille 13x13 pour l'affichage des ranges
export const HAND_GRID = [
  ['AA', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s'],
  ['KAo', 'KK', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s'],
  ['QAo', 'QKo', 'QQ', 'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s'],
  ['JAo', 'JKo', 'JQo', 'JJo', 'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s'],
  ['TAo', 'TKo', 'TQo', 'TJo', 'TT', 'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s'],
  ['9Ao', '9Ko', '9Qo', '9Jo', '9To', '99', '98s', '97s', '96s', '95s', '94s', '93s', '92s'],
  ['8Ao', '8Ko', '8Qo', '8Jo', '8To', '89o', '88', '87s', '86s', '85s', '84s', '83s', '82s'],
  ['7Ao', '7Ko', '7Qo', '7Jo', '7To', '79o', '78o', '77', '76s', '75s', '74s', '73s', '72s'],
  ['6Ao', '6Ko', '6Qo', '6Jo', '6To', '69o', '68o', '67o', '66', '65s', '64s', '63s', '62s'],
  ['5Ao', '5Ko', '5Qo', '5Jo', '5To', '59o', '58o', '57o', '56o', '55', '54s', '53s', '52s'],
  ['4Ao', '4Ko', '4Qo', '4Jo', '4To', '49o', '48o', '47o', '46o', '45o', '44', '43s', '42s'],
  ['3Ao', '3Ko', '3Qo', '3Jo', '3To', '39o', '38o', '37o', '36o', '35o', '34o', '33', '32s'],
  ['2Ao', '2Ko', '2Qo', '2Jo', '2To', '29o', '28o', '27o', '26o', '25o', '24o', '23o', '22'],
];

// Couleurs pour le thème
export const THEME_COLORS = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  background: '#121212',
  paper: '#1e1e1e',
  textPrimary: '#ffffff',
  textSecondary: '#b0b0b0',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  success: '#4CAF50',
};

// Tailles pour la grille
export const GRID_CONFIG = {
  cellSize: 40, // Taille d'une cellule en pixels
  gridGap: 2,   // Espacement entre les cellules
  handFontSize: 10, // Taille de la police pour les mains
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  INVALID_HAND: 'Main invalide. Utilisez une notation comme "AKs", "TT", ou "JTo".',
  RANGE_NOT_FOUND: 'Range non trouvée.',
  SESSION_NOT_FOUND: 'Session d\'entraînement non trouvée.',
  NO_RANGES: 'Aucune range disponible. Veuillez en créer une d\'abord.',
  AUTH_REQUIRED: 'Authentification requise.',
  INVALID_CREDENTIALS: 'Identifiants invalides.',
};

// Messages de succès
export const SUCCESS_MESSAGES = {
  RANGE_CREATED: 'Range créée avec succès !',
  RANGE_UPDATED: 'Range mise à jour avec succès !',
  RANGE_DELETED: 'Range supprimée avec succès !',
  TRAINING_COMPLETED: 'Session d\'entraînement terminée !',
  LOGIN_SUCCESS: 'Connexion réussie !',
  REGISTER_SUCCESS: 'Inscription réussie !',
};

// Paramètres par défaut pour les nouvelles ranges
export const DEFAULT_RANGE = {
  name: 'Nouvelle Range',
  description: '',
  range_type: 'preflop' as const,
  position: 'UTG' as const,
  hands: {} as Record<string, string>,
};

// Paramètres par défaut pour les nouvelles sessions d'entraînement
export const DEFAULT_TRAINING_SESSION = {
  mode: 'fill' as const,
  range_id: null as number | null,
  total_questions: 10,
};
