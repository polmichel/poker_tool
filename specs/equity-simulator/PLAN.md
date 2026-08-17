# Plan : Simulateur d'Équité « Range vs Main »

> Statut : **Plan / Spécification** — en attente d'implémentation
> Fenêtre cible : module `equity` (déjà déclaré dans `frontend/src/app/theme.ts`, actuellement `soon: true`)
> Date : 2024

---

## 1. Objectif

Développer une nouvelle fenêtre de l'application permettant de **simuler l'équité
d'une range contre une main donnée**. Concrètement :

- L'utilisateur sélectionne (ou construit) une **range adverse** (ensemble de mains,
  169 combinaisons sur la grille 13×13).
- L'utilisateur saisit une **main précise** (ex. `AKs`, `TT`, `Q9o`).
- Le simulateur calcule et affiche l'**équité** de la main contre la range :
  - % de **victoire** (win)
  - % d'**égalité** (tie)
  - % de **défaite** (lose = 100 − win − tie)
- Affichage par **main de la range** (équité contre chaque main individuelle) +
  agrégat pondéré par le nombre de combinaisons réelles.

Cette fenêtre correspond au module `equity` déjà présent dans
`frontend/src/app/theme.ts` (entrée `APP_ENTRIES` avec `icon: 'Calculate'`,
`accent: '#f43f5e'`, `soon: true`). Le plan consiste à **activer ce module**.

---

## 2. Contexte & architecture existante

Le dépôt suit une architecture en couches (style Elegant Objects) :

```
backend/poker_tool/
├── objects/            # Objets domaine purs (Hand, Range, Action, Position…)
├── interfaces/        # Ports abstraits (Ranges, Auth…)
├── use_cases/          # Cas d'utilisation (CreateRange, StartTrainingSession…)
├── adapters/           # Implémentations concrètes (SQLAlchemy, JWT)
└── infrastructure/     # Couche web (controllers Flask, flask_app.py)

frontend/src/
├── types/index.ts      # Types TS partagés (Hand, Range, generateAllHands()…)
├── api/                # Couche HTTP (RangesApi.ts, client.ts…)
├── hooks/              # Hooks React (useRanges, useTraining…)
├── components/          # Composants UI (RangeGrid, RangeForm…)
├── pages/              # Pages = fenêtres (Training, Ranges, Stats…)
└── app/                # theme.ts (registre des modules), AppShell, routes (App.tsx)
```

Points-clés à respecter :

- **Backend** : objets immuables, ports injectés, use cases purs, controllers fins.
- **Frontend** : `theme.ts` est la source de vérité des modules (hub + navigation).
  `App.tsx` déclare les routes, `AppShell.tsx` le drawer, `pages/index.ts` les exports.
- **Tests** : backend pytest (unitaires avec fakes + intégration), frontend jest,
  e2e Playwright dans `frontend/tests/e2e/specs/`.
- **Pas de nouvelle dépendance** sauf si strictement nécessaire au calcul d'équité
  (voir §6 — décision à valider).

---

## 3. Périmètre fonctionnel

### 3.1 Inclus (MVP)

1. **Sélection de la range adverse**
   - Réutiliser une range existante de l'utilisateur (sélecteur type `Training.tsx`).
   - Saisie libre d'une range au format texte (`AKs,QQ+,ATs,KTs-` …).
2. **Saisie de la main héro**
   - Champ texte + validation (`isValidHand` déjà dans `types/index.ts`).
3. **Calcul d'équité**
   - Win / Tie / Lose de la main héro contre la range entière (pondération par
     combinaisons réelles : 6 pour paires, 4 suited, 12 offsuit).
   - Détail par main de la range (tableau).
4. **Affichage**
   - Jauges / barres (win/tie/lose) — réutiliser `LinearProgress` comme `Training.tsx`.
   - Tableau détaillé par main adverse.
   - Grille 13×13 colorée selon l'équité (réutiliser `RangeGrid.tsx` en mode « heatmap »).
5. **Intégration navigation**
   - Activer l'entrée `equity` du hub (`soon: false`, route `/equity`).

### 3.2 Hors périmètre (futur)

