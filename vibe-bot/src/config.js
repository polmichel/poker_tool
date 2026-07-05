/**
 * Configuration du bot Vibe pour GitHub
 * Charge les variables d'environnement et valide la configuration
 */

require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const config = {
  // ===========================================
  // GitHub App Configuration
  // ===========================================
  github: {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  },

  // ===========================================
  // Mistral AI Configuration
  // ===========================================
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY,
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
    allowedRepos: process.env.ALLOWED_REPOS?.split(',').map(r => r.trim()) || [],
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
  { name: 'GITHUB_APP_ID', value: config.github.appId },
  { name: 'GITHUB_PRIVATE_KEY', value: config.github.privateKey },
  { name: 'GITHUB_WEBHOOK_SECRET', value: config.github.webhookSecret },
  { name: 'MISTRAL_API_KEY', value: config.mistral.apiKey },
];

const missingConfig = requiredConfig.filter(({ value }) => !value || value === 'your_github_app_id_here' || value === 'your_webhook_secret_here' || value === 'your_mistral_api_key_here');

if (missingConfig.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error('❌ Configuration manquante :');
  missingConfig.forEach(({ name }) => {
    console.error(`  - ${name}`);
  });
  console.error('\nVeuillez configurer les variables d\'environnement dans le fichier .env');
  console.error('Copiez le fichier .env.example et complétez-le avec vos valeurs.');
  process.exit(1);
}

// Validation du format de la clé privée
if (config.github.privateKey && !config.github.privateKey.includes('BEGIN RSA PRIVATE KEY')) {
  console.error('❌ La clé privée GitHub (GITHUB_PRIVATE_KEY) doit être au format PEM.');
  console.error('Exemple : -----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----');
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

module.exports = config;
