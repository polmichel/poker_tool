// Fonctions utilitaires pour l'application

import { RANKS, ACTION_COLORS, ActionType, Hand, RangeGridCell } from '../types';

// Générer une grille 13x13 pour une range donnée
export function generateRangeGrid(rangeHands: Record<string, ActionType>): RangeGridCell[][] {
  const grid: RangeGridCell[][] = [];
  
  for (let i = 0; i < RANKS.length; i++) {
    const row: RangeGridCell[] = [];
    for (let j = 0; j < RANKS.length; j++) {
      let handStr: string;
      if (i < j) {
        handStr = `${RANKS[i]}${RANKS[j]}s`; // Suited
      } else if (i > j) {
        handStr = `${RANKS[j]}${RANKS[i]}o`; // Offsuit
      } else {
        handStr = `${RANKS[i]}${RANKS[j]}`;   // Pair
      }
      
      const action = rangeHands[handStr] || 'fold';
      row.push({
        hand: handStr,
        action,
        color: ACTION_COLORS[action] || '#FFFFFF',
      });
    }
    grid.push(row);
  }
  
  return grid;
}

// Convertir une grille en objet hands (pour sauvegarde)
export function gridToHands(grid: RangeGridCell[][]): Record<string, ActionType> {
  const hands: Record<string, ActionType> = {};
  
  for (const row of grid) {
    for (const cell of row) {
      hands[cell.hand] = cell.action;
    }
  }
  
  return hands;
}

// Inverser une grille (pour l'affichage en miroir)
export function reverseGrid(grid: RangeGridCell[][]): RangeGridCell[][] {
  return [...grid].reverse().map(row => [...row].reverse());
}

// Obtenir le nom complet d'une main (ex: "AKs" -> "As Ks")
export function getHandFullName(handStr: string): string {
  if (handStr.length === 2) {
    // Pair (ex: "AA")
    return `${handStr[0]}${handStr[1]}`;
  } else if (handStr.length === 3) {
    // Main suited ou offsuit (ex: "AKs", "JTo")
    const suited = handStr[2] === 's';
    return `${handStr[0]}${handStr[1]}${suited ? 's' : 'o'}`;
  }
  return handStr;
}

// Obtenir la couleur de fond en fonction de l'action
export function getActionColor(action: ActionType): string {
  return ACTION_COLORS[action] || '#FFFFFF';
}

// Obtenir le label de l'action en français
export function getActionLabel(action: ActionType): string {
  const labels: Record<ActionType, string> = {
    open: 'Ouvrir',
    call: 'Suivre',
    raise: 'Relancer',
    all_in: 'All-In',
    fold: 'Passer',
    check: 'Checker',
    bet: 'Miser',
    undefined: 'Non défini',
  };
  return labels[action] || action;
}

// Vérifier si une main est une paire
export function isPair(handStr: string): boolean {
  if (handStr.length === 2) {
    return handStr[0] === handStr[1];
  }
  return false;
}

// Vérifier si une main est suited
export function isSuited(handStr: string): boolean {
  return handStr.endsWith('s');
}

// Obtenir les ranks d'une main
export function getHandRanks(handStr: string): { rank1: string; rank2: string } {
  if (handStr.length === 2) {
    return { rank1: handStr[0], rank2: handStr[1] };
  } else if (handStr.length === 3) {
    return { rank1: handStr[0], rank2: handStr[1] };
  }
  return { rank1: '', rank2: '' };
}

