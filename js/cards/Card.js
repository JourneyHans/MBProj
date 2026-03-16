/**
 * Card - Card class for the card system
 * Represents a single card in the game
 */

import CardLibrary from './CardLibrary.js';

class Card {
  /**
   * Create a new Card instance
   * @param {string} cardId - The ID of the card type
   * @param {string|null} instanceId - Unique instance ID (auto-generated if null)
   */
  constructor(cardId, instanceId = null) {
    this.id = cardId;
    this.instanceId = instanceId || this.generateInstanceId();

    // Get card definition from library
    this.definition = CardLibrary.getDefinition(cardId);

    if (!this.definition) {
      throw new Error(`Card definition not found for: ${cardId}`);
    }

    // Card properties from definition
    this.name = this.definition.name;
    this.description = this.definition.description;
    this.energyCost = this.definition.energyCost;
    this.type = this.definition.type; // 'scout', 'defense', 'utility'
    this.targetType = this.definition.targetType; // 'none', 'single', 'area', 'self'
    this.effect = this.definition.effect;
    this.rarity = this.definition.rarity || 'common';

    // UI state
    this.selected = false;
  }

  /**
   * Generate a unique instance ID for this card
   * @returns {string} Unique instance ID
   */
  generateInstanceId() {
    return `${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if this card can be played with given energy and game state
   * @param {number} playerEnergy - Current player energy
   * @param {Object} gameState - Current game state
   * @returns {boolean} True if card can be played
   */
  canPlay(playerEnergy, gameState) {
    // Check energy
    if (playerEnergy < this.energyCost) {
      return false;
    }

    // Check if we need a target
    if (this.targetType !== 'none' && !gameState.selectedTarget) {
      return false;
    }

    return true;
  }

  /**
   * Play this card on a target
   * @param {Object|null} target - Target object (Cell, Player, etc.)
   * @param {Object} gameState - Current game state
   * @returns {Object} Result object with success and data
   */
  play(target, gameState) {
    console.log(`[Card] Playing ${this.id} on target:`, target);

    if (!this.effect || typeof this.effect !== 'function') {
      console.error(`[Card] Effect not defined for ${this.id}`);
      return {
        success: false,
        reason: 'Card effect not defined'
      };
    }

    try {
      const result = this.effect(target, gameState);
      console.log(`[Card] Effect result:`, result);
      return result;
    } catch (error) {
      console.error(`[Card] Error executing card effect for ${this.id}:`, error);
      console.error('[Card] Error stack:', error.stack);
      return {
        success: false,
        reason: `Effect execution failed: ${error.message}`
      };
    }
  }

  /**
   * Create a copy of this card
   * @returns {Card} New card instance with same type
   */
  clone() {
    return new Card(this.id);
  }

  /**
   * Get card info as a plain object
   * @returns {Object} Card data
   */
  toJSON() {
    return {
      id: this.id,
      instanceId: this.instanceId,
      name: this.name,
      description: this.description,
      energyCost: this.energyCost,
      type: this.type,
      targetType: this.targetType,
      rarity: this.rarity
    };
  }

  /**
   * String representation
   * @returns {string} Card name and cost
   */
  toString() {
    return `${this.name} (${this.energyCost} ⚡)`;
  }
}

export default Card;
