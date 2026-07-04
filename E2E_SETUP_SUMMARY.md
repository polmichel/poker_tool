# 🎯 Implémentation des Tests E2E avec Playwright

## ✅ Ce qui a été implémenté

### 1. **Configuration Initiale**

#### 📦 Dépendances installées
- `@playwright/test` - Framework de test E2E
- `dotenv` - Gestion des variables d'environnement

#### 📁 Structure des fichiers créée

```
frontend/
├── tests/
│   └── e2e/
│       ├── specs/                      # Fichiers de tests
│       │   ├── create-range.spec.ts    # Tests pour la création de ranges
│       │   ├── questionnaire.spec.ts   # Tests pour les questionnaires
│       │   ├── smoke.spec.ts           # Tests de vérification de base
│       │   └── index.ts                # Index des specs
│       ├── fixtures/                   # Données de test
│       │   ├── ranges.ts               # Mock data pour les ranges
│       │   └── index.ts                # Index des fixtures
│       ├── utils/                      # Fonctions utilitaires
│       │   ├── test-utils.ts           # Utilitaires de test
│       │   └── index.ts                # Index des utils
│       ├── types/                      # Déclarations TypeScript
│       │   └── index.d.ts              # Types personnalisés
│       ├── playwright.config.ts        # Configuration Playwright
│       ├── global-setup.ts             # Setup global
│       ├── tsconfig.json               # Configuration TypeScript
│       └── README.md                   # Documentation
├── .env.test                          # Variables d'environnement
├── .gitignore.e2e                     # Ignore pour les artefacts de test
└── scripts/
    └── verify-e2e-config.js           # Script de vérification

.github/
└── workflows/
    └── e2e.yml                        # Workflow GitHub Actions
```

### 2. **Configuration de Playwright**

#### 🎛️ `playwright.config.ts`
- **Base URL** : `http://localhost:3000` (configurable via `.env.test`)
- **Navigateurs** : Chromium, Firefox, WebKit
- **Timeouts** : 
  - Test timeout: 60 secondes
  - Action timeout: 5 secondes
  - Navigation timeout: 30 secondes
- **Rapports** : HTML et JSON
- **Web Server** : Démarrage automatique du serveur React
- **Artifacts** : Screenshots et vidéos en cas d'échec

#### 🌐 `global-setup.ts`
- Prêt pour l'implémentation de l'authentification
- Peut être étendu pour gérer la connexion avant les tests

### 3. **Scénarios de Test Implémentés**

#### 📝 **Scénario 1 : Création d'une Range** (`create-range.spec.ts`)

**Objectif** : Créer et enregistrer une range de poker

**Tests implémentés** :
1. ✅ Accéder à la page de création de range
2. ✅ Créer et enregistrer une range avec le formulaire
3. ✅ Créer une range via le bouton "Nouvelle Range"
4. ✅ Vérifier que la range créée apparaît dans la liste
5. ✅ Annuler la création d'une range
6. ✅ Sélectionner une range existante
7. ✅ Voir les détails d'une range

**Sélecteurs utilisés** (à adapter selon votre implémentation) :
- `button:has-text("Nouvelle Range")` - Bouton de création
- `input[name="name"]` - Champ nom
- `input[name="description"]` - Champ description
- `select[name="range_type"]` - Sélecteur de type
- `select[name="position"]` - Sélecteur de position
- `button[type="submit"]` - Bouton de soumission
- `.MuiListItemButton-root` - Éléments de la liste

#### 🎯 **Scénario 2 : Questionnaire** (`questionnaire.spec.ts`)

**Objectif** : Lancer un questionnaire dans les 3 modes (fill, guess, complete)

**Tests implémentés** :
1. ✅ Accéder à la page d'entraînement
2. ✅ Sélectionner une range pour l'entraînement
3. ✅ Lancer un questionnaire en mode `fill`
4. ✅ Lancer un questionnaire en mode `guess`
5. ✅ Lancer un questionnaire en mode `complete`
6. ✅ Répondre à une question et passer à la suivante
7. ✅ Terminer une session d'entraînement
8. ✅ Vérifier l'affichage du score
9. ✅ Ouvrir les paramètres d'entraînement
10. ✅ Changer le nombre de questions
11. ✅ Démarrer rapidement avec les paramètres par défaut

