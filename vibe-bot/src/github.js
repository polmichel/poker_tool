/**
 * Module pour interagir avec l'API GitHub
 * Gère l'authentification, les webhooks et les actions sur les issues/PRs
 */

const { Octokit } = require('@octokit/core');
const { createAppAuth } = require('@octokit/auth-app');
const config = require('./config');

class GitHubClient {
  constructor() {
    this.appOctokit = null;
    this.installationOctokit = {}; // Cache des clients par installation
  }

  /**
   * Initialise le client Octokit pour l'application GitHub
   */
  async initAppClient() {
    if (this.appOctokit) {
      return this.appOctokit;
    }

    try {
      const auth = createAppAuth({
        appId: config.github.appId,
        privateKey: config.github.privateKey,
        installationId: null, // Pas d'installation pour le client app
      });

      this.appOctokit = new Octokit({
        authStrategy: auth,
        auth: {
          appId: config.github.appId,
          privateKey: config.github.privateKey,
        },
      });

      return this.appOctokit;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du client GitHub App :', error.message);
      throw new Error(`Impossible d'initialiser le client GitHub : ${error.message}`);
    }
  }

  /**
   * Obtient un client Octokit pour une installation spécifique
   * @param {number} installationId - L'ID de l'installation
   * @returns {Promise<Octokit>} - Le client Octokit
   */
  async getInstallationClient(installationId) {
    if (this.installationOctokit[installationId]) {
      return this.installationOctokit[installationId];
    }

    try {
      const auth = createAppAuth({
        appId: config.github.appId,
        privateKey: config.github.privateKey,
        installationId: installationId,
      });

      const octokit = new Octokit({
        authStrategy: auth,
        auth: {
          appId: config.github.appId,
          privateKey: config.github.privateKey,
          installationId: installationId,
        },
      });

      this.installationOctokit[installationId] = octokit;
      return octokit;
    } catch (error) {
      console.error(`❌ Erreur lors de l'obtention du client pour l'installation ${installationId} :`, error.message);
      throw new Error(`Impossible d'obtenir le client pour l'installation ${installationId} : ${error.message}`);
    }
  }

  /**
   * Vérifie si le dépôt est autorisé
   * @param {string} repoFullName - Le nom complet du dépôt (ex: polmichel/poker_tool)
   * @returns {boolean} - True si le dépôt est autorisé
   */
  isRepoAllowed(repoFullName) {
    if (config.bot.allowedRepos.length === 0) {
      return true; // Aucun filtre = tous les dépôts autorisés
    }
    return config.bot.allowedRepos.includes(repoFullName);
  }

  /**
   * Vérifie si l'utilisateur est autorisé
   * @param {string} username - Le nom d'utilisateur GitHub
   * @returns {boolean} - True si l'utilisateur est autorisé
   */
  isUserAllowed(username) {
    if (config.bot.allowedUsers.length === 0) {
      return true; // Aucun filtre = tous les utilisateurs autorisés
    }
    return config.bot.allowedUsers.includes(username);
  }

  /**
   * Extrait la commande et le contexte d'un commentaire
   * @param {string} commentBody - Le corps du commentaire
   * @returns {Object} - { command: string, context: string, isCommand: boolean }
   */
  extractCommand(commentBody) {
    const prefix = config.bot.prefix;
    const commandPattern = new RegExp(`^${prefix}\\s*(\\w+)(?:\\s+(.*))?$`, 'i');
    const mentionPattern = new RegExp(`@${config.bot.name.replace(/\\s+/g, '')}\\s*(\\w+)(?:\\s+(.*))?$`, 'i');

    // Vérifie le préfixe configuré (ex: @vibe)
    const prefixMatch = commentBody.match(commandPattern);
    if (prefixMatch) {
      return {
        command: prefixMatch[1].toLowerCase(),
        context: prefixMatch[2] || '',
        isCommand: true,
      };
    }

    // Vérifie la mention du nom du bot (ex: @Vibe Bot)
    const mentionMatch = commentBody.match(mentionPattern);
    if (mentionMatch) {
      return {
        command: mentionMatch[1].toLowerCase(),
        context: mentionMatch[2] || '',
        isCommand: true,
      };
    }

    // Vérifie si le commentaire contient le préfixe quelque part
    const containsPrefix = commentBody.includes(prefix);
    const containsMention = commentBody.includes(`@${config.bot.name.replace(/\s+/g, '')}`);

    if (containsPrefix || containsMention) {
      // Extraire la commande après le préfixe/mention
      const parts = commentBody.split(prefix)[1] || commentBody.split(`@${config.bot.name.replace(/\s+/g, '')}`)[1] || '';
      const commandMatch = parts.match(/^\\s*(\\w+)/i);
      
      if (commandMatch) {
        return {
          command: commandMatch[1].toLowerCase(),
          context: parts.substring(commandMatch[0].length).trim(),
          isCommand: true,
        };
      }

      // Si pas de commande explicite, considérer tout le texte comme contexte
      return {
        command: 'default',
        context: commentBody.trim(),
        isCommand: true,
      };
    }

    // Pas de commande détectée
    return {
      command: '',
      context: commentBody.trim(),
      isCommand: false,
    };
  }

