/**
 * Point d'entrée principal du bot Vibe pour GitHub
 * Gère les webhooks GitHub et traite les commandes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Webhooks } = require('@octokit/webhooks');
const config = require('./config');
const githubClient = require('./github');
const mistralClient = require('./mistral');

// Initialisation de l'application Express
const app = express();

// Middleware de sécurité
app.use(helmet());

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour parser les URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Middleware CORS (pour les tests locaux)
app.use(cors({
  origin: '*', // À restreindre en production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ===========================================
// Initialisation des clients
// ===========================================

// Initialisation des clients GitHub et Mistral
let isInitialized = false;

async function initClients() {
  if (isInitialized) return;

  try {
    // Initialisation du client GitHub App
    await githubClient.initAppClient();
    console.log('✅ Client GitHub App initialisé');

    // Vérification de la santé de l'API GitHub
    const githubHealthy = await githubClient.checkHealth();
    if (githubHealthy) {
      console.log('✅ API GitHub accessible');
    } else {
      console.warn('⚠️  API GitHub inaccessible');
    }

    // Vérification de la santé de l'API Mistral
    const mistralHealthy = await mistralClient.checkHealth();
    if (mistralHealthy) {
      console.log('✅ API Mistral accessible');
    } else {
      console.warn('⚠️  API Mistral inaccessible');
    }

    isInitialized = true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des clients :', error.message);
    process.exit(1);
  }
}

// ===========================================
// Configuration des Webhooks GitHub
// ===========================================

// Création du webhook handler
const webhooks = new Webhooks({
  secret: config.github.webhookSecret,
});

// Enregistrement des événements
webhooks.on('issues.comment', handleIssueComment);
webhooks.on('pull_request_review_comment', handlePRReviewComment);
webhooks.on('pull_request', handlePullRequest);
webhooks.on('issues', handleIssue);
webhooks.onError((error) => {
  console.error('❌ Erreur dans le webhook GitHub :', error.message);
});

// Middleware pour gérer les webhooks
app.use('/webhook', (req, res) => {
  // Vérification de la signature du webhook
  const signature = req.headers['x-hub-signature-256'];
  
  if (!signature) {
    console.error('❌ Pas de signature de webhook');
    return res.status(401).send('Unauthorized');
  }

  // Traitement du webhook
  webhooks.verifyAndReceive({
    id: req.headers['x-github-delivery'],
    name: req.headers['x-github-event'],
    signature: signature,
    payload: req.body,
  })
    .then(() => {
      res.status(200).send('OK');
    })
    .catch((error) => {
      console.error('❌ Erreur de vérification du webhook :', error.message);
      res.status(400).send('Bad Request');
    });
});

// ===========================================
// Handlers pour les événements GitHub
// ===========================================

/**
 * Handler pour les commentaires sur les issues
 */
async function handleIssueComment({ payload }) {
  console.log('📝 Nouveau commentaire sur une issue :', payload.comment.html_url);

  try {
    // Vérification du dépôt
    const repoFullName = payload.repository.full_name;
    if (!githubClient.isRepoAllowed(repoFullName)) {
      console.log(`⏩ Dépôt ${repoFullName} non autorisé, ignoré.`);
      return;
    }

    // Vérification de l'utilisateur
    const commentUser = payload.comment.user.login;
    if (!githubClient.isUserAllowed(commentUser)) {
      console.log(`⏩ Utilisateur ${commentUser} non autorisé, ignoré.`);
      return;
    }

    // Extraction de la commande
    const { command, context, isCommand } = githubClient.extractCommand(payload.comment.body);

    if (!isCommand) {
      console.log('⏩ Pas de commande détectée, ignoré.');
      return;
    }

    console.log(`✅ Commande détectée : "${command}" avec contexte : "${context.substring(0, 50)}..."`);

    // Récupération des détails de l'issue
    const issueDetails = await githubClient.getIssueOrPRDetails({
      installationId: payload.installation.id,
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issueNumber: payload.issue.number,
      isPr: false,
    });

    // Construction du contexte complet
    const fullContext = buildContextForIssue(
      payload.comment.body,
      issueDetails,
      payload.repository
    );

    // Génération de la réponse avec Mistral
    const response = await mistralClient.generateCommandResponse(
      command,
      fullContext,
      {
        repo: repoFullName,
        issueNumber: payload.issue.number,
        user: commentUser,
      }
    );

    // Poster la réponse en commentaire
    await githubClient.postComment({
      installationId: payload.installation.id,
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issueNumber: payload.issue.number,
      body: response,
      isPr: false,
    });

    console.log(`✅ Réponse postée sur l'issue #${payload.issue.number}`);
  } catch (error) {
    console.error('❌ Erreur lors du traitement du commentaire sur l\'issue :', error.message);
  }
}

/**
 * Handler pour les commentaires de revue sur les PR
 */
