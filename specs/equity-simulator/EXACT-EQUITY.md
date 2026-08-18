# Plan : Équité exacte (énumération + table pré-calculée)

> Statut : **Implémenté** (backend)
> Date : 2024

---

## 1. Contexte

Le moteur `SimulateEquity` (Monte-Carlo) introduit une variance de ±0,5 % à
10 000 itérations : recalculer donne des résultats différents parce que le
tirage est aléatoire. Pour des résultats **précis et reproductibles** (au bit
près), le tirage aléatoire doit être remplacé par une **énumération
exhaustive** des runouts.

Le Monte-Carlo est **conservé intact** : il reste utile pour les cas futurs
non couverts par l'énumération preflop (postflop, range vs range).

## 2. Solution

Trois briques, sans toucher au Monte-Carlo :

### 2.1 `EnumerateEquity` (use case)

`backend/poker_tool/use_cases/enumerate_equity.py`

Énumère **tous** les boards possibles (C(48,5) = 1 712 304) pour un combo-pair
représentatif hero-vs-opp. Par **symétrie des couleurs** (vérifiée
empiriquement : tout combo-pair valide d'une paire canonique donne la même
équité), un seul combo-pair suffit par entrée canonique. Résultat exact,
reproductible au bit près, même signature de sortie que `SimulateEquity`
(`EquityResult`).

### 2.2 Adaptateur `phevaluator`

`backend/poker_tool/adapters/phevaluator/evaluator.py`

Nouvelle implémentation du port `HandEvaluator`, basée sur `phevaluator`
(C++ sous le capot, ~3-4x plus rapide que `treys`). C'est l'évaluateur injecté
dans `EnumerateEquity` pour rendre l'énumération tractable (~11s/paire
au lieu de ~63s avec treys).

### 2.3 Table de pré-calcul (JSON) + `AggregateEquity`

- `backend/poker_tool/scripts/generate_equity_table.py` : génère la table
  complète 169×169 (~28 561 entrées) par énumération, avec `multiprocessing`
  et reprise par batch (`--resume`).
- `backend/poker_tool/objects/equity_table.py` : lecteur de la table JSON
  (O(1) par lookup).
- `backend/poker_tool/use_cases/aggregate_equity.py` : agrège les entrées de
  la table en équité range, **pondérée par les combos réellement disponibles
  après exclusion des cartes du hero** (`available_combos`).

L'agrégat range est **instantané** (lecture pure) et **exact** (pas de
variance, recalcul identique).

## 3. Pondération corrigée

`hand_combos` (6/4/12 bruts) ne tient pas compte des conflits de cartes avec
le hero. Nouvelle fonction `available_combos` (dans
`objects/equity.py`) qui exclut les combos partageant une carte avec le hero.
Exemple : hero `AhKh` vs `AKs` → 3 combos (le `Ah`-suited est impossible), pas
4. L'agrégat `AggregateEquity` utilise ce poids corrigé.

## 4. Performances (mesurées)

| Approche | Précision | Temps / paire | Reproductible |
|---|---|---|---|
| `SimulateEquity` (MC 10k) | ±0,5 % | <1s | non (aléatoire) |
| `EnumerateEquity` (treys) | exacte | ~63s | oui |
| `EnumerateEquity` (phevaluator) | exacte | ~11s | oui |
| Table complète (phevaluator, 4 cœurs) | exacte | ~10h totales | oui |

La table complète est générée une fois puis versionnée dans
`backend/data/equity_table.json`. Voir `backend/data/README.md`.

## 5. Architecture (Elegant Objects)

- Le port `HandEvaluator` est inchangé ; `phevaluator` est un nouvel adaptateur
  injectable au même titre que `treys`.
- `EnumerateEquity` et `AggregateEquity` sont des use cases purs (aucune I/O
  hormis la lecture de fichier pour `AggregateEquity`), testables avec fakes.
- `SimulateEquity` n'est pas modifié.
