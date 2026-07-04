from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, Any
import json


class ActionType(Enum):
    OPEN = "open"
    CALL = "call"
    RAISE = "raise"
    ALL_IN = "all_in"
    FOLD = "fold"
    CHECK = "check"
    BET = "bet"
    UNDEFINED = "undefined"


# Mapping des couleurs pour le frontend
ACTION_COLORS: Dict[ActionType, str] = {
    ActionType.OPEN: "#4CAF50",      # Vert
    ActionType.CALL: "#2196F3",      # Bleu
    ActionType.RAISE: "#FF9800",     # Orange
    ActionType.ALL_IN: "#F44336",    # Rouge
    ActionType.FOLD: "#9E9E9E",      # Gris
    ActionType.CHECK: "#FFEB3B",     # Jaune
    ActionType.BET: "#9C27B0",       # Violet
    ActionType.UNDEFINED: "#FFFFFF",  # Blanc
}


RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]
SUITS = ["s", "h", "d", "c"]  # Pique, Cœur, Carreau, Trèfle


@dataclass
class Hand:
    """Représente une main de poker (ex: 'AKs', 'TT', 'JTs')."""
    rank1: str
    rank2: str
    suited: bool = False
    
    def __post_init__(self):
        # Normaliser les ranks (ex: '10' -> 'T')
        rank_mapping = {"10": "T", "1": "A", "11": "J", "12": "Q", "13": "K"}
        self.rank1 = rank_mapping.get(self.rank1, self.rank1.upper())
        self.rank2 = rank_mapping.get(self.rank2, self.rank2.upper())
        
        # Ordonner les ranks (ex: 'KA' -> 'AK')
        if RANKS.index(self.rank1) > RANKS.index(self.rank2):
            self.rank1, self.rank2 = self.rank2, self.rank1
    
    @property
    def is_pair(self) -> bool:
        return self.rank1 == self.rank2
    
    @property
    def is_suited(self) -> bool:
        return self.suited
    
    def to_string(self) -> str:
        """Retourne la représentation standard de la main (ex: 'AKs', 'TT')."""
        if self.is_pair:
            return f"{self.rank1}{self.rank2}"
        return f"{self.rank1}{self.rank2}{"s" if self.suited else "o"}"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "rank1": self.rank1,
            "rank2": self.rank2,
            "suited": self.suited,
            "is_pair": self.is_pair,
            "notation": self.to_string(),
        }
    
    @classmethod
    def from_string(cls, hand_str: str) -> "Hand":
        """Crée une Hand à partir d'une notation standard (ex: 'AKs', 'TT', 'JTo')."""
        hand_str = hand_str.upper().strip()
        suited = hand_str.endswith("S")
        if suited:
            hand_str = hand_str[:-1]
        
        if len(hand_str) == 2:
            rank1, rank2 = hand_str[0], hand_str[1]
            suited = suited
        elif len(hand_str) == 3:
            rank1, rank2, suit_indicator = hand_str[0], hand_str[1], hand_str[2]
            suited = (suit_indicator == "S")
        else:
            raise ValueError(f"Invalid hand string: {hand_str}")
        
        return cls(rank1, rank2, suited)


@dataclass
class HandSchema:
    """Schema pour la sérialisation/désérialisation des mains."""
    @staticmethod
    def serialize(hand: Hand) -> str:
        return hand.to_string()
    
    @staticmethod
    def deserialize(data: str) -> Hand:
        return Hand.from_string(data)


# Générer toutes les mains possibles (13x13 = 169 mains)
def generate_all_hands() -> list:
    """Génère toutes les mains préflop possibles (169 combinaisons)."""
    hands = []
    for i, rank1 in enumerate(RANKS):
        for j, rank2 in enumerate(RANKS):
            if i < j:
                # Mains non-paires et non-symétriques (ex: AK, AQ)
                hands.append(Hand(rank1, rank2, suited=True))   # Suited
                hands.append(Hand(rank1, rank2, suited=False)) # Offsuit
            elif i == j:
                # Paires (ex: AA, KK)
                hands.append(Hand(rank1, rank2, suited=False))
    return hands


# Grille 13x13 pour le frontend
def get_hand_grid() -> list:
    """Retourne une grille 13x13 des mains (pour l'affichage)."""
    grid = []
    for rank1 in RANKS:
        row = []
        for rank2 in RANKS:
            if RANKS.index(rank1) < RANKS.index(rank2):
                row.append(f"{rank1}{rank2}s")  # Suited
            elif RANKS.index(rank1) > RANKS.index(rank2):
                row.append(f"{rank2}{rank1}o")  # Offsuit (inversé pour éviter les doublons)
            else:
                row.append(f"{rank1}{rank2}")   # Pair
        grid.append(row)
    return grid


if __name__ == "__main__":
    # Test
    print("Toutes les mains :")
    for hand in generate_all_hands():
        print(hand.to_string())
    
    print("\nGrille 13x13 :")
    grid = get_hand_grid()
    for row in grid:
        print(row)