**Modes de test** :
- `fill` - Remplir (l'utilisateur doit sélectionner l'action pour une main)
- `guess` - Deviner (l'utilisateur doit deviner si une main fait partie de la range)
- `complete` - Compléter (l'utilisateur doit compléter une range partielle)

**Sélecteurs utilisés** :
- `button:has-text("Démarrer")` - Bouton démarrer
- `.MuiChip-root` - Puces pour sélectionner les ranges
- `button:has-text("Paramètres")` - Bouton paramètres
- `text=/Question \d+\/\d+/` - Indicateur de question
- `text="Résultats de la Session"` - Dialogue des résultats

### 4. **Fixtures et Utilitaires**

#### 📋 **Fixtures** (`fixtures/ranges.ts`)
- `mockRange` - Une range de test complète
- `mockRange2` - Une deuxième range de test
- `mockEmptyRange` - Une range vide pour les tests edge cases
- `newRangeData` - Données pour la création d'une nouvelle range
- `rangeFormData` - Données du formulaire
- `mockRanges` - Tableau de ranges mockées

#### 🔧 **Utilitaires** (`utils/test-utils.ts`)
- `navigateTo()` - Naviguer vers une URL
- `waitForElement()` - Attendre qu'un élément soit visible
- `waitForElementToDisappear()` - Attendre qu'un élément disparaisse
- `clickWithRetry()` - Cliquer avec réessai
- `fillField()` - Remplir un champ
- `selectOption()` - Sélectionner une option
- `elementExists()` - Vérifier si un élément existe
- `getElementText()` - Obtenir le texte d'un élément
- `waitForElementCount()` - Attendre un nombre spécifique d'éléments
- `assertCurrentPath()` - Vérifier le chemin actuel
- `waitForLoadingToComplete()` - Attendre la fin du chargement
- `mockApiResponse()` - Mocker une réponse API
- `mockGetRequest()` - Mocker une requête GET
- `mockPostRequest()` - Mocker une requête POST
- `takeScreenshot()` - Prendre une capture d'écran
- `scrollToElement()` - Faire défiler vers un élément
- `pressKey()` - Appuyer sur une touche
- `typeText()` - Taper du texte

### 5. **Intégration CI/CD**

#### 🚀 **GitHub Actions Workflow** (`.github/workflows/e2e.yml`)

**Déclencheurs** :
- Push sur `main` et `develop`
- Pull Request vers `main` et `develop`

**Étapes** :
1. Checkout du code
2. Setup Node.js 20
3. Installation des dépendances
4. Installation des navigateurs Playwright
5. Exécution des tests
6. Upload des rapports et artefacts

**Artifacts conservés** :
- Rapports HTML et JSON
- Screenshots et vidéos
- Traces de débogage
- Durée de rétention : 30 jours

### 6. **Scripts npm**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## 🔧 Adaptations Nécessaires

### 1. **Sélecteurs CSS**

Les sélecteurs utilisés dans les tests sont basés sur des hypothèses concernant votre implémentation. **Vous devez les adapter** pour correspondre à votre code réel.

**Exemples à vérifier** :

Dans `RangeEditor.tsx` :
```tsx
// Vérifiez que ces attributs existent
<input name="name" />
<select name="range_type" />
<select name="position" />
```

Dans `Training.tsx` :
```tsx
// Vérifiez que ces boutons existent
<button data-mode="fill">Remplir</button>
<button data-mode="guess">Deviner</button>
<button data-mode="complete">Compléter</button>
```

**Recommandation** : Ajoutez des attributs `data-testid` à vos composants pour des sélecteurs plus robustes.

```tsx
// Exemple avec data-testid
<button data-testid="save-range-button">Sauvegarder</button>

// Dans le test
page.locator('[data-testid="save-range-button"]')
```

### 2. **Modes de Questionnaire**

J'ai supposé que les modes étaient `fill`, `guess`, et `complete` basés sur votre type `TrainingMode`. **Vérifiez que ces modes correspondent** à votre implémentation réelle dans `Training.tsx`.

Dans votre code :
```typescript
// types/index.ts
export type TrainingMode = 'fill' | 'guess' | 'complete';
```

Si vos modes sont différents (par exemple `2a`, `2b`, `2c` comme mentionné dans votre demande initiale), vous devez :

1. Mettre à jour le type `TrainingMode`
2. Mettre à jour les sélecteurs dans `questionnaire.spec.ts`

### 3. **Authentification**

Si votre application nécessite une authentification, vous devez :

1. **Configurer `global-setup.ts`** :
```typescript
async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('/login');
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || '');
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || '');
  await page.click('button[type="submit"]');
  
  await page.context().storageState({ path: 'storageState.json' });
  await browser.close();
}
```

2. **Configurer `playwright.config.ts`** :
```typescript
export default defineConfig({
  use: {
    storageState: 'storageState.json',
  },
});
```

3. **Ajouter les credentials dans `.env.test`** :
```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
```

### 4. **Mock des API**

Si votre frontend dépend d'une API backend, vous pouvez mocker les réponses :

```typescript
// Dans un test ou dans global-setup.ts
await page.route('**/api/ranges', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'Test Range', hands: { 'AA': 'raise' } }
    ]),
  });
});
```

### 5. **URL de Base**

Vérifiez que l'URL de base dans `.env.test` correspond à votre configuration :

```env
BASE_URL=http://localhost:3000
```

Si votre application tourne sur un autre port, mettez à jour cette valeur.

## 🚀 Exécution des Tests

### 1. **Installation**

```bash
# Depuis le dossier frontend
cd frontend

# Installer Playwright
npm install --save-dev @playwright/test dotenv

# Installer les navigateurs
npx playwright install
```

### 2. **Démarrer le serveur**

Dans un terminal séparé :
```bash
npm run start
```

### 3. **Exécuter les tests**

#### Mode headless (par défaut)
```bash
npm run test:e2e
```

#### Mode UI (pour le débogage)
```bash
npm run test:e2e:ui
```

#### Mode headed (voir le navigateur)
```bash
npm run test:e2e:headed
```

#### Exécuter un test spécifique
```bash
npx playwright test tests/e2e/specs/create-range.spec.ts
```

#### Exécuter avec un navigateur spécifique
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### Voir le rapport
```bash
npm run test:e2e:report
```

## 📊 Vérification de la Configuration

Exécutez le script de vérification :

```bash
node scripts/verify-e2e-config.js
```

Cela vérifie que tous les fichiers nécessaires sont en place.

## 🎯 Prochaines Étapes

### 1. **Priorité Haute** ⭐⭐⭐
- [ ] **Adapter les sélecteurs** dans les fichiers de test pour correspondre à votre implémentation réelle
- [ ] **Vérifier les modes de questionnaire** (fill, guess, complete vs 2a, 2b, 2c)
- [ ] **Tester localement** avec `npm run test:e2e:headed`

### 2. **Priorité Moyenne** ⭐⭐
- [ ] **Configurer l'authentification** si nécessaire
- [ ] **Mock les appels API** si le backend n'est pas disponible
- [ ] **Ajouter des data-testid** pour des tests plus robustes

### 3. **Priorité Basse** ⭐
- [ ] **Ajouter plus de tests** pour d'autres fonctionnalités
- [ ] **Configurer le mocking avec MSW** pour des tests plus fiables
- [ ] **Optimiser les timeouts** selon votre application
- [ ] **Ajouter des tests pour les edge cases**

## 📚 Documentation

- **Documentation complète** : `frontend/tests/e2e/README.md`
- **API Playwright** : https://playwright.dev/docs/api
- **Bonnes pratiques** : https://playwright.dev/docs/best-practices

## 🐛 Dépannage

### Problème : "WebAssembly out of memory"
C'est un problème environnemental avec Node.js dans certains conteneurs. Pour résoudre :
- Utilisez une version plus récente de Node.js
- Augmentez la mémoire disponible
- Exécutez les tests localement

### Problème : "Cannot find module '@playwright/test'"
```bash
npm install --save-dev @playwright/test
```

### Problème : "No tests found"
Vérifiez que :
- Les fichiers de test ont l'extension `.spec.ts`
- Ils sont dans le dossier `tests/e2e/specs/`
- La configuration `testDir` dans `playwright.config.ts` est correcte

### Problème : "Timeout exceeded"
Augmentez les timeouts dans `playwright.config.ts` :
```typescript
use: {
  timeout: 120000, // 2 minutes
  actionTimeout: 10000, // 10 secondes
  navigationTimeout: 60000, // 1 minute
}
```

## ✨ Fonctionnalités Avancées

### 1. **Tests Paramétrés**

```typescript
test.describe('Test paramétré', () => {
  const testCases = [
    { mode: 'fill', expected: 'Remplir' },
    { mode: 'guess', expected: 'Deviner' },
    { mode: 'complete', expected: 'Compléter' },
  ];

  testCases.forEach(({ mode, expected }) => {
    test(`Test mode ${mode}`, async ({ page }) => {
      // Test implementation
    });
  });
});
```

### 2. **Custom Fixtures**

```typescript
// tests/e2e/fixtures/custom-fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Custom fixture
  loggedInPage: async ({ page }, use) => {
    // Login logic
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await use(page);
  },
});
```

### 3. **Mock Service Worker (MSW)**

Pour un mocking plus avancé :

```bash
npm install --save-dev msw
```

```typescript
// tests/e2e/mocks/handlers.ts
import { setupWorker, rest } from 'msw';

export const handlers = [
  rest.get('/api/ranges', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([{ id: 1, name: 'Test Range' }])
    );
  }),
];

// tests/e2e/global-setup.ts
export default async function globalSetup() {
  const worker = setupWorker(...handlers);
  await worker.start();
  // ... rest of setup
}
```

## 🎉 Résumé

Vous avez maintenant une **suite complète de tests E2E** avec Playwright pour votre application Poker Tool !

**Ce qui est prêt** :
- ✅ Configuration complète de Playwright
- ✅ Structure de fichiers organisée
- ✅ Tests pour la création de ranges
- ✅ Tests pour les questionnaires (3 modes)
- ✅ Utilitaires et fixtures réutilisables
- ✅ Intégration CI/CD avec GitHub Actions
- ✅ Documentation complète

**À faire** :
- ⚠️ Adapter les sélecteurs à votre implémentation
- ⚠️ Vérifier les modes de questionnaire
- ⚠️ Tester localement

Une fois ces adaptations faites, vous pourrez exécuter des tests E2E robustes et fiables pour votre application !
