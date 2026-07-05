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
- **Les secrets GitHub configurés** dans ton dépôt

---

## 📋 Configuration

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
   - **Webhook URL** : *(À configurer après le déploiement, ex: `https://ton-serveur.com/webhook`)*
   - **Webhook Secret** : Génère une clé secrète (à stocker dans `POKER_TOOL_APP_SECRET_KEY`)

5. **Private Key** :
   - Télécharge la clé privée (format `.pem`) depuis la page de l'app
   - **Copie TOUT le contenu** (y compris `-----BEGIN RSA PRIVATE KEY-----` et `-----END RSA PRIVATE KEY-----`)
   - Stocke-le dans le secret `POKER_TOOL_PRIVATE_KEY`

6. **Installer l'app** sur ton dépôt `poker_tool`

---

### Secrets GitHub à Configurer

Va dans **`https://github.com/polmichel/poker_tool/settings/secrets/actions`** et ajoute ces **4 secrets** :

| Nom du Secret | Valeur | Description |
|---------------|--------|-------------|
| `POKER_TOOL_APP_ID` | ID de ton app GitHub | Trouvé dans les paramètres de l'app |
| `POKER_TOOL_PRIVATE_KEY` | Contenu du fichier `.pem` | **Copie TOUT le contenu** de la clé privée |
| `POKER_TOOL_APP_SECRET_KEY` | Secret du webhook | Généré lors de la création du webhook |
| `MISTRAL_API_KEY` | Ta clé API Mistral | Récupérée sur [Mistral Console](https://console.mistral.ai/) |

⚠️ **Important pour `POKER_TOOL_PRIVATE_KEY`** :
- Ouvre le fichier `.pem` téléchargé depuis GitHub
- **Sélectionne et copie TOUT** (y compris les lignes `-----BEGIN RSA PRIVATE KEY-----` et `-----END RSA PRIVATE KEY-----`)
- Colle-le **exactement** dans le secret (sans ajouter d'espaces ou de sauts de ligne supplémentaires)

---

## 🚀 Déploiement

### Option 1 : Railway (Recommandé - Gratuit)

1. **Créer un compte** sur [Railway](https://railway.app/)
2. **Nouveau projet** → **Deploy from GitHub repo**
3. Sélectionne `poker_tool` et la branche `main` (après avoir mergé la PR)
4. **Configure les variables d'environnement** dans Railway :
   ```
   POKER_TOOL_APP_ID = [ton_app_id]
   POKER_TOOL_PRIVATE_KEY = [contenu_du_fichier_pem]
   POKER_TOOL_APP_SECRET_KEY = [ton_webhook_secret]
   MISTRAL_API_KEY = [ta_clé_mistral]
   ALLOWED_REPOS = polmichel/poker_tool
   BOT_NAME = Vibe Bot
   BOT_PREFIX = @vibe
   PORT = 3000
   ```
5. **Déploie**
6. **Récupère l'URL** (ex: `https://vibe-bot-production.up.railway.app`)
7. **Mets à jour le Webhook URL** dans ta GitHub App :
   - Va dans ta GitHub App → **Webhook** → **Edit**
   - **Webhook URL** : `https://vibe-bot-production.up.railway.app/webhook`
   - **Webhook Secret** : *(déjà configuré dans `POKER_TOOL_APP_SECRET_KEY`)*
   - ✅ **Active** le webhook

---

### Option 2 : Render (Gratuit)

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
5. **Ajoute les variables d'environnement** (mêmes que pour Railway)
6. **Déploie**
7. **Mets à jour le Webhook URL** dans ta GitHub App avec l'URL Render

---

### Option 3 : Tester Localement avec ngrok

1. **Installe ngrok** :
   ```bash
   npm install -g ngrok
   ```

2. **Démarre le bot** :
   ```bash
   cd poker_tool/vibe-bot
   npm install
   npm run dev
   ```

3. **Expose le port 3000** :
   ```bash
   ngrok http 3000
   ```
   → Tu obtiendras une URL comme `https://abc123.ngrok.io`

4. **Mets à jour le Webhook URL** dans ta GitHub App :
   - **Webhook URL** : `https://abc123.ngrok.io/webhook`
   - **Webhook Secret** : *(même valeur que `POKER_TOOL_APP_SECRET_KEY`)*

5. **Teste le bot** :
   - Va sur une issue/PR de ton dépôt
   - Écris : `@vibe explain what is VPIP in poker`
   - Le bot devrait répondre !

⚠️ **Note** : ngrok donne une URL temporaire. Pour les tests locaux uniquement.

---

## 🤖 Commandes Disponibles

| Commande | Description | Exemple |
|----------|-------------|---------|
| `@vibe fix this` | 🔧 Analyse le code/problème et propose une correction | `@vibe fix this` |
| `@vibe explain` | 📚 Explique un concept ou un code | `@vibe explain this function` |
| `@vibe review` | 🔍 Fait une revue de code complète | `@vibe review this PR` |
| `@vibe suggest` | 💡 Propose des améliorations | `@vibe suggest optimizations` |
| `@vibe docs` | 📖 Génère de la documentation | `@vibe docs for this class` |
| `@vibe help` | ❓ Affiche l'aide | `@vibe help` |

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

## 📦 Structure du Projet

```
poker_tool/
└── vibe-bot/
    ├── src/
    │   ├── index.js          # 🚀 Serveur Express (webhooks GitHub)
    │   ├── github.js         # 🔑 Client GitHub (auth + API)
    │   ├── mistral.js        # 🤖 Client Mistral AI
    │   └── config.js         # ⚙️ Configuration
    ├── package.json          # 📦 Dépendances Node.js
    ├── .env.example          # 🔐 Template de configuration
    ├── .gitignore            # 🚫 Fichiers à ignorer
    └── README.md             # 📖 Documentation
```

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

### Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Démarre le bot en production |
| `npm run dev` | Démarre le bot en développement (avec nodemon) |

---

## 🐛 Dépannage

### Problème : Le bot ne répond pas aux commandes

1. **Vérifie les logs** :
   ```bash
   cd vibe-bot
   npm run dev
   ```
   - Est-ce que le serveur démarre correctement ?
   - Est-ce que les webhooks sont reçus ?

2. **Vérifie la configuration GitHub** :
   - L'app est-elle installée sur le dépôt ?
   - Le webhook est-il correctement configuré ?
   - Les permissions sont-elles suffisantes ?

3. **Vérifie les secrets GitHub** :
   - Toutes les variables obligatoires sont-elles présentes ?
   - La clé privée est-elle au bon format (avec les en-têtes PEM) ?

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