// Comparer deux mains (pour le tri)
export function compareHands(a: string, b: string): number {
  const rankIndex = (rank: string): number => RANKS.indexOf(rank as any);
  
  const aRanks = getHandRanks(a);
  const bRanks = getHandRanks(b);
  
  const aRank1 = rankIndex(aRanks.rank1);
  const aRank2 = rankIndex(aRanks.rank2);
  const bRank1 = rankIndex(bRanks.rank1);
  const bRank2 = rankIndex(bRanks.rank2);
  
  // Comparer par le rank le plus haut
  const aHigh = Math.min(aRank1, aRank2);
  const bHigh = Math.min(bRank1, bRank2);
  
  if (aHigh !== bHigh) {
    return aHigh - bHigh;
  }
  
  // Comparer par le rank le plus bas
  const aLow = Math.max(aRank1, aRank2);
  const bLow = Math.max(bRank1, bRank2);
  
  if (aLow !== bLow) {
    return aLow - bLow;
  }
  
  // Si même ranks, les paires viennent avant les mains suited, qui viennent avant les mains offsuit
  if (aRanks.rank1 === aRanks.rank2 && bRanks.rank1 === bRanks.rank2) {
    return 0;
  } else if (aRanks.rank1 === aRanks.rank2) {
    return -1;
  } else if (bRanks.rank1 === bRanks.rank2) {
    return 1;
  } else if (a.endsWith('s') && !b.endsWith('s')) {
    return -1;
  } else if (!a.endsWith('s') && b.endsWith('s')) {
    return 1;
  }
  
  return 0;
}

// Filtrer les mains par action
export function filterHandsByAction(
  hands: Record<string, ActionType>,
  action: ActionType
): Record<string, ActionType> {
  const filtered: Record<string, ActionType> = {};
  for (const [hand, handAction] of Object.entries(hands)) {
    if (handAction === action) {
      filtered[hand] = handAction;
    }
  }
  return filtered;
}

// Calculer les statistiques d'une range
export function calculateRangeStats(hands: Record<string, ActionType>): {
  total: number;
  byAction: Record<ActionType, number>;
  percentage: number;
} {
  const total = Object.keys(hands).length;
  const byAction: Record<ActionType, number> = {
    open: 0,
    call: 0,
    raise: 0,
    all_in: 0,
    fold: 0,
    check: 0,
    bet: 0,
    undefined: 0,
  };
  
  for (const action of Object.values(hands)) {
    byAction[action] = (byAction[action] || 0) + 1;
  }
  
  return {
    total,
    byAction,
    percentage: total / 169 * 100,
  };
}

// Générer un nom unique pour une range
export function generateUniqueRangeName(existingNames: string[]): string {
  let counter = 1;
  let name = `Ma Range ${counter}`;
  
  while (existingNames.includes(name)) {
    counter++;
    name = `Ma Range ${counter}`;
  }
  
  return name;
}

// Formater le temps en minutes et secondes
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// Formater un pourcentage
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

// Générer une couleur aléatoire (pour les statistiques)
export function getRandomColor(): string {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#8AC24A', '#607D8B',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Vérifier si une main est valide
export function isValidHand(handStr: string): boolean {
  if (!handStr || handStr.length < 2 || handStr.length > 3) {
    return false;
  }
  
  const upperHand = handStr.toUpperCase();
  const ranks = upperHand.slice(0, 2);
  const suit = upperHand.slice(2);
  
  // Vérifier les ranks
  for (const rank of ranks) {
    if (!RANKS.includes(rank as any)) {
      return false;
    }
  }
  
  // Vérifier le suit (s'il est présent)
  if (suit && !['S', 'O', ''].includes(suit)) {
    return false;
  }
  
  return true;
}

// Obtenir une main aléatoire
export function getRandomHand(): string {
  const ranks = [...RANKS];
  const i = Math.floor(Math.random() * ranks.length);
  const j = Math.floor(Math.random() * ranks.length);
  const suited = Math.random() > 0.5;
  
  if (i === j) {
    return `${ranks[i]}${ranks[j]}`;
  } else if (i < j) {
    return `${ranks[i]}${ranks[j]}${suited ? 's' : 'o'}`;
  } else {
    return `${ranks[j]}${ranks[i]}${suited ? 's' : 'o'}`;
  }
}

// Obtenir une action aléatoire
export function getRandomAction(): ActionType {
  const actions: ActionType[] = ['open', 'call', 'raise', 'all_in', 'fold', 'check', 'bet'];
  return actions[Math.floor(Math.random() * actions.length)];
}
