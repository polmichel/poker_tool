# Poker Tool - Outil de Gestion de Ranges Poker

🃏 **Un outil complet pour créer, visualiser, s'entraîner et gérer vos ranges de poker**

Inspiré de **GTO+ Wizard**, ce projet offre une interface moderne et intuitive pour :
- ✅ **Créer et sauvegarder** des ranges pour différentes positions (UTG, MP, CO, BTN, SB, BB)
- ✅ **Visualiser** vos ranges sous forme de grille 13x13 colorée
- ✅ **Vous entraîner** avec différents modes (remplir, deviner, compléter)
- ✅ **Importer/Exporter** vos ranges dans différents formats (JSON, CSV, Texte)
- ✅ **Suivre vos statistiques** et votre progression

---

## 🚀 Démarrage Rapide

### Prérequis
- **Backend** : Python 3.8+ avec pip
- **Frontend** : Node.js 16+ avec npm
- **Base de données** : SQLite (inclus avec Python)

---

### Installation

#### 1️⃣ Cloner le dépôt
```bash
git clone https://github.com/polmichel/poker_tool.git
cd poker_tool
```

#### 2️⃣ Configurer le Backend (Flask)
```bash
cd backend

# Créer un environnement virtuel (recommandé)
python -m venv venv
source venv/bin/activate  # Sur Linux/Mac
# ou
venv\Scripts\activate     # Sur Windows

# Installer les dépendances
pip install -r requirements.txt

# Démarrer le serveur
python main.py
```

Le backend sera accessible à : **http://localhost:5000**

La configuration (clés secrètes, base de données, CORS) est lue depuis l'environnement via `poker_tool.config.Config` ; voir `backend/.env.example`.

#### 3️⃣ Configurer le Frontend (React)
```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer l'application React
npm start
```

Le frontend sera accessible à : **http://localhost:3000**

---

## 🏗️ Architecture du Projet

