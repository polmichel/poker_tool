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
- **Backend** : Python 3.10+ 
- **Frontend** : Node.js 16+ avec npm
- **Base de données** : SQLite (inclus avec Python)

---

### Installation

#### 1🔢 Cloner le dépôt
```bash
git clone https://github.com/polmichel/poker_tool.git
cd poker_tool
```

#### 2🔢 Configurer le Backend (Flask) - **Avec uv (recommandé)**
```bash
cd backend

# Installer les dépendances avec uv (plus rapide que pip)
uv pip install -r requirements.txt

# Démarrer le serveur Flask
uv run python -m poker_tool.app
```

**OU avec pip traditionnel :**
```bash
cd backend

# Créer un environnement virtuel (optionnel)
python -m venv venv
source venv/bin/activate  # Sur Linux/Mac
# ou
venv\Scripts\activate     # Sur Windows

# Installer les dépendances
pip install -r requirements.txt

# Démarrer le serveur Flask
export FLASK_APP=poker_tool.app
flask run --host=0.0.0.0 --port=5000
```

Le backend sera accessible à : **http://localhost:5000/api**

#### 3🔢 Configurer le Frontend (React)
```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer l'application React
npm start
```

Le frontend sera accessible à : **http://localhost:3000**

---

## 📁 Architecture du Projet (Nouvelle Architecture Elegant Objects)

```
poker_tool/
├── backend/                          # API Flask (Python)
│   └── poker_tool/
│       ├── objects/                 # 🎯 DOMAINE (Objets EO immuables)
│       │   ├── hand.py              # Main de poker (valeur)
│       │   ├── action.py            # Action + ActionType (valeur)
│       │   ├── position.py          # Position (valeur)
│       │   ├── range_type.py        # RangeType (valeur)
│       │   ├── range.py             # Range (entité)
│       │   ├── user.py              # User (entité)
│       │   ├── training/
│       │   │   ├── question.py      # TrainingQuestion (valeur)
│       │   │   └── session.py       # TrainingSession (entité)
│       │   └── stats/
│       │       ├── global_stats.py  # GlobalStats (valeur)
│       │       └── user_stats.py    # UserStats (valeur)
│       │
│       ├── interfaces/              # 🎯 PORTS (Contrats abstraits)
│       │   ├── storage.py           # Storage (interface)
│       │   └── auth.py              # Auth (interface)
│       │
│       ├── adapters/                # 🎯 ADAPTATEURS (Implémentations)
│       │   ├── sqlalchemy/
│       │   │   ├── __init__.py
│       │   │   ├── storage.py       # Implémente Storage
│       │   │   └── models.py        # Modèles SQLAlchemy
│       │   └── jwt/
│       │       ├── __init__.py
│       │       └── auth.py          # Implémente Auth
│       │
│       ├── infrastructure/          # 🎯 INFRASTRUCTURE
│       │   └── web/
│       │       └── flask_app.py     # Toutes les routes Flask
│       │
│       ├── app.py                   # 🎯 POINT D'ENTRÉE (compose tout)
│       ├── main.py
│       └── __init__.py
│
├── frontend/                        # Application React + TypeScript
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── types/
│   │   ├── utils/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── tsconfig.json
│
├── pyproject.toml                  # 📦 Configuration pour uv/pip
├── requirements.txt                 # 📦 Dépendances Python
├── .python-version                 # Version de Python
└── README.md
```

---

## 🎯 Architecture Elegant Objects

Ce projet suit les principes **Elegant Objects** de Yegor Bugayenko :

- ✅ **Objets immuables** : Tous les objets du domaine sont immuables
- ✅ **Pas de NULL** : Utilisation de valeurs par défaut et Optionals
- ✅ **Pas de getters/setters** : Utilisation de propriétés
- ✅ **Pas de new dans les objets** : Factory methods (`from_dict`, `from_string`)
- ✅ **Séparation claire** : Domain/Interfaces/Adapters/Infrastructure

### Couches Architecturales

1. **🎯 objects/** - Domaine pur (Elegant Objects)
   - Contient toutes les entités et valeurs immuables
   - Aucune dépendance externe
   - Logique métier pure

2. **🎯 interfaces/** - Ports/Contrats (Abstract Base Classes)
   - Définissent les interfaces que les adaptateurs doivent implémenter
   - `Storage` : Pour la persistance des données
   - `Auth` : Pour l'authentification

3. **🎯 adapters/** - Implémentations concrètes
   - `SqlAlchemyStorage` : Implémente `Storage` avec SQLAlchemy
   - `JwtAuth` : Implémente `Auth` avec JWT

4. **🎯 infrastructure/** - Couche technique
   - `flask_app.py` : Toutes les routes Flask
   - Compose les objets et délègue aux adaptateurs

5. **🎯 app.py** - Point d'entrée
   - Compose l'application complète
   - Initialise Flask, Storage, Auth, et FlaskApp

---

## 🧪 Tests

### Exécuter les tests unitaires
```bash
cd backend
python -m unittest discover -s poker_tool/tests/unit -v
```

### Exécuter les tests d'intégration
```bash
cd backend
python -m unittest discover -s poker_tool/tests/integration -v
```

### Exécuter tous les tests
```bash
cd backend
python -m unittest discover -s poker_tool/tests -v
```

---

## 📊 Fonctionnalités

### 🃏 Gestion des Ranges
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

---

## 📚 Documentation API

### Endpoints Principaux

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur actuel

#### Ranges
- `GET /api/ranges` - Liste de toutes les ranges
- `POST /api/ranges` - Créer une nouvelle range
- `GET /api/ranges/<id>` - Détails d'une range
- `PUT /api/ranges/<id>` - Mettre à jour une range
- `DELETE /api/ranges/<id>` - Supprimer une range
- `GET /api/ranges/<id>/grid` - Grille 13x13 d'une range
- `GET /api/ranges/<id>/stats` - Statistiques d'une range

#### Entraînement
- `GET /api/training/modes` - Liste des modes d'entraînement
- `GET /api/training/sessions` - Liste des sessions
- `POST /api/training/sessions` - Créer une nouvelle session
- `GET /api/training/sessions/<id>` - Détails d'une session
- `POST /api/training/sessions/<id>/next` - Question suivante
- `POST /api/training/sessions/<id>/end` - Terminer une session

#### Statistiques
- `GET /api/stats/` - Statistiques globales
- `GET /api/stats/user/<user_id>` - Statistiques utilisateur
- `GET /api/stats/range/<range_id>` - Statistiques d'une range
- `GET /api/stats/leaderboard` - Classement
- `GET /api/stats/history` - Historique
- `GET /api/stats/export` - Exporter les stats

---

## 🛠️ Configuration

### Variables d'Environnement

Créez un fichier `.env` dans `backend/` :
```env
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=votre_cle_secrete
SQLALCHEMY_DATABASE_URI=sqlite:///poker_tool.db
JWT_SECRET_KEY=votre_jwt_secret
JWT_ACCESS_TOKEN_EXPIRES=3600
```

### Base de Données
Par défaut, SQLite est utilisé. Pour utiliser PostgreSQL ou MySQL, modifiez `SQLALCHEMY_DATABASE_URI` :
```env
# PostgreSQL
SQLALCHEMY_DATABASE_URI=postgresql://user:password@localhost/poker_tool

# MySQL
SQLALCHEMY_DATABASE_URI=mysql://user:password@localhost/poker_tool
```

---

## 🤝 Contribution

1. Forker le dépôt
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commiter vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Pousser vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 📜 Licence

MIT © polmichel
