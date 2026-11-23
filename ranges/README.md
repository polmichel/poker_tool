# Ranges prêtes à l'emploi

Ranges preflop 6-max (RFI ~2.5bb, 100bb) générées par
`backend/poker_tool/scripts/generate_default_ranges.py`.

## Import dans l'application

Page **Importer/Exporter** de l'application :

- onglet **JSON** : copier le contenu d'un fichier `preflop/<nom>.json`
- onglet **Texte** : copier le contenu d'un fichier `preflop/<nom>.txt`
  (les lignes `# ...` sont des commentaires ; la notation de range
  `66+`, `A8s+`, `KTs-JTs` est acceptée, ex. `66+, A8s+: open`)

Ou en API : `POST /api/ranges/import` avec `{"content": "...", "format": "json|text|csv"}`.

## Export

`GET /api/ranges/export/<id>?format=json|text|csv` renvoie la range dans le
format demandé (`{"text": ...}` / `{"csv": ...}`, ou l'objet JSON directement).

## Contenu

| Fichier | Range | Mains |
|---------|-------|-------|
| `preflop/utg-open` | Ouverture UTG | 31 |
| `preflop/utg1-open` | Ouverture UTG+1 | 38 |
| `preflop/lj-open` | Ouverture LJ | 46 |
| `preflop/hj-open` | Ouverture HJ | 54 |
| `preflop/co-open` | Ouverture CO | 65 |
| `preflop/btn-open` | Ouverture BTN | 73 |
| `preflop/sb-open` | Ouverture SB | 113 |
| `preflop/bb-vs-btn-3bet` | 3-bet BB vs BTN (`raise`) | 34 |
| `preflop/bb-vs-btn-call` | Call BB vs BTN (`call`) | 61 |