- Équité range vs range (seulement main vs range au MVP).
- Board postflop (équité préflop uniquement au MVP).
- Sauvegarde / historique des simulations.
- Mode « main vs main » isolé (couvert indirectement par une range à une main).

---

## 4. Conception technique

### 4.1 Backend — moteur d'équité

#### Nouveaux objets domaine (`backend/poker_tool/objects/`)

- `deck.py` : objet `Deck` (52 cartes) + `Card` immuable (rank + suit).
  Méthodes : `shuffle()`, `deal(n)`, `without(blocked)`.
- `equity.py` : objet `EquityResult` (win/tie/lose en flottants, + détail par main
  adverse). Purement data, sérialisable via `to_dict()`.

#### Nouveau use case (`backend/poker_tool/use_cases/`)

- `simulate_equity.py` : `SimulateEquity`
  - Entrée : `hero_hand: str`, `range_hands: list[str]`, `iterations: int`.
  - Algorithme : **Monte-Carlo** (tirage aléatoire de board + main adverse parmi
    la range, évaluation des showdowns).
  - Pondération : chaque main adverse tirée proportionnellement à son nombre de
    combinaisons réelles (paire=6, suited=4, offsuit=12).
  - Sortie : `EquityResult`.
  - Dépendances injectées : aucune I/O (pur calcul) → testable avec fakes.

#### Évaluateur de mains

Décision à trancher (voir §6). Options :

- **(A)** Implémenter un évaluateur de mains 5/7 cartes « maison » (royal flush →
  high card) — lourd mais zéro dépendance, cohérent avec la philosophie du repo.
- **(B)** Ajouter une dépendance Python éprouvée (`treys` ou `deuces`) — rapide,
  éprouvé, mais introduit une nouvelle dépendance (`requirements.txt`).

Recommandation MVP : **(B)** avec `treys` (MIT, maintenu), car le calcul exact
d'évaluateur 7 cartes est sujet à erreurs et sort du périmètre métier. À valider.

#### Nouveau controller (`infrastructure/web/controllers/equity.py`)

- `EquityController` (fin, délègue à `SimulateEquity`).
- Endpoint : `POST /api/equity/simulate`
  ```json
  // Request
  { "hero": "AKs", "range": ["QQ", "AKs", "AQs+"], "iterations": 10000 }

  // Response
  {
    "hero": "AKs",
    "win": 46.2,
    "tie": 1.1,
    "lose": 52.7,
    "iterations": 10000,
    "by_hand": [
      { "hand": "QQ",   "combos": 6, "win": 46.1, "tie": 0.9, "lose": 53.0 },
      { "hand": "AKs",  "combos": 4, "win": 50.0, "tie": 0.0, "lose": 50.0 },
      { "hand": "AQs",  "combos": 4, "win": 70.4, "tie": 1.2, "lose": 28.4 }
    ]
  }
  ```
- Validation : `hero` via `Hand.from_string`, `range` via parseur de notation.

#### Parseur de notation de range

- Réutiliser la logique existante : `objects/hand.py` (`Hand.from_string`,
  `generate_all_hands`). Étendre avec un `RangeParser` (ex. `QQ+`, `ATs+`,
  `KTs-JTs`) — vérifier si un parsing de notation existe déjà côté range
  (`adapters/sqlalchemy/ranges.py` ou `use_cases`). Sinon, à créer dans
  `objects/range.py` ou un nouveau `objects/range_parser.py`.

#### Composition (`app.py`)

- Instancier `SimulateEquity` + `EquityController` dans `PokerTool.__init__`.
- Passer au `FlaskApp` qui enregistre le blueprint equity.

---

### 4.2 Frontend — fenêtre « Calculateur d'Équité »

#### Types (`types/index.ts`)

- `EquityResult`, `EquityByHand` (miroir du contrat backend ci-dessus).

#### Couche API (`api/EquityApi.ts`)

- `EquityApi.simulate(hero, range, iterations)` → `EquityResult`.
- Exporté depuis `api/index.ts`.

#### Hook (`hooks/useEquity.ts`)

- `useEquity()` : `{ result, loading, error, simulate(hero, range, iterations), reset }`.
- Pattern identique à `useTraining.ts` / `useRanges.ts`.