async function handlePRReviewComment({ payload }) {
  console.log('📝 Nouveau commentaire de revue sur une PR :', payload.comment.html_url);

  try {
    // Vérification du dépôt
    const repoFullName = payload.repository.full_name;
    if (!githubClient.isRepoAllowed(repoFullName)) {
      console.log(`⏩ Dépôt ${repoFullName} non autorisé, ignoré.`);
      return;
    }

    // Vérification de l'utilisateur
    const commentUser = payload.comment.user.login;
    if (!githubClient.isUserAllowed(commentUser)) {
      console.log(`⏩ Utilisateur ${commentUser} non autorisé, ignoré.`);
      return;
    }

    // Extraction de la commande
    const { command, context, isCommand } = githubClient.extractCommand(payload.comment.body);

    if (!isCommand) {
      console.log('⏩ Pas de commande détectée, ignoré.');
      return;
    }

    console.log(`✅ Commande détectée : "${command}" avec contexte : "${context.substring(0, 50)}..."`);

    // Récupération des détails de la PR
    const prDetails = await githubClient.getIssueOrPRDetails({
      installationId: payload.installation.id,
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issueNumber: payload.pull_request.number,
      isPr: true,
    });

    // Construction du contexte complet
    const fullContext = buildContextForPR(
      payload.comment.body,
      prDetails,
      payload.repository
    );

    // Génération de la réponse avec Mistral
    const response = await mistralClient.generateCommandResponse(
      command,
      fullContext,
      {
        repo: repoFullName,
        prNumber: payload.pull_request.number,
        user: commentUser,
      }
    );

    // Poster la réponse en commentaire
    await githubClient.postComment({
      installationId: payload.installation.id,
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issueNumber: payload.pull_request.number,
      body: response,
      isPr: true,
    });

    console.log(`✅ Réponse postée sur la PR #${payload.pull_request.number}`);
  } catch (error) {
    console.error('❌ Erreur lors du traitement du commentaire de revue sur la PR :', error.message);
  }
}

/**
 * Handler pour les événements de PR (ouverture, mise à jour, etc.)
 */
async function handlePullRequest({ payload }) {
  const action = payload.action;
  
  // On ne traite que les actions spécifiques
  if (!['opened', 'reopened', 'synchronize'].includes(action)) {
    return;
  }

  console.log(`📝 Événement de PR : ${action} sur ${payload.pull_request.html_url}`);

  try {
    // Vérification du dépôt
    const repoFullName = payload.repository.full_name;
    if (!githubClient.isRepoAllowed(repoFullName)) {
      console.log(`⏩ Dépôt ${repoFullName} non autorisé, ignoré.`);
      return;
    }

    // Vérification de l'utilisateur
    const prUser = payload.pull_request.user.login;
    if (!githubClient.isUserAllowed(prUser)) {
      console.log(`⏩ Utilisateur ${prUser} non autorisé, ignoré.`);
      return;
    }

    // Vérifier si le commentaire contient une commande pour le bot
    const prBody = payload.pull_request.body || '';
    const { command, context, isCommand } = githubClient.extractCommand(prBody);

    if (!isCommand) {
      console.log('⏩ Pas de commande détectée dans la description de la PR, ignoré.');
      return;
    }

    console.log(`✅ Commande détectée dans la PR : "${command}"`);

    // Récupération des détails de la PR
    const prDetails = await githubClient.getIssueOrPRDetails({
      installationId: payload.installation.id,
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issueNumber: payload.pull_request.number,
      isPr: true,
    });

    // Construction du contexte complet
    const fullContext = buildContextForPR(
      prBody,
      prDetails,
      payload.repository
    );

    // Génération de la réponse avec Mistral
    const response = await mistralClient.generateCommandResponse(
      command,
      fullContext,
      {
        repo: repoFullName,
        prNumber: payload.pull_request.number,
        user: prUser,
      }
    );

    // Poster la réponse en commentaire
    await githubClient.postComment({
      installationId: payload.installation.id,
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issueNumber: payload.pull_request.number,
      body: response,
      isPr: true,
    });

    console.log(`✅ Réponse postée sur la PR #${payload.pull_request.number}`);
  } catch (error) {
    console.error('❌ Erreur lors du traitement de l\'événement de PR :', error.message);
  }
}

/**
 * Handler pour les événements d'issues (ouverture, etc.)
 */
