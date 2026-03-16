/**
 * Deck - Card deck management
 * Handles shuffling, drawing, and discard pile
 */

import Card from './Card.js';
import EventBus from '../core/EventBus.js';

class Deck {
  /**
   * Create a new deck
   * @param {string[]} cardIds - Array of card IDs to initialize the deck
   */
  constructor(cardIds = []) {
    this.cards = []; // Array of Card objects
    this.discardPile = []; // Array of discarded Card objects

    this.initialize(cardIds);
  }

  /**
   * Initialize deck with card IDs
   * @param {string[]} cardIds - Array of card IDs
   */
  initialize(cardIds) {
    this.cards = [];
    this.discardPile = [];

    // Create Card objects from IDs
    cardIds.forEach(cardId => {
      try {
        const card = new Card(cardId);
        this.cards.push(card);
      } catch (error) {
        console.error(`Failed to create card with ID ${cardId}:`, error);
      }
    });

    // Shuffle the deck
    this.shuffle();
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }

    // Emit shuffle event
    EventBus.emit('deckShuffled', {
      deckSize: this.cards.length
    });
  }

  /**
   * Draw a single card from the deck
   * @returns {Card|null} Drawn card or null if deck is empty
   */
  drawCard() {
    // If deck is empty, shuffle discard pile into deck
    if (this.cards.length === 0) {
      if (this.discardPile.length === 0) {
        return null; // No cards available
      }

      // Move discard pile to deck
      this.cards = this.discardPile.splice(0, this.discardPile.length);
      this.shuffle();

      // Emit reshuffle event
      EventBus.emit('deckReshuffled', {
        deckSize: this.cards.length
      });
    }

    const card = this.cards.pop();

    // Emit draw event
    EventBus.emit('cardDrawnFromDeck', {
      card: card
    });

    return card;
  }

  /**
   * Draw multiple cards
   * @param {number} count - Number of cards to draw
   * @returns {Card[]} Array of drawn cards
   */
  drawCards(count) {
    const drawnCards = [];

    for (let i = 0; i < count; i++) {
      const card = this.drawCard();
      if (card) {
        drawnCards.push(card);
      } else {
        break; // No more cards
      }
    }

    return drawnCards;
  }

  /**
   * Add a card to the deck
   * @param {string|Card} card - Card ID or Card object
   */
  addCard(card) {
    let cardToAdd;

    if (typeof card === 'string') {
      cardToAdd = new Card(card);
    } else if (card instanceof Card) {
      cardToAdd = card.clone();
    } else {
      console.error('Invalid card type:', card);
      return;
    }

    this.cards.push(cardToAdd);

    // Emit add event
    EventBus.emit('cardAddedToDeck', {
      card: cardToAdd
    });
  }

  /**
   * Remove a card from the deck by instance ID
   * @param {string} instanceId - Card instance ID
   * @returns {Card|null} Removed card or null if not found
   */
  removeCard(instanceId) {
    const index = this.cards.findIndex(card => card.instanceId === instanceId);

    if (index !== -1) {
      const card = this.cards.splice(index, 1)[0];

      // Emit remove event
      EventBus.emit('cardRemovedFromDeck', {
        card: card
      });

      return card;
    }

    return null;
  }

  /**
   * Discard a card to the discard pile
   * @param {Card} card - Card to discard
   */
  discardCard(card) {
    if (!card) return;

    this.discardPile.push(card);

    // Emit discard event
    EventBus.emit('cardDiscarded', {
      card: card
    });
  }

  /**
   * Discard multiple cards
   * @param {Card[]} cards - Array of cards to discard
   */
  discardCards(cards) {
    cards.forEach(card => {
      this.discardCard(card);
    });
  }

  /**
   * Reset by moving all discard pile cards back to deck
   */
  reset() {
    if (this.discardPile.length > 0) {
      this.cards = this.cards.concat(this.discardPile);
      this.discardPile = [];
      this.shuffle();
    }

    // Emit reset event
    EventBus.emit('deckReset', {
      deckSize: this.cards.length
    });
  }

  /**
   * Get current deck size
   * @returns {number} Number of cards in deck
   */
  getDeckSize() {
    return this.cards.length;
  }

  /**
   * Get discard pile size
   * @returns {number} Number of cards in discard pile
   */
  getDiscardSize() {
    return this.discardPile.length;
  }

  /**
   * Get total number of cards (deck + discard)
   * @returns {number} Total cards
   */
  getTotalSize() {
    return this.cards.length + this.discardPile.length;
  }

  /**
   * Check if deck is empty
   * @returns {boolean} True if deck is empty
   */
  isEmpty() {
    return this.cards.length === 0;
  }

  /**
   * Get all cards in deck (for debugging)
   * @returns {Object[]} Array of card data
   */
  getDeckCards() {
    return this.cards.map(card => card.toJSON());
  }

  /**
   * Get all cards in discard pile (for debugging)
   * @returns {Object[]} Array of card data
   */
  getDiscardPileCards() {
    return this.discardPile.map(card => card.toJSON());
  }
}

export default Deck;
