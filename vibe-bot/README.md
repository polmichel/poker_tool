# Vibe Bot - GitHub Bot powered by Mistral AI

🤖 **Un bot GitHub intelligent qui répond à tes demandes en utilisant l'API Mistral AI**

Ce bot écoute les événements de ton dépôt GitHub (commentaires sur les issues/PRs) et répond aux commandes avec des réponses générées par Mistral AI.

---

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 18+ 
- **npm** ou **yarn**
- **Une GitHub App** configurée (voir [Configuration GitHub](#github-app-configuration))
- **Une clé API Mistral** (à récupérer sur [Mistral Console](https://console.mistral.ai/))

---

### Installation

#### 1️⃣ Cloner le dépôt (si ce n'est pas déjà fait)
```bash
git clone https://github.com/polmichel/poker_tool.git
cd poker_tool/vibe-bot
```

#### 2️⃣ Installer les dépendances
```bash
npm install
```

#### 3️⃣ Configurer les variables d'environnement
Copie le fichier `.env.example` en `.env` et complète-le avec tes valeurs :
```bash
cp .env.example .env
```

Édite le fichier `.env` avec tes identifiants (voir [Configuration](#configuration)).

#### 4️⃣ Démarrer le bot en développement
```bash
npm run dev
```

Le bot sera accessible à : **http://localhost:3000**

---

## 📝 Configuration

### GitHub App Configuration

1. **Créer une GitHub App** :
   - Va sur [GitHub Developer Settings](https://github.com/settings/apps)
   - Clique sur **"New GitHub App"**
   - **Nom** : `Vibe Bot for Poker Tool`
   - **Homepage URL** : `https://github.com/polmichel/poker_tool`
   - **Callback URL** : Laisse vide

2. **Permissions** :
   - ✅ **Repository** : `Read & Write`
   - ✅ **Issues** : `Read & Write`
   - ✅ **Pull Requests** : `Read & Write`
   - ✅ **Comments** : `Read & Write`

3. **Subscribe to events** :
   - ✅ `Issue comment`
   - ✅ `Pull request review comment`
   - ✅ `Pull request`
   - ✅ `Issues`

4. **Webhook** :
   - **Webhook URL** : `https://ton-serveur.com/webhook` (à configurer après le déploiement)
   - **Webhook Secret** : Génère une clé secrète (à copier dans `.env`)

5. **Private Key** :
   - Télécharge la clé privée (format `.pem`) depuis la page de l'app
   - Copie son contenu dans `GITHUB_PRIVATE_KEY` dans `.env`

6. **Installer l'app** sur ton dépôt `poker_tool`

---

### Mistral AI Configuration

1. **Obtenir une clé API** :
   - Va sur [Mistral Console](https://console.mistral.ai/)
   - Crée un compte si ce n'est pas déjà fait
   - Récupère ta clé API dans **Settings → API Keys**

2. **Configurer dans `.env`** :
   ```env
   MISTRAL_API_KEY=ta_clé_api_mistral
   MISTRAL_MODEL=mistral-tiny  # ou mistral-small, mistral-medium, etc.
   ```

---

### Variables d'Environnement

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `GITHUB_APP_ID` | ID de l'application GitHub | `123456` | ✅ |
| `GITHUB_PRIVATE_KEY` | Clé privée de l'application (format PEM) | `-----BEGIN RSA PRIVATE KEY-----...` | ✅ |
| `GITHUB_WEBHOOK_SECRET` | Secret du webhook GitHub | `webhook_secret_123` | ✅ |
| `MISTRAL_API_KEY` | Clé API Mistral | `mistral_api_key_123` | ✅ |
| `MISTRAL_MODEL` | Modèle Mistral à utiliser | `mistral-tiny` | ❌ |
| `PORT` | Port du serveur | `3000` | ❌ |
| `BASE_URL` | URL de base du serveur | `http://localhost:3000` | ❌ |
| `BOT_NAME` | Nom du bot | `Vibe Bot` | ❌ |
| `BOT_PREFIX` | Préfixe pour les commandes | `@vibe` | ❌ |
| `ALLOWED_REPOS` | Dépôts autorisés (séparés par des virgules) | `polmichel/poker_tool` | ❌ |
| `ALLOWED_USERS` | Utilisateurs autorisés (séparés par des virgules) | `polmichel` | ❌ |
| `LOG_LEVEL` | Niveau de log (debug, info, warn, error) | `info` | ❌ |

---

## 🤖 Commandes Disponibles

| Commande | Description | Exemple |
|----------|-------------|---------|
| `@vibe fix this` | Analyse le code/problème et propose une correction | `@vibe fix this` |
| `@vibe explain` | Explique un concept ou un code | `@vibe explain this function` |
| `@vibe review` | Fait une revue de code complète | `@vibe review this PR` |
| `@vibe suggest` | Propose des améliorations | `@vibe suggest optimizations` |
| `@vibe docs` | Génère de la documentation | `@vibe docs for this class` |
| `@vibe help` | Affiche l'aide | `@vibe help` |

---

## 📡 Événements GitHub Traités

Le bot réagit aux événements suivants :

1. **Commentaires sur les issues** (`issues.comment`)
   - Détecte les commandes dans les commentaires
   - Répond avec une analyse/génération

2. **Commentaires de revue sur les PRs** (`pull_request_review_comment`)
   - Détecte les commandes dans les commentaires de revue
   - Répond avec une analyse du code

3. **Ouverture/Mise à jour de PRs** (`pull_request`)
   - Détecte les commandes dans la description de la PR
   - Répond avec une revue automatique

4. **Ouverture/Mise à jour d'issues** (`issues`)
   - Détecte les commandes dans la description de l'issue
   - Répond avec une analyse

---

## 🚀 Déploiement

### Option 1 : Railway (Recommandé)

1. **Créer un compte** sur [Railway](https://railway.app/)
2. **Nouveau projet** → **Deploy from GitHub repo**
3. **Sélectionner** `poker_tool/vibe-bot`
4. **Configurer les variables d'environnement** dans Railway
5. **Déployer**

6. **Configurer le webhook GitHub** :
   - Va dans ta GitHub App
   - Mets à jour **Webhook URL** avec l'URL Railway (ex: `https://vibe-bot-production.up.railway.app/webhook`)

---

### Option 2 : Render

1. **Créer un compte** sur [Render](https://render.com/)
2. **Nouveau Web Service**
3. **Connecter** ton dépôt GitHub
4. **Configurer** :
   - **Name** : `vibe-bot`
   - **Region** : La plus proche de toi
   - **Branch** : `main`
   - **Root Directory** : `vibe-bot`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
5. **Ajouter les variables d'environnement**
6. **Déployer**

7. **Configurer le webhook GitHub** avec l'URL Render

---

### Option 3 : VPS avec ngrok (pour les tests)

1. **Installer ngrok** :
   ```bash
   npm install -g ngrok
   ```

2. **Démarrer le bot** :
   ```bash
   npm run dev
   ```

3. **Exposer le port 3000** :
   ```bash
   ngrok http 3000
   ```

4. **Configurer le webhook GitHub** avec l'URL ngrok (ex: `https://abc123.ngrok.io/webhook`)

⚠️ **Attention** : ngrok donne une URL temporaire. Pour les tests locaux uniquement.

---

## 📊 Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Informations sur le bot |
| GET | `/health` | Vérification de la santé des services |
| POST | `/webhook` | Webhook GitHub (interne) |

---

## 🔍 Exemples d'Utilisation

### Exemple 1 : Correction de code
**Commentaire sur une PR :**
```
@vibe fix this

```python
def calculate_hand_strength(hand):
    # Code avec une erreur
    return hand.strength * 2  # Oubli de vérifier si hand.strength existe
```

**Réponse du bot :**
```
🔧 **Correction proposée :**

Le code actuel ne vérifie pas si `hand.strength` existe avant de l'utiliser, ce qui pourrait causer une erreur si l'attribut est manquant.

Correction suggérée :
```python
def calculate_hand_strength(hand):
    if not hasattr(hand, 'strength'):
        return 0  # ou une valeur par défaut
    return hand.strength * 2
```

---
*Réponse générée par Vibe Bot (Mistral AI)*
```

---

### Exemple 2 : Revue de code
**Commentaire sur une PR :**
```
@vibe review
```

**Réponse du bot :**
```
🔍 **Revue de code :**

Analyse de la Pull Request :
- ✅ **Structure** : Le code est bien organisé en fonctions claires
- ⚠️ **Performance** : La fonction `calculate_equity` pourrait être optimisée avec du caching
- ❌ **Bug** : La variable `total_cards` n'est pas initialisée dans `deck.shuffle()`
- 💡 **Suggestion** : Ajouter des docstrings pour les fonctions publiques

---
*Réponse générée par Vibe Bot (Mistral AI)*
```

---

### Exemple 3 : Explication
**Commentaire sur une issue :**
```
@vibe explain what is VPIP in poker
```

**Réponse du bot :**
```
📚 **Explication :**

**VPIP (Voluntarily Put Money In Pot)** est une statistique clé en poker qui mesure le pourcentage de mains où un joueur met volontairement de l'argent dans le pot (en misant ou en suivant) avant le flop.

- **Calcul** : (Nombre de mains où le joueur mise/follow préflop / Nombre total de mains) × 100
- **Interprétation** :
  - VPIP élevé (40%+) : Joueur loose (joue beaucoup de mains)
  - VPIP bas (10-20%) : Joueur tight (joue peu de mains)
  - VPIP moyen (25-30%) : Joueur standard

Exemple : Un joueur avec un VPIP de 25% joue environ 1 main sur 4 préflop.

---
*Réponse générée par Vibe Bot (Mistral AI)*
```

---

## 🛠️ Développement

### Structure du Projet
```
vibe-bot/
├── src/
│   ├── index.js          # Serveur principal (Express)
│   ├── github.js         # Client GitHub (authentification, webhooks)
│   ├── mistral.js        # Client Mistral AI
│   └── config.js         # Configuration du bot
├── package.json
├── .env.example
├── .env                  # Variables d'environnement (ignoré par git)
└── README.md
```

### Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Démarre le bot en production |
| `npm run dev` | Démarre le bot en développement (avec nodemon) |
| `npm run build` | Compile le code TypeScript (si utilisé) |
| `npm test` | Exécute les tests |

---

## 🐛 Dépannage

### Problème : Le bot ne répond pas aux commandes

1. **Vérifie les logs** :
   ```bash
   npm run dev
   ```
   - Est-ce que le serveur démarre correctement ?
   - Est-ce que les webhooks sont reçus ?

2. **Vérifie la configuration GitHub** :
   - L'app est-elle installée sur le dépôt ?
   - Le webhook est-il correctement configuré ?
   - Les permissions sont-elles suffisantes ?

3. **Vérifie les variables d'environnement** :
   - Toutes les variables obligatoires sont-elles présentes ?
   - La clé privée est-elle au bon format ?

4. **Teste le webhook manuellement** :
   - Utilise [GitHub's webhook tester](https://github.com/settings/apps) pour envoyer un événement de test

---

### Problème : Erreur d'authentification GitHub

1. **Vérifie la clé privée** :
   - Est-elle au format PEM ?
   - A-t-elle été copiée correctement (y compris les `-----BEGIN RSA PRIVATE KEY-----` et `-----END RSA PRIVATE KEY-----`) ?

2. **Vérifie l'App ID** :
   - Correspond-il à l'ID de ton application GitHub ?

3. **Vérifie le Webhook Secret** :
   - Correspond-il au secret configuré dans l'application GitHub ?

---

### Problème : Erreur avec l'API Mistral

1. **Vérifie ta clé API** :
   - Est-elle valide ?
   - A-t-elle expiré ?

2. **Vérifie ton solde** :
   - As-tu assez de crédits sur ton compte Mistral ?

3. **Teste l'API manuellement** :
   ```bash
   curl -X POST https://api.mistral.ai/v1/chat/completions \
     -H "Authorization: Bearer TA_CLE_API" \
     -H "Content-Type: application/json" \
     -d '{"model": "mistral-tiny", "messages": [{"role": "user", "content": "Hello"}]}'
   ```

---

## 📜 Licence

Ce projet est sous licence **MIT**. Tu es libre de l'utiliser, le modifier et le distribuer.

---

## 🙏 Remerciements

- **Mistral AI** pour leur API puissante et accessible
- **GitHub** pour leur plateforme et leurs outils développeurs
- **Octokit** pour leur bibliothèque JavaScript GitHub

---

## 📧 Support

Pour toute question ou problème, ouvre une **Issue** sur le dépôt [poker_tool](https://github.com/polmichel/poker_tool) ou contacte-moi directement.

**Bon développement avec Vibe Bot ! 🚀**