```
poker_tool/
├── backend/                          # API Flask (Python, architecture Elegant Objects)
│   ├── main.py                       # Point d'entrée (python main.py)
│   ├── requirements.txt              # Dépendances Python
│   ├── .env.example                  # Configuration par variable d'environnement
│   ├── pyproject.toml                # Configuration du projet Python
│   ├── data/                         # Données (table d'équité pré-calculée)
│   └── poker_tool/                   # Package principal
│       ├── __init__.py
│       ├── main.py                   # Point d'entrée alternatif (python -m poker_tool.main)
│       ├── config.py                 # Configuration lue depuis l'environnement
│       ├── app.py                    # Racine de composition (DI)
│       ├── objects/                  # Objets domaine purs
│       │   ├── __init__.py
│       │   ├── action.py              # Actions de poker (Fold, Call, Raise, etc.)
│       │   ├── deck.py                # Jeu de cartes
│       │   ├── equity.py              # Résultat d'équité
│       │   ├── equity_table.py        # Table d'équité pré-calculée
│       │   ├── hand.py                # Représentation d'une main
│       │   ├── position.py            # Positions (UTG, MP, CO, BTN, SB, BB)
│       │   ├── range.py               # Range de poker
│       │   ├── range_parser.py         # Parseur de ranges
│       │   ├── range_type.py          # Types de ranges
│       │   ├── user.py                # Utilisateur
│       │   └── training/              # Entraînement
│       │       ├── __init__.py
│       │       ├── question.py        # Question d'entraînement
│       │       └── session.py         # Session d'entraînement
│       ├── interfaces/               # Ports abstraits
│       │   ├── __init__.py
│       │   ├── auth.py                # Authentification
│       │   ├── equity_calculator.py   # Calculateur d'équité
│       │   ├── hand_evaluator.py      # Évaluateur de mains
│       │   ├── ranges.py              # Gestion des ranges
│       │   ├── training_sessions.py   # Gestion des sessions d'entraînement
│       │   └── users.py               # Gestion des utilisateurs
│       ├── adapters/                 # Implémentations concrètes
│       │   ├── __init__.py
│       │   ├── equity/                # Calculateurs d'équité
│       │   │   ├── __init__.py
│       │   │   ├── fallback.py         # Fallback pour équité
│       │   │   ├── monte_carlo.py     # Monte-Carlo
│       │   │   ├── no_table.py        # Sans table pré-calculée
│       │   │   └── table.py           # Avec table pré-calculée
│       │   ├── jwtd/                  # Authentification JWT
│       │   │   ├── __init__.py
│       │   │   └── auth.py
│       │   ├── phevaluator/           # Adaptateur phevaluator
│       │   │   ├── __init__.py
│       │   │   └── evaluator.py
│       │   ├── sqlalchemy/            # Adaptateurs SQLAlchemy
│       │   │   ├── __init__.py
│       │   │   ├── models.py           # Modèles de base de données
│       │   │   ├── ranges.py           # Implémentation ranges
│       │   │   ├── training_sessions.py
│       │   │   └── users.py
│       │   └── treys/                 # Adaptateur treys
│       │       ├── __init__.py
│       │       └── evaluator.py
│       ├── use_cases/                # Cas d'utilisation
│       │   ├── __init__.py
│       │   ├── aggregate_equity.py    # Agrégation d'équité
│       │   ├── answer_question.py     # Répondre à une question
│       │   ├── create_range.py        # Créer une range
│       │   ├── current_user.py        # Utilisateur actuel
│       │   ├── end_training_session.py
│       │   ├── enumerate_equity.py     # Énumération d'équité
│       │   ├── global_stats.py        # Statistiques globales
│       │   ├── login_user.py          # Connexion utilisateur
│       │   ├── register_user.py       # Inscription utilisateur
│       │   ├── simulate_equity.py     # Simulation d'équité
│       │   ├── start_training_session.py
│       │   ├── training_errors.py     # Gestion des erreurs d'entraînement
│       │   ├── update_range.py        # Mise à jour d'une range
│       │   └── user_stats.py          # Statistiques utilisateur
│       ├── infrastructure/           # Couche technique
│       │   ├── __init__.py
│       │   └── web/                   # Web (Flask)
│       │       ├── __init__.py
│       │       ├── flask_app.py       # Application Flask
│       │       └── controllers/       # Contrôleurs
│       │           ├── __init__.py
│       │           ├── auth.py        # Authentification
│       │           ├── equity.py      # Équité
│       │           ├── ranges.py      # Ranges
│       │           ├── stats.py       # Statistiques
│       │           └── training.py     # Entraînement
│       └── scripts/                   # Scripts utilitaires
│           ├── __init__.py
│           └── generate_equity_table.py
│       └── tests/                     # Tests
│           ├── __init__.py
│           ├── conftest.py
│           ├── integration/           # Tests d'intégration
│           │   ├── __init__.py
│           │   └── test_app_composition.py
│           └── unit/                   # Tests unitaires
│               ├── __init__.py
│               ├── adapters/          # Tests des adaptateurs
│               │   ├── __init__.py
│               │   ├── test_jwt_auth.py
│               │   ├── test_phevaluator.py
│               │   ├── test_sql_ranges.py
│               │   ├── test_sql_training_sessions.py
│               │   ├── test_sql_users.py
│               │   └── test_treys_evaluator.py
│               ├── infrastructure/    # Tests de l'infrastructure
│               │   ├── __init__.py
│               │   ├── test_flask_app.py
│               │   └── test_json_errors.py
│               ├── interfaces/         # Tests des interfaces
│               │   ├── __init__.py
│               │   ├── test_auth.py
│               │   ├── test_ranges.py
│               │   ├── test_training_sessions.py
│               │   └── test_users.py
│               ├── objects/            # Tests des objets
│               │   ├── __init__.py
│               │   ├── stats/          # Tests des statistiques
│               │   │   ├── __init__.py
│               │   │   ├── test_global_stats.py
│               │   │   └── test_user_stats.py
│               │   ├── test_action.py
│               │   ├── test_deck.py
│               │   ├── test_equity.py
│               │   ├── test_equity_combos.py
│               │   ├── test_equity_table.py
│               │   ├── test_hand.py
│               │   ├── test_position.py
│               │   ├── test_range.py
│               │   ├── test_range_parser.py
│               │   ├── test_range_type.py
│               │   ├── test_user.py
│               │   └── training/       # Tests de l'entraînement
│               │       ├── __init__.py
│               │       ├── test_guess_mode.py
│               │       ├── test_question.py
│               │       └── test_session.py
│               └── use_cases/          # Tests des cas d'utilisation
│                   ├── __init__.py
│                   ├── fakes.py
│                   ├── test_current_user.py
│                   ├── test_enumerate_equity.py
│                   ├── test_login_user.py
│                   ├── test_range_use_cases.py
│                   ├── test_register_user.py
│                   ├── test_simulate_equity.py
│                   ├── test_stats.py
│                   └── test_training_use_cases.py
│
└── frontend/                        # Application React + TypeScript
    ├── public/                      # Fichiers statiques
    │   └── index.html
    ├── src/
    │   ├── index.tsx                # Point d'entrée de l'application
    │   ├── react-app-env.d.ts
    │   ├── reportWebVitals.ts
    │   ├── setupTests.ts
    │   ├── App.tsx                  # Composant principal
    │   ├── app/                     # Configuration de l'application
    │   │   ├── AppShell.tsx         # Coque de l'application
    │   │   ├── icons.tsx            # Icônes
    │   │   ├── ProtectedRoute.tsx   # Route protégée
    │   │   └── theme.ts             # Thème
    │   ├── auth/                    # Authentification
    │   │   └── AuthContext.tsx       # Contexte d'authentification
    │   ├── api/                     # API
    │   │   ├── index.ts
    │   │   ├── client.ts            # Client HTTP
    │   │   ├── AuthApi.ts           # API d'authentification
    │   │   ├── EquityApi.ts          # API d'équité
    │   │   ├── RangesApi.ts          # API des ranges
    │   │   ├── StatsApi.ts           # API des statistiques
    │   │   └── TrainingApi.ts        # API d'entraînement
    │   ├── components/              # Composants React
    │   │   ├── index.ts
    │   │   ├── AppCard.tsx
    │   │   ├── EquityHeatmapGrid.tsx # Grille d'équité
    │   │   ├── ImportExportDialog.tsx
    │   │   ├── RangeForm.tsx
    │   │   ├── RangeGrid.tsx
    │   │   ├── RangeList.tsx
    │   │   ├── RangeStats.tsx
    │   │   ├── StatsCard.tsx
    │   │   ├── TrainingGridQuestion.tsx
    │   │   ├── TrainingGuessRangeQuestion.tsx
    │   │   ├── TrainingModeSelector.tsx
    │   │   └── TrainingQuestion.tsx
    │   ├── hooks/                    # Hooks personnalisés
    │   │   ├── index.ts
    │   │   ├── useAsyncState.ts
    │   │   ├── useAuth.ts
    │   │   ├── useEquity.ts
    │   │   ├── useHistory.ts
    │   │   ├── useRanges.ts
    │   │   ├── useStats.ts
    │   │   └── useTraining.ts
    │   ├── pages/                    # Pages principales
    │   │   ├── index.ts
    │   │   ├── Equity.tsx
    │   │   ├── Home.tsx
    │   │   ├── ImportExport.tsx
    │   │   ├── Login.tsx
    │   │   ├── RangeEditor.tsx
    │   │   ├── Ranges.tsx
    │   │   ├── RangeView.tsx
    │   │   ├── Register.tsx
    │   │   ├── Stats.tsx
    │   │   └── Training.tsx
    │   ├── types/                    # Types TypeScript
    │   │   └── index.ts
    │   └── utils/                    # Fonctions utilitaires
    │       ├── constants.ts
    │       ├── errors.ts
    │       └── helpers.ts
    ├── package.json
    ├── tsconfig.json
    ├── .eslintrc.json
    └── tests/                       # Tests E2E
        └── e2e/
            ├── playwright.config.ts
            ├── global-setup.ts
            ├── fixtures/
            │   ├── index.ts
            │   └── ranges.ts
            ├── specs/
            │   ├── index.ts
            │   ├── ci-basic.spec.ts
            │   ├── create-range.spec.ts
            │   ├── equity.spec.ts
            │   ├── login.spec.ts
            │   ├── questionnaire.spec.ts
            │   ├── range-create-edit.spec.ts
            │   ├── range-paint-legend.spec.ts
            │   ├── register.spec.ts
            │   ├── smoke.spec.ts
            │   ├── training-feedback.spec.ts
            │   └── training-fill-grid.spec.ts
            ├── types/
            │   └── index.d.ts
            └── utils/
                ├── index.ts
                └── test-utils.ts
```

