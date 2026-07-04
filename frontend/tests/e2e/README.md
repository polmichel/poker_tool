# Tests E2E avec Playwright

Ce dossier contient les tests End-to-End (E2E) pour l'application Poker Tool, implémentés avec [Playwright](https://playwright.dev/).

## Structure

```
tests/e2e/
├── specs/              # Fichiers de tests
│   ├── create-range.spec.ts    # Tests pour la création de ranges
│   └── questionnaire.spec.ts   # Tests pour les questionnaires
├── fixtures/           # Données de test réutilisables
│   └── ranges.ts       # Mock data pour les ranges
├── utils/              # Fonctions utilitaires
│   └── test-utils.ts   # Fonctions d'aide pour les tests
├── playwright.config.ts # Configuration de Playwright
├── global-setup.ts     # Setup global (authentification, etc.)
└── README.md           # Ce fichier
```

## Prérequis

- Node.js 18+ (recommandé: 20+)
- npm ou yarn
- Les dépendances du projet installées

## Installation

```bash
# Installer Playwright et les dépendances
npm install --save-dev @playwright/test dotenv

# Installer les navigateurs (Chromium, Firefox, WebKit)
npx playwright install
```

## Exécution des tests

### En mode headless (par défaut)
```bash
npm run test:e2e
```

### En mode UI (pour le débogage)
```bash
npm run test:e2e:ui
```

### En mode headed (voir le navigateur)
```bash
npm run test:e2e:headed
```

### Exécuter un test spécifique
```bash
npx playwright test tests/e2e/specs/create-range.spec.ts
```

### Exécuter avec un navigateur spécifique
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Voir le rapport HTML
```bash
npm run test:e2e:report
```

## Configuration

### Variables d'environnement

Créez un fichier `.env.test` à la racine du frontend avec les variables suivantes :

```env
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
CI=false
```

### Configuration de Playwright

Le fichier `playwright.config.ts` contient la configuration principale :
- `baseURL` : URL de l'application
- `timeout` : Timeout pour les tests
- `retries` : Nombre de tentatives en cas d'échec
- `projects` : Navigateurs à tester
- `webServer` : Configuration pour démarrer le serveur de développement

## Scénarios de test

### 1. Création d'une range

**Fichier** : `create-range.spec.ts`

**Étapes testées** :
- Accéder à la page de création de range (`/ranges/new`)
- Remplir le formulaire (nom, description, type, position)
- Sauvegarder la range
- Vérifier qu'elle apparaît dans la liste des ranges

**Sélecteurs utilisés** :
- `button:has-text("Nouvelle Range")` - Bouton pour créer une nouvelle range
- `input[name="name"]` - Champ pour le nom de la range
- `input[name="description"]` - Champ pour la description
- `select[name="range_type"]` - Sélecteur pour le type de range
- `select[name="position"]` - Sélecteur pour la position
- `button[type="submit"]` - Bouton de soumission

### 2. Questionnaire (Training)

**Fichier** : `questionnaire.spec.ts`

**Étapes testées** :
- Accéder à la page d'entraînement (`/training`)
- Sélectionner une range existante
- Lancer un questionnaire dans chaque mode (fill, guess, complete)
- Répondre à une question
- Terminer la session
- Vérifier l'affichage du score

**Modes disponibles** :
- `fill` - Remplir
- `guess` - Deviner  
- `complete` - Compléter

**Sélecteurs utilisés** :
- `button:has-text("Démarrer")` - Bouton pour démarrer
- `.MuiChip-root` - Puces pour sélectionner les ranges
- `button:has-text("Paramètres")` - Bouton pour ouvrir les paramètres
- `text=/Question \d+\/\d+/` - Indicateur de question
- `text="Résultats de la Session"` - Dialogue des résultats

## Bonnes pratiques

### 1. Sélecteurs