  /**
   * Poste un commentaire sur une issue ou une PR
   * @param {Object} params - Paramètres pour le commentaire
   * @param {number} installationId - L'ID de l'installation
   * @param {string} owner - Le propriétaire du dépôt
   * @param {string} repo - Le nom du dépôt
   * @param {number} issueNumber - Le numéro de l'issue ou de la PR
   * @param {string} body - Le corps du commentaire
   * @param {boolean} isPr - True si c'est une PR
   * @returns {Promise<Object>} - La réponse de l'API GitHub
   */
  async postComment({
    installationId,
    owner,
    repo,
    issueNumber,
    body,
    isPr = false,
  }) {
    try {
      const octokit = await this.getInstallationClient(installationId);
      
      if (isPr) {
        return await octokit.request(
          `POST /repos/${owner}/${repo}/pulls/${issueNumber}/comments`,
          {
            owner,
            repo,
            pull_number: issueNumber,
            body,
          }
        );
      } else {
        return await octokit.request(
          `POST /repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          {
            owner,
            repo,
            issue_number: issueNumber,
            body,
          }
        );
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi du commentaire sur ${owner}/${repo}#${issueNumber} :`, error.message);
      throw new Error(`Impossible de poster le commentaire : ${error.message}`);
    }
  }

  /**
   * Récupère les détails d'une issue ou d'une PR
   * @param {Object} params - Paramètres pour la requête
   * @param {number} installationId - L'ID de l'installation
   * @param {string} owner - Le propriétaire du dépôt
   * @param {string} repo - Le nom du dépôt
   * @param {number} issueNumber - Le numéro de l'issue ou de la PR
   * @param {boolean} isPr - True si c'est une PR
   * @returns {Promise<Object>} - Les détails de l'issue ou de la PR
   */
  async getIssueOrPRDetails({
    installationId,
    owner,
    repo,
    issueNumber,
    isPr = false,
  }) {
    try {
      const octokit = await this.getInstallationClient(installationId);
      
      if (isPr) {
        const response = await octokit.request(
          `GET /repos/${owner}/${repo}/pulls/${issueNumber}`
        );
        return { ...response.data, type: 'pr' };
      } else {
        const response = await octokit.request(
          `GET /repos/${owner}/${repo}/issues/${issueNumber}`
        );
        return { ...response.data, type: 'issue' };
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des détails de ${owner}/${repo}#${issueNumber} :`, error.message);
      throw new Error(`Impossible de récupérer les détails : ${error.message}`);
    }
  }

  /**
   * Récupère le contenu d'un fichier dans le dépôt
   * @param {Object} params - Paramètres pour la requête
   * @param {number} installationId - L'ID de l'installation
   * @param {string} owner - Le propriétaire du dépôt
   * @param {string} repo - Le nom du dépôt
   * @param {string} path - Le chemin du fichier
   * @param {string} ref - La référence (branche, tag, commit)
   * @returns {Promise<string>} - Le contenu du fichier
   */
  async getFileContent({
    installationId,
    owner,
    repo,
    path,
    ref = 'main',
  }) {
    try {
      const octokit = await this.getInstallationClient(installationId);
      
      const response = await octokit.request(
        `GET /repos/${owner}/${repo}/contents/${path}`,
        {
          owner,
          repo,
          path,
          ref,
        }
      );

      if (response.data.type === 'file') {
        return Buffer.from(response.data.content, 'base64').toString('utf8');
      }

      return null;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération du fichier ${path} :`, error.message);
      return null;
    }
  }

  /**
   * Vérifie si l'API GitHub est accessible
   * @returns {Promise<boolean>} - True si l'API est accessible
   */
  async checkHealth() {
    try {
      const octokit = await this.initAppClient();
      await octokit.request('GET /app');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'API GitHub :', error.message);
      return false;
    }
  }
}

module.exports = new GitHubClient();