---

## 🎯 Fonctionnalités

### 📊 Gestion des Ranges
- **Création** : Créez des ranges pour différentes positions et scénarios
- **Modification** : Modifiez vos ranges existantes
- **Visualisation** : Grille 13x13 colorée avec les actions (Open, Call, Raise, All-In, etc.)
- **Statistiques** : Analysez la répartition des mains dans vos ranges

### 🎮 Modes d'Entraînement
1. **Remplir une range** : Complétez une grille vide avec les bonnes actions
2. **Deviner une range** : Déterminez si des mains font partie d'une range donnée
3. **Compléter une range** : Complétez une range partiellement remplie

### 📈 Statistiques et Suivi
- Score moyen par session
- Temps passé par session
- Historique des sessions
- Classement des utilisateurs
- Progression par range

### 🔢 Calculateur d'Équité
- **Équité exacte** : énumération exhaustive de tous les runouts (C(48,5) boards) via l'adaptateur `phevaluator` — résultats précis et **reproductibles au bit près** (aucune variance, recalcul identique).
- **Table pré-calculée** : les 169×169 équités preflop sont générées une fois (`backend/poker_tool/scripts/generate_equity_table.py`) et stockées dans `backend/data/equity_table.json`, lues en O(1) à l'exécution.
- **Monte-Carlo conservé** : `SimulateEquity` reste disponible pour les cas futurs (postflop, range vs range) non couverts par l'énumération preflop.

### 📥 Import/Export
- **Formats supportés** : JSON, CSV, Texte
- **Export** : Téléchargez vos ranges dans différents formats
- **Import** : Importez des ranges depuis des fichiers ou du texte
- **Backup** : Sauvegardez toutes vos données

