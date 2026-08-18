# Plan de qualité de code (screaming architecture + Elegant Objects)

> Ce document est le plan de découpage d'une passe de qualité de code sur le
> frontend et le backend, dans l'esprit des principes d'Elegant Objects
> (Yegor Bugayenko) et de la screaming architecture. Il est livré comme
> artifact pour revue ; aucune modification fonctionnelle n'est appliquée
> dans cette PR.

## Contexte

Packages nommés selon ce qu'ils *font* (et non selon le pattern technique),
objets immuables, dépendances injectées, pas de méthode statique, pas de
`new` dans les objets métier, responsabilité unique.

Chaque phase ci-dessous fera l'objet d'une PR dédiée (ou de commits isolés)
pour rester revuable et `git bisect`-friendly.

L'audit s'appuie sur une lecture exhaustive de `backend/poker_tool/` et
`frontend/src/`.

---

## État des lieux (constats factuels)

Le backend est **déjà** bien structuré en Clean/Elegant Objects
(`objects/`, `interfaces/`, `adapters/`, `use_cases/`, `infrastructure/`) —
le plan ne remet pas en cause cette base, il la consolide et supprime les
duplications accumulées.

### Backend — duplications et écarts détectés

1. **`Auth.authenticate()` et `Auth.verify_token()`** sont déclarés dans le
   port (`interfaces/auth.py`) et implémentés dans `adapters/jwt/auth.py` mais
   **jamais appelés** (l'auth réelle se fait dans `LoginUser`).
   `authenticate()` retourne systématiquement `None`. → code mort à
   supprimer ou à réellement câbler.
2. **`init_app` dupliqué à l'identique** dans `SqlUsers`, `SqlRanges`,
   `SqlTrainingSessions` (3× le même bloc `_sqlalchemy_initialized` +
   `db.init_app`). → extraire une responsabilité unique (ex. un `SqlAlchemy`
   partagé initialisé une fois dans la composition root, les ports reçoivent
   juste `db`).
3. **Login exposé deux fois** : `POST /users/login` (UserController) **et**
   `POST /auth/login` (AuthController), avec une logique de mapping d'erreur
   `InvalidCredentials` → `BadRequest`/`NotFound` **dupliquée à l'identique**.
   → unifier sur `/auth/login` et supprimer la route legacy (vérifier d'abord
   les clients : `AuthApi.loginLegacy` côté frontend + les specs E2E).
4. **`SessionNotFound` défini deux fois** (`use_cases/answer_question.py` et
   `use_cases/end_training_session.py`), importé avec alias
   `as AnswerSessionNotFound` / `as EndSessionNotFound`. → une seule exception
   partagée.
5. **`Range.statistics()` dans l'objet métier** calcule des agrégats —
   acceptable, mais `to_dict()`/`from_dict()` mélangent sérialisation et
   domaine. À isoler dans un sérialiseur dédié (responsabilité unique).
6. `User.__eq__`/`__hash__` basés uniquement sur `id` (peut être `None`) —
   fragile pour les objets non persistés. À préciser.

### Frontend — duplications et écarts détectés

7. **Pattern `setLoading(true); setError(null); try {…} finally {
   setLoading(false) }` répété ~32 fois** à travers `useRanges` (12),
   `useStats` (8), `useTraining` (7), `useAuth` (4), `useEquity` (1).
   → extraire un helper `useAsync` (ou `withLoading`) qui factorise l'état
   `loading/error` + le `try/finally`.
8. **Constantes dupliquées entre `types/index.ts` et `utils/constants.ts`** :
   - `RANKS` défini 2× (types:152 + constants:58).
   - `ACTION_COLORS` défini 2× (types + constants) avec une couleur
     `undefined` différente (`#FFFFFF` vs `#607D8B`) — source de bug visuel.
   - `isValidHand` défini 2× (types + helpers) avec des implémentations
     **différentes**.
   - `getActionLabel` / `ACTION_LABELS` redéfinis dans `helpers.ts` en plus
     de `constants.ts`.

   → source unique de vérité : `types/index.ts` pour les *types*,
   `utils/constants.ts` pour les *constantes* ; supprimer les doublons.
9. **`types/index.ts` mélange types + runtime** (constantes `RANKS`, `SUITS`,
   fonctions `generateAllHands`, `handFromString`, `isValidHand`).
   → séparer : `types/` ne contient que des types ; le runtime va dans
   `utils/` (screaming architecture : un package = une responsabilité).
10. **Endpoints API fantômes côté frontend** : `RangesApi` expose `updateHand`,
    `removeHand`, `exportRange`, `importRange`, `defaultRanges` ; `StatsApi`
    expose `byRange`, `history`, `leaderboard`, `rangeProgress`, `export`,
    `backup` ; `AuthApi` expose `loginLegacy`. **Aucun de ces endpoints
    n'existe côté backend.** → soit implémenter côté backend, soit supprimer
    côté frontend (et les hooks associés) pour aligner le contrat API.
11. **`UserStats` déclaré 2×** : dans `types/index.ts` (compliqué, non utilisé
    tel quel) et dans `api/StatsApi.ts` (utilisé réellement). → unifier.
12. `useStats` utilise une `extractErrorMessage` locale ; `useAuth` réécrit le
    même parsing d'erreur `axios.isAxiosError` inline. → factoriser dans
    `utils/`.
13. `RangeEditor.tsx` contient `any[][]` typés en dur et une logique
    d'historique undo/redo qui gagnerait à être un hook dédié `useHistory`.

---

## Plan par phases

Chaque phase est **indépendante**, **testée**, et **réversible** (commit/PR
séparé). L'ordre va du plus sûr (purges sans comportement) au plus
structurant.

### Phase 0 — Préparation & garde-fous
- Mettre en place une baseline verte : `ruff check backend/`,
  `pytest backend/`, `cd frontend && npm run lint && npm test --watchAll=false`,
  `npm run test:e2e`.
- Documenter cette baseline dans le README de la PR de chaque phase pour
  s'assurer qu'aucune phase ne régresse.

### Phase 1 — Purge du code mort backend
- Supprimer `Auth.authenticate()` et `Auth.verify_token()` (port +
  implémentation JwtAuth) après vérification qu'aucun appelant n'existe
  (grep confirmé : seul `current_user` subsiste).
- Supprimer la route `POST /users/login` legacy **après** avoir confirmé
  qu'aucun client ne l'appelle (`AuthApi.loginLegacy` côté frontend, specs
  E2E `login.spec.ts`). Si elle est utilisée, migrer les clients vers
  `/auth/login` d'abord.
- Unifier `SessionNotFound` en une seule exception (supprimer le doublon
  `answer`/`end`).
- **Vérif** : `pytest backend/` vert, E2E `login.spec.ts` verts.

### Phase 2 — Dé-duplication des adaptateurs SQLAlchemy
- Extraire l'initialisation SQLAlchemy (`db.init_app` + garde `create_all`)
  dans une responsabilité unique, initialisée **une fois** dans la composition
  root (`PokerTool.__init__`).
- Les `SqlUsers`/`SqlRanges`/`SqlTrainingSessions` reçoivent uniquement
  l'instance `db` (déjà partagée) et ne portent plus `init_app`.
- **Vérif** : `pytest backend/` vert (notamment `test_app_composition.py`,
  `test_sql_*.py`).

### Phase 3 — Source unique de vérité côté frontend (constantes & helpers)
- Choisir : `types/index.ts` = types uniquement ; `utils/constants.ts` =
  constantes (`RANKS`, `ACTION_COLORS`, `ACTION_LABELS`, `POSITIONS`,
  `THEME_COLORS`…) ; `utils/helpers.ts` = fonctions runtime.
- Supprimer les doublons : `RANKS` (types vs constants), `ACTION_COLORS`
  (types vs constants, harmoniser la couleur `undefined`), `isValidHand`
  (types vs helpers), `getActionLabel`/`ACTION_LABELS` (helpers vs
  constants), `UserStats` (types vs api).
- Mettre à jour tous les imports en conséquence.
- **Vérif** : `npm run lint && npm test` verts ; pas de régression visuelle
  (la couleur `undefined` doit rester cohérente).

### Phase 4 — Factorisation des hooks (suppression des ~32 `try/finally/setLoading`)
- Introduire `hooks/useAsync` (état `{loading, error, data}` + runner) ou
  `utils/withLoading(apiCall, defaultMessage)`.
- Réécrire `useRanges`, `useStats`, `useTraining`, `useAuth`, `useEquity`
  sur cette base.
- Factoriser le parsing d'erreur axios (`extractErrorMessage`) dans
  `utils/errors.ts`, réutilisé par `useStats` et `useAuth`.
- **Vérif** : `npm test` (tests unitaires hooks) verts ; E2E `training-*`,
  `range-*`, `equity.spec` verts.

### Phase 5 — Alignement du contrat API (frontend ↔ backend)
- Décider pour chaque endpoint fantôme : **implémenter** (backend) ou
  **supprimer** (frontend + hook).
  - À supprimer très probablement (non implémentés, jamais appelés en prod) :
    `updateHand`, `removeHand`, `exportRange`, `importRange`,
    `defaultRanges`, `stats.byRange/history/leaderboard/rangeProgress/export/backup`,
    `AuthApi.loginLegacy`.
  - À conserver et implémenter si un besoin existe : à valider au cas par cas
    avec le PO.
- Nettoyer les hooks `useRanges`/`useStats` des méthodes supprimées (lien
  direct avec la Phase 4).
- Mettre à jour le README (section API) pour refléter le contrat réel.
- **Vérif** : `npm run build` (TS strict), backend tests, E2E verts.

### Phase 6 — Scream architecture & responsabilités (refactor léger)
- Extraire la sérialisation domaine ↔ dict du backend dans un package dédié
  (ex. `objects/serialization/` ou serializers par entité) pour que
  `to_dict`/`from_dict` ne vivent plus dans les entités (sérialisation ≠
  domaine).
- Côté frontend : sortir le runtime de `types/index.ts` vers `utils/` (déjà
  commencé Phase 3), et envisager un package `domain/` pour
  `generateAllHands`, `handFromString`… (logique poker pure, réutilisable).
- Extraire l'undo/redo de `RangeEditor.tsx` dans `hooks/useHistory.ts`.
- Corriger `User.__eq__`/`__hash__` (objet sans `id`).
- **Vérif** : full suite (backend + frontend + E2E).

---

## Principes Bugayenko appliqués (rappel pour le review)

- **Pas de `new` dans les objets métier** : les use cases reçoivent leurs
  dépendances ; on veillera à ne pas réintroduire d'instanciation dans les
  entités. *(Exception actuelle : `TreysEvaluator()` instancié dans
  `PokerTool` — acceptable, c'est la composition root.)*
- **Objets immuables** : `Range.with_hand()`/`without_hand()` et
  `TrainingSession.answer()` retournent de nouvelles instances — à préserver.
- **Pas de méthodes statiques** : à surveiller côté frontend
  (`generateAllHands`, etc.) — acceptable si pures et sans état, mais à
  documenter.
- **Nommage métier (screaming architecture)** : les packages décrivent le
  domaine (`objects/training/`, `objects/stats/`, `use_cases/`) — à conserver
  et étendre (ex. sérialisation, runtime poker frontend).
- **Une responsabilité par package/classe** : cible des phases 2, 3, 6.

---

## Verification
- Baseline (avant toute modif) : `ruff check backend/`, `pytest backend/`,
  `cd frontend && npm run lint && npm test --watchAll=false`.
- Chaque phase relancera cette même suite + les E2E impactées.

## Notes
- Aucune modification fonctionnelle dans cette PR : c'est le plan de
  découpage. Les exécutions se feront par phases séparées pour rester
  revuables et `git bisect`-friendly.
- Les endpoints « fantômes » (Phase 5) nécessitent une décision produit : les
  implémenter ou les supprimer. Suppression proposée par défaut (non
  implémentés, non appelés), à valider.