#### Page (`pages/Equity.tsx`)

- En-tête « Calculateur d'Équité » + bouton « Simuler » (data-testid).
- Sélecteur de range (réutiliser `RangeList` ou chips comme `Training.tsx`).
- Champ de saisie de la main héro (`TextField` + `isValidHand`).
- Champ texte pour saisie libre de range (optionnel, en complément du sélecteur).
- Bouton « Simuler » déclenchant le calcul.
- Zone de résultats :
  - 3 barres `LinearProgress` (win/tie/lose) avec couleurs (vert / gris / rouge).
  - Grille 13×13 en heatmap (composant dérivé de `RangeGrid.tsx`).
  - Tableau détaillé `by_hand` (triable).
- États : loading (`CircularProgress`), error (`Paper` rouge), vide.

#### Composant heatmap (`components/EquityHeatmapGrid.tsx`)

- S'inspirer de `RangeGrid.tsx` mais colorer chaque cellule selon l'équité
  (gradient rouge → jaune → vert) plutôt que par action.

#### Activation du module (`app/theme.ts` + `App.tsx` + `pages/index.ts`)

- `theme.ts` :
  - `APP_ENTRIES` : retirer `soon: true` sur l'entrée `equity`.
  - `MODULE_ROUTES` : ajouter `equity: { title: "Calculateur d'Équité", paths: ['/equity'] }`.
  - `moduleRoute()` : `case 'equity': return '/equity';`
- `App.tsx` : ajouter `<Route path="/equity" element={<ProtectedRoute><Equity /></ProtectedRoute>} />`.
- `pages/index.ts` : `export { default as Equity } from './Equity';`

---

## 5. Découpage des tâches (ordre suggéré)

### Phase 1 — Backend (moteur d'équité)
1. **T1** — Valider le choix de l'évaluateur (§6) et, le cas échéant, ajouter
   `treys` à `backend/requirements.txt`.
2. **T2** — Objets domaine : `objects/deck.py` (`Card`, `Deck` immuables).
3. **T3** — `objects/equity.py` (`EquityResult` + `EquityByHand`, `to_dict()`).
4. **T4** — `objects/range_parser.py` : parsing notation `QQ+`, `ATs+`, `KTs-JTs`
   → `list[Hand]` (si non déjà existant).
5. **T5** — Use case `use_cases/simulate_equity.py` (`SimulateEquity`, Monte-Carlo).
6. **T6** — Controller `infrastructure/web/controllers/equity.py`
   (`POST /api/equity/simulate`).
7. **T7** — Câblage dans `app.py` + `infrastructure/web/flask_app.py`.
8. **T8** — Tests backend :
   - Unitaires `tests/unit/objects/test_deck.py`, `test_equity.py`,
     `test_range_parser.py`.
   - Use case `tests/unit/use_cases/test_simulate_equity.py` (avec faux deck
     déterministe pour assertions reproductibles).
   - Intégration `tests/integration/test_app_composition.py` (endpoint).

### Phase 2 — Frontend (fenêtre)
9. **T9** — Types `EquityResult` / `EquityByHand` dans `types/index.ts`.
10. **T10** — `api/EquityApi.ts` + export `api/index.ts`.
11. **T11** — Hook `hooks/useEquity.ts` (+ test `hooks/__tests__/useEquity.test.tsx`).
12. **T12** — Composant `components/EquityHeatmapGrid.tsx` (dérivé de `RangeGrid`).
13. **T13** — Page `pages/Equity.tsx`.
14. **T14** — Activation : `theme.ts`, `App.tsx`, `pages/index.ts`.
15. **T15** — Test composant `components/__tests__/EquityHeatmapGrid.test.tsx`.
16. **T16** — Test page `pages/__tests__/Equity.test.tsx`.

### Phase 3 — E2E & finition
17. **T17** — Spec E2E `frontend/tests/e2e/specs/equity.spec.ts` :
    - Navigation hub → `/equity`.
    - Saisie main + range → résultats affichés (data-testid).
18. **T18** — Mise à jour `README.md` (fonctionnalité + endpoint API).

---

## 6. Décisions à valider