---

## 🎨 Design

- **Thème sombre** : Inspiré des outils professionnels comme GTO+ Wizard
- **Couleurs des actions** :
  - 🟢 **Vert** : Open
  - 🟣 **Bleu** : Call
  - 🟠 **Orange** : Raise
  - 🔴 **Rouge** : All-In
  - ⚪ **Gris** : Fold
  - 🟡 **Jaune** : Check
  - 🟣 **Violet** : Bet

- **Responsive** : Adapté aux mobiles, tablettes et desktop
- **Interface intuitive** : Navigation simple et efficace

---

## ⚙️ Configuration

### Variables d'environnement

#### Backend
Créez un fichier `.env` dans le dossier `backend/` :
```env
SECRET_KEY=votre_cle_secrete_ici
JWT_SECRET_KEY=votre_cle_jwt_secrete_ici
DATABASE_URL=sqlite:///poker_tool.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JWT_ACCESS_TOKEN_EXPIRES=3600
```

#### Frontend
Créez un fichier `.env` dans le dossier `frontend/` :
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 📡 Endpoints API

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/register` | Inscrire un nouvel utilisateur |
| POST | `/auth/login` | Connecter un utilisateur |
| GET | `/auth/me` | Récupérer l'utilisateur actuel |

### Ranges
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/ranges/` | Lister toutes les ranges |
| GET | `/ranges/:id` | Récupérer une range spécifique |
| POST | `/ranges/` | Créer une nouvelle range |
| PUT | `/ranges/:id` | Mettre à jour une range |
| DELETE | `/ranges/:id` | Supprimer une range |
| GET | `/ranges/:id/grid` | Récupérer la grille d'une range |
| GET | `/ranges/:id/stats` | Récupérer les statistiques d'une range |
| GET | `/ranges/export/:id?format=json\|text\|csv` | Exporter une range |
| POST | `/ranges/import` | Importer une range |
| GET | `/ranges/default` | Récupérer les ranges par défaut |

### Entraînement
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/training/modes` | Lister les modes d'entraînement |
| GET | `/training/sessions` | Lister toutes les sessions |
| POST | `/training/sessions` | Créer une nouvelle session |
| POST | `/training/sessions/:id/start` | Démarrer une session |
| POST | `/training/sessions/:id/next` | Passer à la question suivante |
| POST | `/training/sessions/:id/end` | Terminer une session |
| GET | `/training/sessions/:id/results` | Récupérer les résultats d'une session |
| POST | `/training/quick-start` | Démarrer rapidement une session |

### Statistiques
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/stats/` | Récupérer les statistiques globales |
| GET | `/stats/user/:id` | Récupérer les statistiques d'un utilisateur |
| GET | `/stats/range/:id` | Récupérer les statistiques d'une range |
| GET | `/stats/history` | Récupérer l'historique des sessions |
| GET | `/stats/leaderboard` | Récupérer le classement |
| GET | `/stats/export?format=json\|csv` | Exporter les statistiques |
| GET | `/stats/backup` | Sauvegarder toutes les données |

### Équité
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/equity/preflop?hand1=XX&hand2=XX` | Calculer l'équité préflop entre deux mains |
| GET | `/equity/preflop/range?range1=...&range2=...` | Calculer l'équité entre deux ranges |

---

## 🛠️ Technologies Utilisées

### Backend
- **Python 3.8+**
- **Flask** : Framework web léger
- **Flask-SQLAlchemy** : ORM pour SQLite
- **Flask-JWT-Extended** : Gestion des tokens JWT
- **Flask-CORS** : Gestion des CORS
- **treys** : Évaluateur de mains de poker
- **phevaluator** : Évaluateur de mains de poker (alternatif)

### Frontend
- **React 18** : Bibliothèque JavaScript pour les interfaces utilisateur
- **TypeScript** : Typage statique pour JavaScript
- **Material-UI (MUI)** : Composants UI modernes
- **Recharts** : Bibliothèque de graphiques
- **React Router** : Gestion de la navigation
- **Axios** : Client HTTP pour les requêtes API
- **Playwright** : Tests E2E

### Base de données
- **SQLite** : Base de données légère et intégrée

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Forker** le dépôt
2. **Créer** une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalité`)
3. **Commiter** vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. **Pousser** vers la branche (`git push origin feature/ma-fonctionnalité`)
5. **Ouvrir** une Pull Request

---

## 📜 Licence

Ce projet est sous licence **MIT**. Vous êtes libre de l'utiliser, le modifier et le distribuer.

---

## 💬 Support

Pour toute question ou problème, n'hésitez pas à ouvrir une **Issue** sur GitHub ou à me contacter directement.

**Bon entraînement et bonne chance aux tables ! 🎲**
