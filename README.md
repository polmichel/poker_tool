# Poker Tool - Outil de Gestion de Ranges Poker

🎯 **Un outil complet pour créer, visualiser, s'entraîner et gérer vos ranges de poker**

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

# Démarrer le serveur Flask
export FLASK_APP=app.py
flask run --host=0.0.0.0 --port=5000
```

Le backend sera accessible à : **http://localhost:5000/api**

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
├── backend/                  # API Flask (Python)
│   ├── app.py               # Point d'entrée de l'API
│   ├── database.py          # Configuration de la base de données (SQLAlchemy)
│   ├── requirements.txt     # Dépendances Python
│   ├── models/              # Modèles de données
│   │   ├── __init__.py
│   │   ├── hand.py          # Modèle pour les mains de poker
│   │   ├── range.py         # Modèle pour les ranges
│   │   └── scenario.py      # Modèle pour les scénarios
│   └── routes/              # Routes de l'API
│       ├── __init__.py
│       ├── ranges.py        # Routes pour les ranges
│       ├── training.py      # Routes pour l'entraînement
│       └── stats.py         # Routes pour les statistiques
│
├── frontend/                # Application React + TypeScript
│   ├── public/              # Fichiers statiques
│   │   └── index.html
│   ├── src/
│   │   ├── index.tsx        # Point d'entrée de l'application
│   │   ├── App.tsx          # Composant principal
│   │   ├── react-app-env.d.ts
│   │   ├── types/           # Types TypeScript
│   │   │   └── index.ts
│   │   ├── utils/           # Fonctions utilitaires
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   ├── hooks/           # Hooks personnalisés
│   │   │   ├── index.ts
│   │   │   ├── useRanges.ts
│   │   │   ├── useTraining.ts
│   │   │   ├── useStats.ts
│   │   │   └── useAuth.ts
│   │   ├── components/      # Composants React
│   │   │   ├── index.ts
│   │   │   ├── RangeGrid.tsx
│   │   │   ├── RangeForm.tsx
│   │   │   ├── TrainingModeSelector.tsx
│   │   │   ├── TrainingQuestion.tsx
│   │   │   ├── RangeList.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RangeStats.tsx
│   │   │   └── ImportExportDialog.tsx
│   │   └── pages/           # Pages principales
│   │       ├── index.ts
│   │       ├── Home.tsx
│   │       ├── Ranges.tsx
│   │       ├── RangeView.tsx
│   │       ├── RangeEditor.tsx
│   │       ├── Training.tsx
│   │       ├── Stats.tsx
│   │       └── ImportExport.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── README.md                # Documentation
└── .gitignore               # Fichiers à ignorer
```

---

## 🎯 Fonctionnalités

### 📊 Gestion des Ranges
- **Création** : Créez des ranges pour différentes positions et scénarios
- **Modification** : Modifiez vos ranges existantes
- **Visualisation** : Grille 13x13 colorée avec les actions (Open, Call, Raise, All-In, etc.)
- **Statistiques** : Analysez la répartition des mains dans vos ranges

### 🎓 Modes d'Entraînement
1. **Remplir une range** : Complétez une grille vide avec les bonnes actions
2. **Deviner une range** : Déterminez si des mains font partie d'une range donnée
3. **Compléter une range** : Complétez une range partiellement remplie

### 📈 Statistiques et Suivi
- Score moyen par session
- Temps passé par session
- Historique des sessions
- Classement des utilisateurs
- Progression par range

### 🔄 Import/Export
- **Formats supportés** : JSON, CSV, Texte
- **Export** : Téléchargez vos ranges dans différents formats
- **Import** : Importez des ranges depuis des fichiers ou du texte
- **Backup** : Sauvegardez toutes vos données

---

## 🎨 Design

- **Thème sombre** : Inspiré des outils professionnels comme GTO+ Wizard
- **Couleurs des actions** :
  - 🟢 **Vert** : Open
  - 🔵 **Bleu** : Call
  - 🟠 **Orange** : Raise
  - 🔴 **Rouge** : All-In
  - ⚪ **Gris** : Fold
  - 🟡 **Jaune** : Check
  - 🟣 **Violet** : Bet