- **Privilégier les sélecteurs sémantiques** : Utilisez des sélecteurs basés sur le texte ou les attributs plutôt que sur la structure DOM qui peut changer.
  ```typescript
  // ✅ Bon
  page.locator('button:has-text("Sauvegarder")')
  page.locator('input[name="rangeName"]')
  
  // ❌ À éviter
  page.locator('.MuiButton-root:nth-child(3)')
  ```

- **Utiliser les data-testid** : Ajoutez des attributs `data-testid` à vos composants pour des sélecteurs plus stables.
  ```tsx
  // Dans votre composant
  <button data-testid="save-range-button">Sauvegarder</button>
  
  // Dans votre test
  page.locator('[data-testid="save-range-button"]')
  ```

### 2. Attendre les éléments

Toujours attendre que les éléments soient visibles avant d'interagir avec eux :

```typescript
const element = page.locator('button:has-text("Sauvegarder")');
await element.waitFor({ state: 'visible' });
await element.click();
```

### 3. Gestion des timeouts

- Utilisez des timeouts appropriés pour les actions lentes
- Augmentez le timeout pour les tests en CI

```typescript
// Dans playwright.config.ts
export default defineConfig({
  use: {
    timeout: 60000, // 60 secondes
    actionTimeout: 5000, // 5 secondes
    navigationTimeout: 30000, // 30 secondes
  },
});
```

### 4. Mock des API

Utilisez `page.route()` pour mocker les appels API :

```typescript
// Mock une requête GET
await page.route('**/api/ranges', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Test Range' }]),
  });
});

// Mock une requête POST
await page.route('**/api/ranges', (route) => {
  if (route.request().method() === 'POST') {
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, name: 'New Range' }),
    });
  } else {
    route.continue();
  }
});
```

### 5. Authentification

Pour les tests nécessitant une authentification, utilisez `global-setup.ts` :

```typescript
// tests/e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

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

export default globalSetup;
```

Puis utilisez le storage state dans la configuration :

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    storageState: 'storageState.json',
  },
});
```

## Débogage

### 1. Mode UI

```bash
npm run test:e2e:ui
```

Ouvre une interface graphique pour :
- Voir la liste des tests
- Exécuter des tests individuellement
- Voir les logs en temps réel
- Inspecter les erreurs

### 2. Mode headed

```bash
npm run test:e2e:headed
```

Ouvre un navigateur visible pour voir ce qui se passe.

### 3. Trace Viewer

Pour activer le trace viewer :

```typescript
// Dans playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry', // ou 'always' pour toujours tracer
  },
});
```

Puis pour voir la trace :

```bash
npx playwright show-trace test-results/traces/<test-name>.zip
```

### 4. Screenshots

Les screenshots sont automatiquement capturés en cas d'échec. Vous pouvez aussi en prendre manuellement :

```typescript
await page.screenshot({ path: 'test-results/screenshots/debug.png' });
```

## Intégration Continue

Le workflow GitHub Actions (`.github/workflows/e2e.yml`) exécute automatiquement les tests E2E sur :
- Chaque push sur `main` et `develop`
- Chaque pull request vers `main` et `develop`

Les artefacts (rapports, screenshots, vidéos) sont conservés pendant 30 jours.

## Prochaines étapes

1. **Adapter les sélecteurs** : Vérifiez que les sélecteurs utilisés dans les tests correspondent à votre implémentation réelle.

2. **Ajouter des data-testid** : Ajoutez des attributs `data-testid` à vos composants pour des tests plus robustes.

3. **Configurer l'authentification** : Si votre application nécessite une authentification, configurez `global-setup.ts`.

4. **Mock les API** : Si votre application dépend d'une API backend, utilisez `page.route()` pour mocker les réponses.

5. **Tester localement** : Exécutez les tests localement pour vérifier qu'ils passent avant de pousser sur le dépôt.

## Ressources

- [Documentation Playwright](https://playwright.dev/docs/intro)
- [API Reference](https://playwright.dev/docs/api)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Examples](https://github.com/microsoft/playwright/tree/main/examples)
