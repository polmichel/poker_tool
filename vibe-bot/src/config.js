/**
 * Configuration du bot Vibe pour GitHub
 * Charge les variables d'environnement et les secrets GitHub
 */

// Essayer de charger dotenv d'abord (pour le développement local)
try {
  require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
} catch (error) {
  // Ignorer si dotenv n'est pas disponible (en production avec GitHub Secrets)
}

const config = {
  // ===========================================
  // GitHub App Configuration
  // ===========================================
  github: {
    // Utilise les noms de secrets que tu as configurés
    appId: process.env.POKER_TOOL_APP_ID || process.env.GITHUB_APP_ID,
    privateKey: (process.env.POKER_TOOL_PRIVATE_KEY || process.env.GITHUB_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
    webhookSecret: process.env.POKER_TOOL_APP_SECRET_KEY || process.env.GITHUB_WEBHOOK_SECRET,
  },

  // ===========================================
  // Mistral AI Configuration
  // ===========================================
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY || process.env.VIBE_MISTRAL_API_KEY,
    model: process.env.MISTRAL_MODEL || 'mistral-tiny',
    baseUrl: process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',
    timeout: parseInt(process.env.MISTRAL_TIMEOUT) || 30000, // 30 secondes
  },

  // ===========================================
  // Server Configuration
  // ===========================================
  server: {
    port: parseInt(process.env.PORT) || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },

  // ===========================================
  // Bot Configuration
  // ===========================================
  bot: {
    name: process.env.BOT_NAME || 'Vibe Bot',
    prefix: process.env.BOT_PREFIX || '@vibe',
    allowedRepos: process.env.ALLOWED_REPOS?.split(',').map(r => r.trim()) || ['polmichel/poker_tool'],
    allowedUsers: process.env.ALLOWED_USERS?.split(',').map(u => u.trim()) || [],
  },

  // ===========================================
  // Logging Configuration
  // ===========================================
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// ===========================================
// Validation de la configuration
// ===========================================

const requiredConfig = [
  { name: 'POKER_TOOL_APP_ID ou GITHUB_APP_ID', value: config.github.appId },
  { name: 'POKER_TOOL_PRIVATE_KEY ou GITHUB_PRIVATE_KEY', value: config.github.privateKey },
  { name: 'POKER_TOOL_APP_SECRET_KEY ou GITHUB_WEBHOOK_SECRET', value: config.github.webhookSecret },
  { name: 'MISTRAL_API_KEY', value: config.mistral.apiKey },
];

const missingConfig = requiredConfig.filter(({ value }) => !value || value.includes('your_') || value.includes('here'));

if (missingConfig.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error('❌ Configuration manquante :');
  missingConfig.forEach(({ name }) => {
    console.error(`  - ${name}`);
  });
  console.error('\nVeuillez configurer les secrets GitHub ou les variables d\'environnement.');
  console.error('Secrets nécessaires : POKER_TOOL_APP_ID, POKER_TOOL_PRIVATE_KEY, POKER_TOOL_APP_SECRET_KEY, MISTRAL_API_KEY');
  process.exit(1);
}

// Validation du format de la clé privée
if (config.github.privateKey && !config.github.privateKey.includes('BEGIN RSA PRIVATE KEY')) {
  console.error('❌ La clé privée GitHub doit être au format PEM.');
  console.error('Exemple : -----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----');
  console.error('Assurez-vous que le secret POKER_TOOL_PRIVATE_KEY contient bien toute la clé, y compris les en-têtes.');
  process.exit(1);
}

// Validation du modèle Mistral
const validModels = ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large', 'mistral-embed'];
if (!validModels.includes(config.mistral.model)) {
  console.warn(`⚠️  Le modèle "${config.mistral.model}" n'est pas dans la liste des modèles valides.`);
  console.warn(`Modèles valides : ${validModels.join(', ')}`);
}

// Validation des dépôts autorisés
if (config.bot.allowedRepos.length === 0) {
  console.warn('⚠️  Aucun dépôt autorisé configuré. Le bot répondra à tous les dépôts.');
}

// Afficher la configuration chargée (pour le débogage)
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Configuration chargée :');
  console.log(`  - GitHub App ID: ${config.github.appId ? '✓' : '✗'}`);
  console.log(`  - GitHub Private Key: ${config.github.privateKey ? '✓' : '✗'}`);
  console.log(`  - GitHub Webhook Secret: ${config.github.webhookSecret ? '✓' : '✗'}`);
  console.log(`  - Mistral API Key: ${config.mistral.apiKey ? '✓' : '✗'}`);
  console.log(`  - Dépôts autorisés: ${config.bot.allowedRepos.join(', ')}`);
}

module.exports = config;
