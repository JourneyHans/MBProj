/**
 * CardUI - Card UI rendering and interaction
 * Handles rendering of cards and user interactions
 */

import EventBus from '../core/EventBus.js';

const UI_MESSAGES = {
  selectTarget: '请选择目标格子，或点击取消',
  confirmNoTarget: '再次点击该卡确认，或点击取消',
  notEnoughEnergy: (required, current) => `能量不足（需要 ${required}，当前 ${current}）`
};

class CardUI {
  /**
   * Create a new CardUI instance
   * @param {HTMLElement} containerElement - Container element for hand cards
   * @param {Game} game - Game instance
   */
  constructor(containerElement, game) {
    this.container = containerElement;
    this.game = game;
    this.cardElements = new Map(); // instanceId -> DOM element
    this.selectedCardId = null;
    this.targetingMode = false;
    this.confirmationCardId = null;
    this.cancelButton = document.getElementById('card-cancel-button');

    // Setup event listeners
    this.setupEventListeners();
    this.setupCancelButton();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    EventBus.on('handUpdated', (data) => {
      this.render();
    });

    EventBus.on('cardSelected', (data) => {
      this.highlightCard(data.card.instanceId);
    });

    EventBus.on('allCardsDeselected', () => {
      this.clearHighlights();
    });

    EventBus.on('energyChanged', (data) => {
      this.updateEnergyIndicator(data.current, data.max);
    });

    EventBus.on('targetingModeStarted', (data) => {
      this.showTargetingMode(data.card);
    });

    EventBus.on('targetingModeEnded', () => {
      this.hideTargetingMode();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.cancelCardSelection();
      }
    });
  }

  /**
   * Setup cancel button interaction
   */
  setupCancelButton() {
    if (!this.cancelButton) return;
    this.cancelButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.cancelCardSelection();
    });
  }

  /**
   * Render the hand
   */
  render() {
    if (!this.game.hand) return;

    const cards = this.game.hand.getAllCards();

    // Clear existing cards
    this.container.innerHTML = '';
    this.cardElements.clear();

    // Render each card
    cards.forEach(card => {
      const cardElement = this.createCardElement(card);
      this.container.appendChild(cardElement);
      this.cardElements.set(card.instanceId, cardElement);
    });

    // Update energy indicator
    this.updateEnergyIndicator(this.game.energy, this.game.maxEnergy);
  }

  /**
   * Create a card DOM element
   * @param {Card} card - Card to create element for
   * @returns {HTMLElement} Card element
   */
  createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.dataset.instanceId = card.instanceId;
    cardEl.dataset.cardId = card.id;

    // Set rarity class
    if (card.rarity) {
      cardEl.classList.add(`card-${card.rarity}`);
    }

    // Check if playable
    const canPlay = this.game.hand.canPlayCard(card, this.game.energy);
    if (!canPlay) {
      cardEl.classList.add('card-unplayable');
    }

    // Card pending confirmation (for no-target cards)
    if (this.confirmationCardId && this.confirmationCardId === card.instanceId) {
      cardEl.classList.add('card-confirm');
    }

    // Card content
    cardEl.innerHTML = `
      <div class="card-header">
        <span class="card-energy">${card.energyCost}⚡</span>
        <span class="card-type">${this.getTypeLabel(card.type)}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${card.name}</div>
        <div class="card-description">${card.description}</div>
      </div>
    `;

    // Click event
    cardEl.addEventListener('click', (e) => {
      // Prevent card clicks from triggering any underlying interactions.
      e.preventDefault();
      e.stopPropagation();
      this.onCardClick(card);
    });

    // Hover effects
    cardEl.addEventListener('mouseenter', () => {
      this.onCardHover(card);
    });

    cardEl.addEventListener('mouseleave', () => {
      this.onCardLeave(card);
    });

    return cardEl;
  }

  /**
   * Get type label in Chinese
   * @param {string} type - Card type
   * @returns {string} Type label
   */
  getTypeLabel(type) {
    const labels = {
      'scout': '侦察',
      'defense': '防御',
      'utility': '功能'
    };
    return labels[type] || type;
  }

  /**
   * Handle card click
   * @param {Card} card - Clicked card
   */
  onCardClick(card) {
    // Check if card is playable
    const canPlay = this.game.hand.canPlayCard(card, this.game.energy);

    if (!canPlay) {
      this.showNotEnoughEnergy(card);
      return;
    }

    // Select the card
    this.game.hand.selectCard(card.instanceId);

    // Notify game to start targeting mode
    if (this.game.onCardSelected && typeof this.game.onCardSelected === 'function') {
      this.game.onCardSelected(card);
    }
  }

  /**
   * Handle card hover
   * @param {Card} card - Hovered card
   */
  onCardHover(card) {
    // Could show tooltip or highlight related grid cells
    EventBus.emit('cardHovered', { card });
  }

  /**
   * Handle card leave
   * @param {Card} card - Card being left
   */
  onCardLeave(card) {
    EventBus.emit('cardLeft', { card });
  }

  /**
   * Highlight a card
   * @param {string} instanceId - Card instance ID
   */
  highlightCard(instanceId) {
    this.clearHighlights();

    const cardEl = this.cardElements.get(instanceId);
    if (cardEl) {
      cardEl.classList.add('card-selected');
      this.selectedCardId = instanceId;
    }
  }

  /**
   * Clear all card highlights
   */
  clearHighlights() {
    this.cardElements.forEach(el => {
      el.classList.remove('card-selected');
    });
    this.selectedCardId = null;
  }

  /**
   * Show targeting mode
   * @param {Card} card - Selected card
   */
  showTargetingMode(card) {
    this.confirmationCardId = null;
    this.targetingMode = true;

    // Show targeting indicator
    const container = document.getElementById('hand-container');
    if (container) {
      container.classList.add('targeting-mode');
    }

    // Show targeting message
    this.showMessage(`${UI_MESSAGES.selectTarget}: ${card.name}`);
    this.showCancelButton();

    // Change cursor
    if (this.game.canvas) {
      this.game.canvas.style.cursor = 'crosshair';
    }
  }

  /**
   * Hide targeting mode
   */
  hideTargetingMode() {
    this.targetingMode = false;

    // Hide targeting indicator
    const container = document.getElementById('hand-container');
    if (container) {
      container.classList.remove('targeting-mode');
    }

    // Hide targeting message
    this.hideMessage();
    this.hideCancelButton();

    // Reset cursor
    if (this.game.canvas) {
      this.game.canvas.style.cursor = 'pointer';
    }

    // Clear card selection
    this.clearHighlights();
  }

  /**
   * Show confirmation mode for no-target cards
   * @param {Card} card - Card waiting for second-click confirmation
   */
  showConfirmationMode(card) {
    this.targetingMode = false;
    this.confirmationCardId = card.instanceId;
    this.highlightCard(card.instanceId);

    this.showMessage(`${UI_MESSAGES.confirmNoTarget}: ${card.name}`);
    this.showCancelButton();

    this.render();
    this.highlightCard(card.instanceId);
  }

  /**
   * Hide confirmation mode
   */
  hideConfirmationMode() {
    if (!this.confirmationCardId) return;
    this.confirmationCardId = null;

    this.hideMessage();
    this.hideCancelButton();

    this.render();
  }

  /**
   * Update energy indicator
   * @param {number} current - Current energy
   * @param {number} max - Maximum energy
   */
  updateEnergyIndicator(current, max) {
    const energyEl = document.getElementById('energy-current');
    const energyOrbs = document.getElementById('energy-orbs');

    if (energyEl) {
      energyEl.textContent = `${current}/${max}`;
    }

    if (energyOrbs) {
      energyOrbs.innerHTML = '';
      for (let i = 0; i < max; i++) {
        const orb = document.createElement('div');
        orb.className = `energy-orb ${i < current ? 'active' : ''}`;
        energyOrbs.appendChild(orb);
      }
    }

    // Update card playability
    this.cardElements.forEach((el, instanceId) => {
      const card = this.game.hand.getCard(instanceId);
      if (card) {
        const canPlay = this.game.hand.canPlayCard(card, current);
        if (canPlay) {
          el.classList.remove('card-unplayable');
        } else {
          el.classList.add('card-unplayable');
        }
      }
    });
  }

  /**
   * Show "not enough energy" message
   */
  showNotEnoughEnergy(card) {
    const required = card ? card.energyCost : 0;
    const current = this.game ? this.game.energy : 0;
    this.showMessage(UI_MESSAGES.notEnoughEnergy(required, current), 'error', 1500);
  }

  /**
   * Show card related message in hand area
   * @param {string} text - Message text
   * @param {string} type - normal|error
   * @param {number|null} duration - Auto hide duration
   */
  showMessage(text, type = 'normal', duration = null) {
    const messageEl = document.getElementById('targeting-message');
    if (!messageEl) return;

    messageEl.textContent = text;
    messageEl.style.display = 'block';
    messageEl.classList.toggle('error', type === 'error');

    if (duration) {
      setTimeout(() => {
        this.hideMessage();
      }, duration);
    }
  }

  /**
   * Hide card related message in hand area
   */
  hideMessage() {
    const messageEl = document.getElementById('targeting-message');
    if (!messageEl) return;
    messageEl.style.display = 'none';
    messageEl.classList.remove('error');
  }

  /**
   * Show dedicated cancel button
   */
  showCancelButton() {
    if (!this.cancelButton) return;
    this.cancelButton.style.display = 'inline-flex';
  }

  /**
   * Hide dedicated cancel button
   */
  hideCancelButton() {
    if (!this.cancelButton) return;
    this.cancelButton.style.display = 'none';
  }

  /**
   * Cancel card selection
   */
  cancelCardSelection() {
    if (this.targetingMode || this.confirmationCardId) {
      if (this.game && typeof this.game.cancelCardInteraction === 'function') {
        this.game.cancelCardInteraction();
      } else if (this.game && this.game.hand) {
        this.game.hand.deselectAll();
      }
    }
  }

  /**
   * Animate card being played
   * @param {Card} card - Card being played
   */
  animateCardPlay(card) {
    const cardEl = this.cardElements.get(card.instanceId);
    if (cardEl) {
      cardEl.classList.add('card-playing');
      setTimeout(() => {
        cardEl.remove();
        this.cardElements.delete(card.instanceId);
      }, 300);
    }
  }

  /**
   * Animate card being drawn
   * @param {Card} card - Drawn card
   */
  animateCardDraw(card) {
    const cardEl = this.cardElements.get(card.instanceId);
    if (cardEl) {
      cardEl.classList.add('card-drawing');
      setTimeout(() => {
        cardEl.classList.remove('card-drawing');
      }, 300);
    }
  }

  /**
   * Destroy the UI
   */
  destroy() {
    EventBus.off('handUpdated');
    EventBus.off('cardSelected');
    EventBus.off('allCardsDeselected');
    EventBus.off('energyChanged');
    EventBus.off('targetingModeStarted');
    EventBus.off('targetingModeEnded');

    this.container.innerHTML = '';
    this.cardElements.clear();
  }
}

export default CardUI;