- **Responsive** : Adapté aux mobiles, tablettes et desktop
- **Interface intuitive** : Navigation simple et efficace

---

## 🔧 Configuration

### Variables d'environnement

#### Backend
Créez un fichier `.env` dans le dossier `backend/` :
```env
SECRET_KEY=votre_cle_secrete_ici
JWT_SECRET_KEY=votre_cle_jwt_secrete_ici
DATABASE_URL=sqlite:///poker_tool.db
```

#### Frontend
Créez un fichier `.env` dans le dossier `frontend/` :
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📡 Endpoints API

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscrire un nouvel utilisateur |
| POST | `/api/auth/login` | Connecter un utilisateur |
| GET | `/api/auth/me` | Récupérer l'utilisateur actuel |

### Ranges
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/ranges/` | Lister toutes les ranges |
| GET | `/api/ranges/:id` | Récupérer une range spécifique |
| POST | `/api/ranges/` | Créer une nouvelle range |
| PUT | `/api/ranges/:id` | Mettre à jour une range |
| DELETE | `/api/ranges/:id` | Supprimer une range |
| GET | `/api/ranges/:id/grid` | Récupérer la grille d'une range |
| GET | `/api/ranges/:id/stats` | Récupérer les statistiques d'une range |
| GET | `/api/ranges/export/:id?format=json\|text\|csv` | Exporter une range |
| POST | `/api/ranges/import` | Importer une range |
| GET | `/api/ranges/default` | Récupérer les ranges par défaut |

### Entraînement
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/training/modes` | Lister les modes d'entraînement |
| GET | `/api/training/sessions` | Lister toutes les sessions |
| POST | `/api/training/sessions` | Créer une nouvelle session |
| POST | `/api/training/sessions/:id/start` | Démarrer une session |
| POST | `/api/training/sessions/:id/next` | Passer à la question suivante |
| POST | `/api/training/sessions/:id/end` | Terminer une session |
| GET | `/api/training/sessions/:id/results` | Récupérer les résultats d'une session |
| POST | `/api/training/quick-start` | Démarrer rapidement une session |

### Statistiques
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats/` | Récupérer les statistiques globales |
| GET | `/api/stats/user/:id` | Récupérer les statistiques d'un utilisateur |
| GET | `/api/stats/range/:id` | Récupérer les statistiques d'une range |
| GET | `/api/stats/history` | Récupérer l'historique des sessions |
| GET | `/api/stats/leaderboard` | Récupérer le classement |
| GET | `/api/stats/export?format=json\|csv` | Exporter les statistiques |
| GET | `/api/stats/backup` | Sauvegarder toutes les données |

---

## 🛠️ Technologies Utilisées

### Backend
- **Python 3.8+**
- **Flask** : Framework web léger
- **Flask-SQLAlchemy** : ORM pour SQLite
- **Flask-JWT-Extended** : Gestion des tokens JWT
- **Flask-CORS** : Gestion des CORS

### Frontend
- **React 18** : Bibliothèque JavaScript pour les interfaces utilisateur
- **TypeScript** : Typage statique pour JavaScript
- **Material-UI (MUI)** : Composants UI modernes
- **Recharts** : Bibliothèque de graphiques
- **React Router** : Gestion de la navigation
- **Axios** : Client HTTP pour les requêtes API

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

## 🙏 Remerciements

- Inspiré par **GTO+ Wizard** pour le design et les fonctionnalités
- **PokerStrategy.com** pour les concepts de ranges
- **Equilab** et **PokerStove** pour l'inspiration des formats d'import/export

---

## 📞 Support

Pour toute question ou problème, n'hésitez pas à ouvrir une **Issue** sur GitHub ou à me contacter directement.

**Bon entraînement et bonne chance aux tables ! 🃏**
