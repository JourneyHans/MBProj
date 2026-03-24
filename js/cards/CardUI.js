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
    this.refreshButton = document.getElementById('hand-refresh-button');
    this.discardPileButton = document.getElementById('discard-pile-button');
    this.discardPileCount = document.getElementById('discard-pile-count');
    this.drawPileCount = document.getElementById('draw-pile-count');
    this.discardPileModal = document.getElementById('discard-pile-modal');
    this.discardPileList = document.getElementById('discard-pile-list');
    this.discardPileClose = document.getElementById('discard-pile-close');

    // Setup event listeners
    this.setupEventListeners();
    this.setupCancelButton();
    this.setupRefreshButton();
    this.setupPileInteractions();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    EventBus.on('handUpdated', (data) => {
      this.render();
      this.updateRefreshButtonState();
      this.updatePileIndicators();
    });

    EventBus.on('cardSelected', (data) => {
      this.highlightCard(data.card.instanceId);
    });

    EventBus.on('allCardsDeselected', () => {
      this.clearHighlights();
    });

    EventBus.on('energyChanged', (data) => {
      this.updateEnergyIndicator(data.current, data.max);
      this.updateRefreshButtonState();
    });

    EventBus.on('targetingModeStarted', (data) => {
      this.showTargetingMode(data.card);
      this.updateRefreshButtonState();
    });

    EventBus.on('targetingModeEnded', () => {
      this.hideTargetingMode();
      this.updateRefreshButtonState();
    });

    EventBus.on('cardDiscarded', () => this.updatePileIndicators());
    EventBus.on('cardDrawnFromDeck', () => this.updatePileIndicators());
    EventBus.on('deckReshuffled', () => this.updatePileIndicators());
    EventBus.on('deckShuffled', () => this.updatePileIndicators());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isDiscardPileModalOpen()) {
          this.closeDiscardPileModal();
          return;
        }
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
   * Setup hand refresh button interaction
   */
  setupRefreshButton() {
    if (!this.refreshButton) return;
    this.refreshButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onHandRefreshClick();
    });
    this.updateRefreshButtonState();
  }

  /**
   * Setup discard/draw pile interaction.
   */
  setupPileInteractions() {
    if (this.discardPileButton) {
      this.discardPileButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openDiscardPileModal();
      });
    }

    if (this.discardPileClose) {
      this.discardPileClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeDiscardPileModal();
      });
    }

    if (this.discardPileModal) {
      this.discardPileModal.addEventListener('click', (e) => {
        if (e.target === this.discardPileModal) {
          this.closeDiscardPileModal();
        }
      });
    }

    this.updatePileIndicators();
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
    this.updateRefreshButtonState();
    this.updatePileIndicators();
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
      'attack': '输出',
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
    this.updateRefreshButtonState();
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
    this.updateRefreshButtonState();
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
   * Try to perform hand refresh action.
   */
  onHandRefreshClick() {
    if (!this.game || typeof this.game.performHandRefresh !== 'function') return;
    this.game.performHandRefresh();
    this.updateRefreshButtonState();
  }

  /**
   * Keep hand refresh button state in sync with game conditions.
   */
  updateRefreshButtonState() {
    if (!this.refreshButton || !this.game || typeof this.game.canUseHandRefresh !== 'function') return;

    const validation = this.game.canUseHandRefresh();
    this.refreshButton.disabled = !validation.allowed;
    this.refreshButton.title = validation.allowed ? '消耗能量，弃手并重抽' : (validation.reason || '当前无法重整');
  }

  /**
   * Update draw/discard pile counters.
   */
  updatePileIndicators() {
    if (!this.game || !this.game.deck) return;

    if (this.discardPileCount) {
      this.discardPileCount.textContent = String(this.game.deck.getDiscardSize());
    }

    if (this.drawPileCount) {
      this.drawPileCount.textContent = String(this.game.deck.getDeckSize());
    }

    if (this.isDiscardPileModalOpen()) {
      this.renderDiscardPileList();
    }
  }

  /**
   * Render current discarded cards into modal.
   */
  renderDiscardPileList() {
    if (!this.discardPileList || !this.game || !this.game.deck) return;
    const cards = this.game.deck.getDiscardPileCards();
    this.discardPileList.innerHTML = '';

    if (!cards || cards.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'discard-empty';
      emptyEl.textContent = '弃牌堆当前为空。';
      this.discardPileList.appendChild(emptyEl);
      return;
    }

    cards.forEach((card) => {
      const item = document.createElement('div');
      item.className = 'discard-card-item';

      const nameEl = document.createElement('div');
      nameEl.className = 'discard-card-name';
      nameEl.textContent = card.name || card.id;

      const metaEl = document.createElement('div');
      metaEl.className = 'discard-card-meta';
      metaEl.textContent = `${card.energyCost}⚡ · ${this.getTypeLabel(card.type)}`;

      item.appendChild(nameEl);
      item.appendChild(metaEl);
      this.discardPileList.appendChild(item);
    });
  }

  /**
   * Open discard pile modal.
   */
  openDiscardPileModal() {
    if (!this.discardPileModal) return;
    this.renderDiscardPileList();
    this.discardPileModal.style.display = 'flex';
  }

  /**
   * Close discard pile modal.
   */
  closeDiscardPileModal() {
    if (!this.discardPileModal) return;
    this.discardPileModal.style.display = 'none';
  }

  /**
   * Whether discard pile modal is currently visible.
   * @returns {boolean}
   */
  isDiscardPileModalOpen() {
    return Boolean(this.discardPileModal && this.discardPileModal.style.display !== 'none');
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
    EventBus.off('cardDiscarded');
    EventBus.off('cardDrawnFromDeck');
    EventBus.off('deckReshuffled');
    EventBus.off('deckShuffled');

    this.container.innerHTML = '';
    this.cardElements.clear();
  }
}

export default CardUI;
