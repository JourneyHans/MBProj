/**
 * Hand - Hand management
 * Manages the player's hand of cards
 */

import EventBus from '../core/EventBus.js';

class Hand {
  /**
   * Create a new hand
   * @param {number} maxSize - Maximum hand size (default: 5)
   */
  constructor(maxSize = 5) {
    this.cards = []; // Array of Card objects
    this.maxSize = maxSize;
  }

  /**
   * Add a card to hand
   * @param {Card} card - Card to add
   * @returns {boolean} True if card was added, false if hand is full
   */
  addCard(card) {
    if (this.isFull()) {
      console.warn('Hand is full, cannot add card');
      return false;
    }

    this.cards.push(card);

    // Emit card added event
    EventBus.emit('cardAddedToHand', {
      card: card,
      handSize: this.cards.length
    });

    return true;
  }

  /**
   * Remove a card from hand by instance ID
   * @param {string} instanceId - Card instance ID
   * @returns {Card|null} Removed card or null if not found
   */
  removeCard(instanceId) {
    const index = this.cards.findIndex(card => card.instanceId === instanceId);

    if (index !== -1) {
      const card = this.cards.splice(index, 1)[0];

      // Deselect card if it was selected
      if (card.selected) {
        card.selected = false;
      }

      // Emit card removed event
      EventBus.emit('cardRemovedFromHand', {
        card: card,
        handSize: this.cards.length
      });

      return card;
    }

    return null;
  }

  /**
   * Get a card by instance ID
   * @param {string} instanceId - Card instance ID
   * @returns {Card|null} Card or null if not found
   */
  getCard(instanceId) {
    return this.cards.find(card => card.instanceId === instanceId) || null;
  }

  /**
   * Select a card in hand
   * @param {string} instanceId - Card instance ID
   * @returns {Card|null} Selected card or null if not found
   */
  selectCard(instanceId) {
    // Deselect all cards first
    this.deselectAll();

    const card = this.getCard(instanceId);
    if (card) {
      card.selected = true;

      // Emit card selected event
      EventBus.emit('cardSelected', {
        card: card
      });

      return card;
    }

    return null;
  }

  /**
   * Deselect all cards
   */
  deselectAll() {
    this.cards.forEach(card => {
      card.selected = false;
    });

    // Emit all cards deselected event
    EventBus.emit('allCardsDeselected', {});
  }

  /**
   * Get the currently selected card
   * @returns {Card|null} Selected card or null
   */
  getSelectedCard() {
    return this.cards.find(card => card.selected) || null;
  }

  /**
   * Check if a card can be played with given energy
   * @param {Card} card - Card to check
   * @param {number} energy - Current energy
   * @returns {boolean} True if card can be played
   */
  canPlayCard(card, energy) {
    if (!card) return false;
    return card.energyCost <= energy;
  }

  /**
   * Check if hand is full
   * @returns {boolean} True if hand is at max capacity
   */
  isFull() {
    return this.cards.length >= this.maxSize;
  }

  /**
   * Check if hand is empty
   * @returns {boolean} True if hand has no cards
   */
  isEmpty() {
    return this.cards.length === 0;
  }

  /**
   * Get all playable cards with given energy
   * @param {number} energy - Current energy
   * @returns {Card[]} Array of playable cards
   */
  getPlayableCards(energy) {
    return this.cards.filter(card => this.canPlayCard(card, energy));
  }

  /**
   * Get current hand size
   * @returns {number} Number of cards in hand
   */
  getHandSize() {
    return this.cards.length;
  }

  /**
   * Get maximum hand size
   * @returns {number} Maximum hand capacity
   */
  getMaxSize() {
    return this.maxSize;
  }

  /**
   * Clear all cards from hand
   */
  clear() {
    this.deselectAll();
    this.cards = [];

    // Emit hand cleared event
    EventBus.emit('handCleared', {});
  }

  /**
   * Get all cards in hand
   * @returns {Card[]} Array of all cards
   */
  getAllCards() {
    return [...this.cards];
  }

  /**
   * Get card data for all cards (for UI rendering)
   * @returns {Object[]} Array of card data
   */
  getCardsData() {
    return this.cards.map(card => card.toJSON());
  }

  /**
   * Sort hand by energy cost
   */
  sortByEnergy() {
    this.cards.sort((a, b) => a.energyCost - b.energyCost);

    // Emit hand sorted event
    EventBus.emit('handSorted', {
      sortBy: 'energy'
    });
  }

  /**
   * Sort hand by card type
   */
  sortByType() {
    const typeOrder = { 'scout': 0, 'defense': 1, 'utility': 2 };
    this.cards.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

    // Emit hand sorted event
    EventBus.emit('handSorted', {
      sortBy: 'type'
    });
  }
}

export default Hand;
