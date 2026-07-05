/**
 * Module pour interagir avec l'API Mistral AI
 * Gère les appels à l'API et le formatage des réponses
 */

const axios = require('axios');
const config = require('./config');

class MistralClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.mistral.baseUrl,
      timeout: config.mistral.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.mistral.apiKey}`,
      },
    });
  }

  /**
   * Génère une réponse à partir d'une prompt
   * @param {string} prompt - La prompt à envoyer à Mistral
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<string>} - La réponse générée
   */
  async generate(prompt, options = {}) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: config.mistral.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 0.9,
        ...options,
      });

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('Aucune réponse générée par Mistral');
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Erreur lors de l\'appel à l\'API Mistral :', error.message);
      
      if (error.response) {
        console.error('Réponse de l\'API :', error.response.data);
        console.error('Status :', error.response.status);
      }

      throw new Error(`Impossible de générer une réponse : ${error.message}`);
    }
  }

  /**
   * Génère une réponse pour une commande spécifique
   * @param {string} command - La commande (ex: 'fix', 'explain', 'review')
   * @param {string} context - Le contexte (code, description de l'issue, etc.)
   * @param {Object} metadata - Métadonnées supplémentaires (repo, issue, etc.)
   * @returns {Promise<string>} - La réponse formatée
   */
  async generateCommandResponse(command, context, metadata = {}) {
    const { repo, issueNumber, prNumber, user } = metadata;
    
    // Construction de la prompt en fonction de la commande
    let prompt = this.buildPrompt(command, context, metadata);

    // Ajout du contexte du dépôt si disponible
    if (repo) {
      prompt += `\n\nContexte : Dépôt GitHub ${repo}`;
    }

    // Ajout du contexte de l'issue/PR si disponible
    if (issueNumber) {
      prompt += `, Issue #${issueNumber}`;
    } else if (prNumber) {
      prompt += `, Pull Request #${prNumber}`;
    }

    // Ajout de l'utilisateur si disponible
    if (user) {
      prompt += `, demandé par @${user}`;
    }

    // Instructions supplémentaires pour le format de la réponse
    prompt += `\n\nInstructions :`;
    prompt += `\n- Réponds en français si la demande est en français, sinon en anglais.`;
    prompt += `\n- Sois concis et direct.`;
    prompt += `\n- Utilise des blocs de code Markdown pour le code.`;
    prompt += `\n- Si tu suggères des modifications, explique brièvement pourquoi.`;
    prompt += `\n- Ne commence pas ta réponse par "Je suis un modèle de langage" ou similaire.`;

    try {
      const response = await this.generate(prompt, {
        temperature: 0.5, // Plus déterministe pour les commandes
        maxTokens: 3000,
      });

      return this.formatResponse(response, command);
    } catch (error) {
      console.error(`❌ Erreur lors de la génération de la réponse pour la commande "${command}" :`, error.message);
      return `Désolé, je n'ai pas pu générer de réponse pour cette demande. Veuillez réessayer plus tard.`;
    }
  }

  /**
   * Construit la prompt en fonction de la commande
   * @param {string} command - La commande
   * @param {string} context - Le contexte
   * @param {Object} metadata - Métadonnées
   * @returns {string} - La prompt complète
   */
  buildPrompt(command, context, metadata) {
    const commands = {
      fix: `Analyse le code ou le problème suivant et propose une correction détaillée. 
Si c'est du code, identifie les erreurs et suggère des fixes. 
Si c'est une description de bug, propose une solution.

Problème/Code :\n${context}`,

      explain: `Explique le code ou le concept suivant de manière claire et détaillée. 
Utilise des exemples si nécessaire.

À expliquer :\n${context}`,

      review: `Fais une revue de code complète du code suivant. 
Analyse :
- Les bonnes pratiques
- Les erreurs potentielles
- Les optimisations possibles
- La lisibilité et la maintenabilité

Code à revoir :\n${context}`,

      suggest: `Propose des améliorations pour le code ou la fonctionnalité suivante. 
Suggère :
- Des optimisations de performance
- Des améliorations de structure
- Des fonctionnalités supplémentaires utiles

Code/Fonctionnalité :\n${context}`,

      docs: `Génère de la documentation complète pour le code suivant. 
Inclus :
- Une description générale
- Les paramètres et leurs types
- Les valeurs de retour
- Des exemples d'utilisation

Code à documenter :\n${context}`,

      help: `Affiche l'aide pour utiliser ce bot. 
Liste toutes les commandes disponibles avec des exemples.`,

      default: `Réponds à la question ou au commentaire suivant de manière utile et détaillée.

Question/Commentaire :\n${context}`,
    };

    return commands[command] || commands.default;
  }

  /**
   * Formate la réponse en fonction de la commande
   * @param {string} response - La réponse brute
   * @param {string} command - La commande
   * @returns {string} - La réponse formatée
   */
  formatResponse(response, command) {
    // Nettoyage de la réponse
    let formattedResponse = response.trim();

    // Ajout d'un préfixe en fonction de la commande
    const prefixes = {
      fix: '🔧 **Correction proposée :**\n\n',
      explain: '📚 **Explication :**\n\n',
      review: '🔍 **Revue de code :**\n\n',
      suggest: '💡 **Suggestions d\'amélioration :**\n\n',
      docs: '📖 **Documentation :**\n\n',
      help: '❓ **Aide :**\n\n',
      default: '',
    };

    const prefix = prefixes[command] || prefixes.default;
    formattedResponse = prefix + formattedResponse;

    // Ajout d'un suffixe avec le nom du bot
    formattedResponse += `\n\n---\n*Réponse générée par ${config.bot.name} (Mistral AI)*`;

    return formattedResponse;
  }

  /**
   * Vérifie si l'API Mistral est accessible
   * @returns {Promise<boolean>} - True si l'API est accessible
   */
  async checkHealth() {
    try {
      await this.client.get('/models');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'API Mistral :', error.message);
      return false;
    }
  }
}

module.exports = new MistralClient();