| # | Décision | Options | Recommandation |
|---|----------|---------|----------------|
| D1 | Évaluateur de mains 7 cartes | (A) maison — zéro dépendance, sujet à bugs / (B) `treys` | **(B) `treys`** |
| D2 | Méthode de calcul | Monte-Carlo vs énumération exacte | **Monte-Carlo** (MVP, 10k itérations) |
| D3 | Équité preflop vs postflop | preflop seulement / + board | **Preflop** (MVP) |
| D4 | Saisie de la range | sélecteur de range existante / saisie texte libre / les deux | **Les deux** |
| D5 | Auth sur l'endpoint | protégé (JWT) / public | **Protégé** (cohérent avec autres modules) |
| D6 | Dossier des specs | `specs/equity-simulator/` (ce doc) | confirmé |

---

## 7. Risques & mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Évaluateur maison faux | Équité erronée | Préférer `treys` (D1) ; tests de régression vs valeurs connues |
| Perf Monte-Carlo | Latence UI | 10k itérations max + spinner ; calcul côté backend |
| Nouvelle dépendance `treys` | Maintenance | Licence MIT, légère, maintient ; ajouter à `requirements.txt` |
| Réutilisation de `RangeGrid` en heatmap | Casse composant existant | Créer `EquityHeatmapGrid` dédié (ne pas modifier `RangeGrid`) |
| Parseur de notation de range | Comportement inattendu | Tests exhaustifs (`QQ+`, `ATs+`, plages `KTs-JTs`) |

---

## 8. Critères d'acceptation

- [ ] `POST /api/equity/simulate` renvoie win/tie/lose + `by_hand` corrects
      (tests backend passants, équité AKs vs QQ ≈ 46/0.9/53).
- [ ] Le module `equity` est navigable depuis le hub (plus `soon`).
- [ ] La page `/equity` permet : choisir une range, saisir une main, lancer la
      simulation, voir les résultats (barres + tableau + heatmap).
- [ ] Tests unitaires backend + frontend verts.
- [ ] Spec E2E `equity.spec.ts` verte.
- [ ] `README.md` documente la nouvelle fonctionnalité et l'endpoint.
- [ ] Aucune régression sur les modules existants (CI verte).

---

## 9. Fichiers impactés (résumé)

**Créations**
- `backend/poker_tool/objects/deck.py`
- `backend/poker_tool/objects/equity.py`
- `backend/poker_tool/objects/range_parser.py` *(si besoin)*
- `backend/poker_tool/use_cases/simulate_equity.py`
- `backend/poker_tool/infrastructure/web/controllers/equity.py`
- `backend/poker_tool/tests/unit/objects/test_deck.py`
- `backend/poker_tool/tests/unit/objects/test_equity.py`
- `backend/poker_tool/tests/unit/objects/test_range_parser.py` *(si besoin)*
- `backend/poker_tool/tests/unit/use_cases/test_simulate_equity.py`
- `frontend/src/api/EquityApi.ts`
- `frontend/src/hooks/useEquity.ts`
- `frontend/src/hooks/__tests__/useEquity.test.tsx`
- `frontend/src/components/EquityHeatmapGrid.tsx`
- `frontend/src/components/__tests__/EquityHeatmapGrid.test.tsx`
- `frontend/src/pages/Equity.tsx`
- `frontend/src/pages/__tests__/Equity.test.tsx`
- `frontend/tests/e2e/specs/equity.spec.ts`

**Modifications**
- `backend/requirements.txt` *(si `trees` retenu)*
- `backend/poker_tool/app.py` (composition)
- `backend/poker_tool/infrastructure/web/flask_app.py` (blueprint)
- `frontend/src/types/index.ts` (types équité)
- `frontend/src/api/index.ts` (export)
- `frontend/src/hooks/index.ts` (export)
- `frontend/src/components/index.ts` (export)
- `frontend/src/pages/index.ts` (export)
- `frontend/src/app/theme.ts` (activation module `equity`)
- `frontend/src/App.tsx` (route `/equity`)
- `README.md` (documentation)

---

*Document de plan — à compléter/ajuster après validation des décisions §6 avant implémentation.*
