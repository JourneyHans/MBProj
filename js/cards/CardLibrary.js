/**
 * CardLibrary - Card definition library
 * Manages and provides access to card definitions
 */

import CARD_DEFINITIONS from '../data/cardDefinitions.js';

class CardLibrary {
  /**
   * Get card definition by ID
   * @param {string} cardId - Card ID
   * @returns {Object|null} Card definition or null if not found
   */
  static getDefinition(cardId) {
    return CARD_DEFINITIONS[cardId] || null;
  }

  /**
   * Get all card IDs
   * @returns {string[]} Array of all card IDs
   */
  static getAllCardIds() {
    return Object.keys(CARD_DEFINITIONS);
  }

  /**
   * Get all card definitions
   * @returns {Object} All card definitions
   */
  static getAllDefinitions() {
    return { ...CARD_DEFINITIONS };
  }

  /**
   * Get cards by type
   * @param {string} type - Card type ('scout', 'defense', 'utility')
   * @returns {Object[]} Array of card definitions
   */
  static getCardsByType(type) {
    const cards = [];
    for (const cardId in CARD_DEFINITIONS) {
      if (CARD_DEFINITIONS[cardId].type === type) {
        cards.push(CARD_DEFINITIONS[cardId]);
      }
    }
    return cards;
  }

  /**
   * Get cards by rarity
   * @param {string} rarity - Card rarity ('common', 'rare', 'epic', 'legendary')
   * @returns {Object[]} Array of card definitions
   */
  static getCardsByRarity(rarity) {
    const cards = [];
    for (const cardId in CARD_DEFINITIONS) {
      if (CARD_DEFINITIONS[cardId].rarity === rarity) {
        cards.push(CARD_DEFINITIONS[cardId]);
      }
    }
    return cards;
  }

  /**
   * Get cards by target type
   * @param {string} targetType - Target type ('none', 'single', 'area', 'self')
   * @returns {Object[]} Array of card definitions
   */
  static getCardsByTargetType(targetType) {
    const cards = [];
    for (const cardId in CARD_DEFINITIONS) {
      if (CARD_DEFINITIONS[cardId].targetType === targetType) {
        cards.push(CARD_DEFINITIONS[cardId]);
      }
    }
    return cards;
  }

  /**
   * Check if a card ID exists
   * @param {string} cardId - Card ID to check
   * @returns {boolean} True if card exists
   */
  static hasCard(cardId) {
    return cardId in CARD_DEFINITIONS;
  }

  /**
   * Get cards that cost less than or equal to maxEnergy
   * @param {number} maxEnergy - Maximum energy cost
   * @returns {Object[]} Array of card definitions
   */
  static getAffordableCards(maxEnergy) {
    const cards = [];
    for (const cardId in CARD_DEFINITIONS) {
      if (CARD_DEFINITIONS[cardId].energyCost <= maxEnergy) {
        cards.push(CARD_DEFINITIONS[cardId]);
      }
    }
    return cards;
  }

  /**
   * Get card statistics
   * @returns {Object} Statistics about all cards
   */
  static getStatistics() {
    const stats = {
      total: 0,
      byType: {},
      byRarity: {},
      byTargetType: {}
    };

    for (const cardId in CARD_DEFINITIONS) {
      const card = CARD_DEFINITIONS[cardId];
      stats.total++;

      // Count by type
      stats.byType[card.type] = (stats.byType[card.type] || 0) + 1;

      // Count by rarity
      stats.byRarity[card.rarity] = (stats.byRarity[card.rarity] || 0) + 1;

      // Count by target type
      stats.byTargetType[card.targetType] = (stats.byTargetType[card.targetType] || 0) + 1;
    }

    return stats;
  }
}

export default CardLibrary;