async function handleIssue({ payload }) {
  const action = payload.action;
  
  // On ne traite que les actions spécifiques
  if (!['opened', 'reopened'].includes(action)) {
    return;
  }

  console.log(`📝 Événement d'issue : ${action} sur ${payload.issue.html_url}`);

  try {
    // Vérification du dépôt
    const repoFullName = payload.repository.full_name;
    if (!githubClient.isRepoAllowed(repoFullName)) {
      console.log(`⏩ Dépôt ${repoFullName} non autorisé, ignoré.`);
      return;
    }

    // Vérification de l'utilisateur
    const issueUser = payload.issue.user.login;
    if (!githubClient.isUserAllowed(issueUser)) {
      console.log(`⏩ Utilisateur ${issueUser} non autorisé, ignoré.`);
      return;
    }

    // Vérifier si le commentaire contient une commande pour le bot
    const issueBody = payload.issue.body || '';
    const { command, context, isCommand } = githubClient.extractCommand(issueBody);

    if (!isCommand) {
      console.log('⏩ Pas de commande détectée dans la description de l\'issue, ignoré.');
      return;
    }

    console.log(`✅ Commande détectée dans l'issue : "${command}"`);

    // Récupération des détails de l'issue
    const issueDetails = await githubClient.getIssueOrPRDetails({
      installationId: payload.installation.id,
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issueNumber: payload.issue.number,
      isPr: false,
    });

    // Construction du contexte complet
    const fullContext = buildContextForIssue(
      issueBody,
      issueDetails,
      payload.repository
    );

    // Génération de la réponse avec Mistral
    const response = await mistralClient.generateCommandResponse(
      command,
      fullContext,
      {
        repo: repoFullName,
        issueNumber: payload.issue.number,
        user: issueUser,
      }
    );

    // Poster la réponse en commentaire
    await githubClient.postComment({
      installationId: payload.installation.id,
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issueNumber: payload.issue.number,
      body: response,
      isPr: false,
    });

    console.log(`✅ Réponse postée sur l'issue #${payload.issue.number}`);
  } catch (error) {
    console.error('❌ Erreur lors du traitement de l\'événement d\'issue :', error.message);
  }
}

// ===========================================
// Fonctions utilitaires
// ===========================================

/**
 * Construit le contexte pour une issue
 */
function buildContextForIssue(commentBody, issueDetails, repository) {
  let context = `Issue : ${issueDetails.title}\n\n`;
  context += `Description : ${issueDetails.body || 'Aucune description'}\n\n`;
  context += `Commentaire : ${commentBody}\n\n`;
  context += `Dépôt : ${repository.full_name}\n`;
  context += `URL : ${issueDetails.html_url}\n`;
  
  if (issueDetails.labels && issueDetails.labels.length > 0) {
    context += `\nLabels : ${issueDetails.labels.map(l => l.name).join(', ')}`;
  }

  return context;
}

/**
 * Construit le contexte pour une PR
 */
function buildContextForPR(commentBody, prDetails, repository) {
  let context = `Pull Request : ${prDetails.title}\n\n`;
  context += `Description : ${prDetails.body || 'Aucune description'}\n\n`;
  context += `Commentaire : ${commentBody}\n\n`;
  context += `Dépôt : ${repository.full_name}\n`;
  context += `URL : ${prDetails.html_url}\n`;
  context += `Branche source : ${prDetails.head.ref}\n`;
  context += `Branche cible : ${prDetails.base.ref}\n`;
  
  if (prDetails.labels && prDetails.labels.length > 0) {
    context += `\nLabels : ${prDetails.labels.map(l => l.name).join(', ')}`;
  }

  return context;
}

// ===========================================
// Routes de santé et d'information
// ===========================================

// Route de santé
app.get('/health', async (req, res) => {
  try {
    const githubHealthy = await githubClient.checkHealth();
    const mistralHealthy = await mistralClient.checkHealth();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        github: githubHealthy ? 'healthy' : 'unhealthy',
        mistral: mistralHealthy ? 'healthy' : 'unhealthy',
      },
      bot: {
        name: config.bot.name,
        prefix: config.bot.prefix,
        allowedRepos: config.bot.allowedRepos,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Route d'information
app.get('/', (req, res) => {
  res.json({
    name: config.bot.name,
    version: '1.0.0',
    description: 'GitHub Bot powered by Mistral AI for the poker_tool repository',
    endpoints: {
      webhook: '/webhook',
      health: '/health',
    },
    commands: {
      fix: 'Analyse et propose une correction',
      explain: 'Explique un concept ou un code',
      review: 'Fait une revue de code complète',
      suggest: 'Propose des améliorations',
      docs: 'Génère de la documentation',
      help: 'Affiche l\'aide',
    },
    usage: `Mentionnez le bot avec "${config.bot.prefix} <command>" dans un commentaire d'issue ou de PR.`,
  });
});

// ===========================================
// Démarrage du serveur
// ===========================================

// Initialisation des clients au démarrage
initClients().then(() => {
  // Démarrage du serveur
  app.listen(config.server.port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    ${config.bot.name} v1.0.0                    ║
║          GitHub Bot powered by Mistral AI                   ║
╠════════════════════════════════════════════════════════════╣
║  Serveur démarré sur : http://localhost:${config.server.port}    ║
║  Webhook URL : ${config.server.baseUrl}/webhook                ║
║  Health Check : ${config.server.baseUrl}/health                 ║
╠════════════════════════════════════════════════════════════╣
║  Dépôts autorisés : ${config.bot.allowedRepos.join(', ') || 'Tous'} ║
║  Préfixe : ${config.bot.prefix}                                        ║
║  Modèle Mistral : ${config.mistral.model}                              ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur non gérée :', err);
  res.status(500).json({
    error: 'Une erreur interne est survenue',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

module.exports = app;
