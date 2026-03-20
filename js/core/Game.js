/**
 * Game - Main game controller
 * Coordinates all game systems and manages game lifecycle
 */

import CONFIG from '../config.js';
import StateManager from './StateManager.js';
import GameLoop from './GameLoop.js';
import EventBus from './EventBus.js';
import Grid from '../grid/Grid.js';
import GridRenderer from '../grid/GridRenderer.js';
import Deck from '../cards/Deck.js';
import Hand from '../cards/Hand.js';
import CardUI from '../cards/CardUI.js';

class Game {
  constructor() {
    // Core systems
    this.stateManager = new StateManager();
    this.gameLoop = new GameLoop(this);

    // Grid system
    this.grid = null;
    this.gridRenderer = null;

    // UI elements
    this.canvas = null;
    this.ctx = null;

    // Touch handling
    this.touchStartTime = 0;
    this.touchTimer = null;
    this.touchPosition = null;
    this.longPressDelay = 500; // 500ms for long press

    // Responsive canvas
    this.canvasScale = 1;
    this.baseCanvasSize = { width: 0, height: 0 };

    // Game state
    this.stats = {
      minesRemaining: 0,
      timeElapsed: 0,
      startTime: 0
    };

    // Card system
    this.deck = null;
    this.hand = null;
    this.cardUI = null;
    this.energy = CONFIG.player.startEnergy;
    this.maxEnergy = CONFIG.player.maxEnergy;
    this.selectedCard = null;
    this.targetingMode = false;
    this.pendingCardConfirmation = null;

    // Player state
    this.player = {
      extraLives: CONFIG.player.startExtraLives,
      gold: CONFIG.player.startGold
    };

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize the game
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  initialize(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Create grid renderer
    this.gridRenderer = new GridRenderer(canvas);

    // Setup input handlers
    this.setupInputHandlers();

    // Initialize card system
    this.initializeCardSystem();

    // Setup responsive canvas
    this.resizeCanvas();

    // Start game loop
    this.gameLoop.start();

    // Show menu
    this.showMenu();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Grid events
    EventBus.on('gridComplete', () => this.onGridComplete());
    EventBus.on('mineTripped', () => this.onMineTripped());
    EventBus.on('cellRevealed', (cell) => this.onCellRevealed(cell));
    EventBus.on('cellFlagged', (cell) => this.onCellFlagged(cell));

    // Card events
    EventBus.on('cardPlayed', (data) => this.onCardPlayed(data));
    EventBus.on('energyChanged', (data) => this.onEnergyChanged(data));
  }

  /**
   * Setup input handlers
   */
  setupInputHandlers() {
    // Mouse events
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });

    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Window resize for responsive canvas
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Handle click on canvas
   * @param {MouseEvent} e - Mouse event
   */
  handleClick(e) {
    if (!this.stateManager.canInteract()) return;

    const rect = this.canvas.getBoundingClientRect();

    // Convert screen coordinates to canvas coordinates, accounting for CSS scaling
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    const cellPos = this.gridRenderer.getCellFromCoords(x, y);
    if (cellPos) {
      // If in targeting mode, handle target selection
      if (this.targetingMode) {
        const cell = this.grid.getCell(cellPos.row, cellPos.col);
        this.onTargetSelected(cell);
      } else {
        this.handleCellLeftClick(cellPos.row, cellPos.col);
      }
    }
  }

  /**
   * Handle right click on canvas
   * @param {MouseEvent} e - Mouse event
   */
  handleRightClick(e) {
    e.preventDefault();

    if (!this.stateManager.canInteract()) return;

    const rect = this.canvas.getBoundingClientRect();

    // Convert screen coordinates to canvas coordinates, accounting for CSS scaling
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    const cellPos = this.gridRenderer.getCellFromCoords(x, y);
    if (cellPos) {
      this.handleCellRightClick(cellPos.row, cellPos.col);
    }
  }

  /**
   * Handle left click on cell
   * @param {number} row - Row index
   * @param {number} col - Column index
   */
  handleCellLeftClick(row, col) {
    if (!this.grid) return;

    // First click initialization
    if (!this.grid.initialized) {
      this.grid.initialize({ row, col });
      this.stats.startTime = Date.now();
    }

    const safe = this.grid.revealCell(row, col);

    if (!safe) {
      if (this.player.extraLives > 0) {
        this.player.extraLives--;
        const cell = this.grid.getCell(row, col);
        if (cell) {
          cell.protected = true;
          this.gridRenderer.markDirty(cell);
        }
        this.showToast('额外生命救了你！');
        this.updateHUD();
      } else {
        this.gameOver();
      }
    }
  }

  /**
   * Handle right click on cell
   * @param {number} row - Row index
   * @param {number} col - Column index
   */
  handleCellRightClick(row, col) {
    if (!this.grid) return;

    this.grid.flagCell(row, col);
    this.updateHUD();
  }

  /**
   * Start a new game
   */
  startNewGame() {
    const rows = CONFIG.grid.defaultRows;
    const cols = CONFIG.grid.defaultCols;
    const totalCells = rows * cols;
    const mineCount = Math.floor(totalCells * CONFIG.mines.defaultDensity);

    this.grid = new Grid(rows, cols, mineCount);
    this.gridRenderer.setGrid(this.grid);

    this.stats.minesRemaining = mineCount;
    this.stats.timeElapsed = 0;
    this.stats.startTime = 0;

    // Reset card system
    this.energy = CONFIG.player.startEnergy;
    this.player.extraLives = CONFIG.player.startExtraLives;
    this.player.gold = CONFIG.player.startGold;

    // Reset deck and hand
    const startingDeck = [
      'scout', 'scout', 'scout',
      'mine_detector', 'mine_detector',
      'shield', 'shield',
      'extra_life',
      'energy_restore', 'energy_restore'
    ];
    this.deck.initialize(startingDeck);
    this.hand.clear();

    // Draw initial hand
    this.drawCards(CONFIG.player.cardsPerTurn);

    this.updateHUD();
    this.resizeCanvas(); // Resize canvas for new grid
    this.stateManager.transition(CONFIG.gameState.PLAYING);
  }

  /**
   * Show main menu
   */
  showMenu() {
    this.stateManager.transition(CONFIG.gameState.MENU);
  }

  /**
   * Game update loop
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    if (this.stateManager.isState(CONFIG.gameState.PLAYING) && this.grid && this.grid.initialized) {
      this.stats.timeElapsed = Date.now() - this.stats.startTime;
    }
  }

  /**
   * Game render loop
   * @param {number} currentTime - Current timestamp
   */
  render(currentTime) {
    if (!this.gridRenderer) return;

    this.gridRenderer.render();
  }

  /**
   * Handle grid complete event
   */
  onGridComplete() {
    this.victory();
  }

  /**
   * Handle mine tripped event — actual reveal is deferred to gameOver()
   * so that extraLives can prevent full mine reveal.
   */
  onMineTripped() {
  }

  /**
   * Handle cell revealed event
   * @param {Cell} cell - Revealed cell
   */
  onCellRevealed(cell) {
    if (this.gridRenderer) {
      this.gridRenderer.markDirty(cell);
    }
  }

  /**
   * Handle cell flagged event
   * @param {Cell} cell - Flagged cell
   */
  onCellFlagged(cell) {
    if (this.gridRenderer) {
      this.gridRenderer.markDirty(cell);
    }
  }

  /**
   * Game over — reveal all mines before showing dialog
   */
  gameOver() {
    if (this.grid) {
      const cells = this.grid.getAllCells();
      for (let r = 0; r < this.grid.rows; r++) {
        for (let c = 0; c < this.grid.cols; c++) {
          if (cells[r][c].isMine) {
            cells[r][c].revealed = true;
            this.gridRenderer.markDirty(cells[r][c]);
          }
        }
      }
    }
    this.stateManager.transition(CONFIG.gameState.GAME_OVER);
    this.showGameOverDialog();
  }

  /**
   * Victory
   */
  victory() {
    this.stateManager.transition(CONFIG.gameState.VICTORY);
    this.showVictoryDialog();
  }

  /**
   * Update HUD
   */
  updateHUD() {
    if (this.grid) {
      const stats = this.grid.getStats();
      this.stats.minesRemaining = stats.mineCount - stats.flaggedCount;
    }

    EventBus.emit('updateHUD', {
      minesRemaining: this.stats.minesRemaining,
      timeElapsed: this.stats.timeElapsed,
      extraLives: this.player.extraLives
    });
  }

  /**
   * Show game over dialog
   */
  showGameOverDialog() {
    EventBus.emit('showDialog', {
      title: 'Game Over',
      message: 'You hit a mine!',
      actions: [
        { label: 'Try Again', action: () => this.startNewGame() },
        { label: 'Menu', action: () => this.showMenu() }
      ]
    });
  }

  /**
   * Show victory dialog
   */
  showVictoryDialog() {
    const time = Math.floor(this.stats.timeElapsed / 1000);
    EventBus.emit('showDialog', {
      title: 'Victory!',
      message: `You cleared the grid in ${time} seconds!`,
      actions: [
        { label: 'Play Again', action: () => this.startNewGame() },
        { label: 'Menu', action: () => this.showMenu() }
      ]
    });
  }

  /**
   * Get current game state
   * @returns {string} Current state
   */
  getState() {
    return this.stateManager.getCurrentState();
  }

  // ========================================
  // CARD SYSTEM METHODS
  // ========================================

  /**
   * Initialize the card system
   */
  initializeCardSystem() {
    // Create starting deck with basic cards
    const startingDeck = [
      'scout', 'scout', 'scout',
      'mine_detector', 'mine_detector',
      'shield', 'shield',
      'extra_life',
      'energy_restore', 'energy_restore'
    ];

    this.deck = new Deck(startingDeck);
    this.hand = new Hand(CONFIG.cards.maxHandSize);

    // Initialize CardUI
    const handContainer = document.getElementById('hand-cards');
    this.cardUI = new CardUI(handContainer, this);

    // Draw initial hand
    this.drawCards(CONFIG.player.cardsPerTurn);

    // Emit initial energy event
    EventBus.emit('energyChanged', {
      current: this.energy,
      max: this.maxEnergy
    });
  }

  /**
   * Draw cards from deck
   * @param {number} count - Number of cards to draw
   */
  drawCards(count) {
    for (let i = 0; i < count; i++) {
      if (this.hand.isFull()) break;

      const card = this.deck.drawCard();
      if (card) {
        this.hand.addCard(card);
        EventBus.emit('cardDrawn', { card });
      }
    }

    EventBus.emit('handUpdated', { cards: this.hand.getAllCards() });
    this.cardUI.render();
  }

  /**
   * Handle card selection
   * @param {Card} card - Selected card
   */
  onCardSelected(card) {
    console.log('========== Card selected ==========');
    console.log('Card name:', card.name);
    console.log('Card energy cost:', card.energyCost);
    console.log('Current energy:', this.energy);
    console.log('Card targetType:', card.targetType);

    if (!this.hand.canPlayCard(card, this.energy)) {
      console.warn('Cannot play card: not enough energy');
      return;
    }

    if (card.targetType === 'none') {
      // No-target cards require explicit confirmation:
      // first click selects, second click on same card confirms play.
      if (this.targetingMode) {
        this.exitTargetingMode();
      }

      if (this.pendingCardConfirmation && this.pendingCardConfirmation.instanceId === card.instanceId) {
        console.log('Card confirmation received, playing card');
        this.clearCardConfirmation();
        this.playCard(card, null);
        return;
      }

      this.selectedCard = card;
      this.targetingMode = false;
      this.setCardConfirmation(card);
      return;
    }

    this.clearCardConfirmation();

    const wasTargeting = this.targetingMode;
    this.selectedCard = card;
    this.targetingMode = true;

    console.log('Set selectedCard and targetingMode');
    console.log('selectedCard:', this.selectedCard);
    console.log('targetingMode:', this.targetingMode);

    // Enter CARD_SELECTION only once; clicking another card while targeting
    // should only switch selected card instead of stacking duplicate states.
    if (!wasTargeting && this.stateManager.getCurrentState() !== CONFIG.gameState.CARD_SELECTION) {
      console.log('Entering targeting mode');
      this.stateManager.pushState(CONFIG.gameState.CARD_SELECTION);
    } else if (wasTargeting) {
      console.log('Switching targeting card without state transition');
    }

    EventBus.emit('targetingModeStarted', { card });
    if (this.cardUI && this.cardUI.showTargetingMode) {
      this.cardUI.showTargetingMode(card);
    }
  }

  /**
   * Handle target selection
   * @param {Object} cell - Target cell
   */
  onTargetSelected(cell) {
    if (!this.targetingMode) {
      return;
    }

    // Prefer the current selected card in hand to avoid stale selection state.
    const activeCard = this.hand ? this.hand.getSelectedCard() : null;
    const cardToPlay = activeCard || this.selectedCard;
    if (!cardToPlay) return;

    this.selectedCard = cardToPlay;
    this.playCard(cardToPlay, cell);
  }

  /**
   * Play a card
   * @param {Card} card - Card to play
   * @param {Object|null} target - Target object
   */
  playCard(card, target) {
    this.clearCardConfirmation();
    console.log('Playing card:', card.name, 'on target:', target);

    // Prepare game state for effect execution
    const gameState = {
      grid: this.grid,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      player: this.player
    };

    console.log('Game state:', gameState);

    // Execute card effect
    const result = card.play(target, gameState);

    console.log('Card play result:', result);

    if (result.success) {
      // Deduct energy cost
      this.energy -= card.energyCost;

      // Handle energy restore if the card effect returns new energy
      if (result.data && result.data.newEnergy !== undefined) {
        this.energy = result.data.newEnergy;
      }

      // Emit energy changed event
      EventBus.emit('energyChanged', {
        current: this.energy,
        max: this.maxEnergy
      });

      // Remove card from hand and add to discard
      this.hand.removeCard(card.instanceId);
      this.deck.discardCard(card);

      // Emit card played event
      EventBus.emit('cardPlayed', {
        card: card,
        target: target,
        result: result
      });

      // Handle highlighted cells from effects like mine_detector
      if (result.data && result.data.highlightedCells && result.data.highlightedCells.length > 0) {
        result.data.highlightedCells.forEach(c => this.gridRenderer.markDirty(c));
        this.scheduleHighlightCleanup(result.data.highlightedCells);
      }

      // Update HUD (lives, energy, etc.)
      this.updateHUD();

      // Update UI
      this.cardUI.render();

      // Force grid re-render to show changes
      this.render();
    } else {
      // Show error message
      console.error('Card play failed:', result.reason);
      alert(`卡牌使用失败: ${result.reason || '未知错误'}`);
    }

    // Always exit targeting mode
    if (this.targetingMode) {
      this.exitTargetingMode();
    }
  }

  /**
   * Exit targeting mode
   */
  exitTargetingMode() {
    this.targetingMode = false;
    this.selectedCard = null;
    this.clearCardConfirmation();

    // Keep hand selection in sync with game selection state.
    if (this.hand) {
      this.hand.deselectAll();
    }

    // Defensive unwind in case duplicate CARD_SELECTION states were pushed.
    let safetyCounter = 0;
    while (this.stateManager.getCurrentState() === CONFIG.gameState.CARD_SELECTION && safetyCounter < 10) {
      this.stateManager.popState();
      safetyCounter++;
    }

    EventBus.emit('targetingModeEnded', {});
    this.cardUI.hideTargetingMode();
  }

  /**
   * Set pending confirmation for no-target card play
   * @param {Card} card - Card awaiting confirmation
   */
  setCardConfirmation(card) {
    this.pendingCardConfirmation = card;
    if (this.cardUI && this.cardUI.showConfirmationMode) {
      this.cardUI.showConfirmationMode(card);
    }
  }

  /**
   * Clear pending card confirmation
   */
  clearCardConfirmation() {
    if (!this.pendingCardConfirmation) return;
    this.pendingCardConfirmation = null;
    if (this.cardUI && this.cardUI.hideConfirmationMode) {
      this.cardUI.hideConfirmationMode();
    }
  }

  /**
   * Schedule cleanup of highlighted cells after a delay
   * @param {Object[]} cells - Array of cells to un-highlight
   */
  scheduleHighlightCleanup(cells) {
    const duration = CONFIG.cards.highlightDuration || 3000;
    setTimeout(() => {
      cells.forEach(cell => {
        cell.highlighted = false;
        if (this.gridRenderer) {
          this.gridRenderer.markDirty(cell);
        }
      });
    }, duration);
  }

  /**
   * Show a temporary toast message
   * @param {string} message - Message to show
   * @param {number} duration - Duration in ms
   */
  showToast(message, duration = 2000) {
    const messageEl = document.getElementById('targeting-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.style.display = 'block';
      messageEl.classList.remove('error');
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, duration);
    }
  }

  /**
   * Handle card played event
   * @param {Object} data - Event data
   */
  onCardPlayed(data) {
  }

  /**
   * Handle energy changed event
   * @param {Object} data - Event data
   */
  onEnergyChanged(data) {
    // Update internal energy state
    if (data.current !== undefined) {
      this.energy = data.current;
    }
    if (data.max !== undefined) {
      this.maxEnergy = data.max;
    }

    // Update UI
    this.cardUI.updateEnergyIndicator(this.energy, this.maxEnergy);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.gameLoop.stop();

    // Cleanup card system
    if (this.cardUI) {
      this.cardUI.destroy();
    }

    EventBus.clear();
  }

  /**
   * Handle touch start
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    e.preventDefault();

    if (!this.stateManager.canInteract()) return;

    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();

    // Convert screen coordinates to canvas coordinates, accounting for CSS scaling
    const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);

    this.touchPosition = { x, y };
    this.touchStartTime = Date.now();

    // Set up long press detection
    this.touchTimer = setTimeout(() => {
      this.performLongPress(x, y);
    }, this.longPressDelay);
  }

  /**
   * Handle touch end
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    e.preventDefault();

    // Clear long press timer
    if (this.touchTimer) {
      clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }

    const touchDuration = Date.now() - this.touchStartTime;

    // If it was a short tap (not long press), handle click
    if (touchDuration < this.longPressDelay && this.touchPosition) {
      const cellPos = this.gridRenderer.getCellFromCoords(
        this.touchPosition.x,
        this.touchPosition.y
      );

      if (cellPos) {
        // If in targeting mode, handle target selection
        if (this.targetingMode) {
          const cell = this.grid.getCell(cellPos.row, cellPos.col);
          this.onTargetSelected(cell);
        } else {
          this.handleCellLeftClick(cellPos.row, cellPos.col);
        }
      }
    }

    this.touchPosition = null;
  }

  /**
   * Handle touch move
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    e.preventDefault();

    // Cancel long press if finger moved too much
    if (this.touchTimer && this.touchPosition) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const distance = Math.sqrt(
        Math.pow(x - this.touchPosition.x, 2) +
        Math.pow(y - this.touchPosition.y, 2)
      );

      // If moved more than 10px, cancel long press
      if (distance > 10) {
        clearTimeout(this.touchTimer);
        this.touchTimer = null;
      }
    }
  }

  /**
   * Handle touch cancel
   * @param {TouchEvent} e - Touch event
   */
  handleTouchCancel(e) {
    e.preventDefault();

    // Clear long press timer
    if (this.touchTimer) {
      clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }

    this.touchPosition = null;
  }

  /**
   * Perform long press action (right click equivalent)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  performLongPress(x, y) {
    // Provide haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    const cellPos = this.gridRenderer.getCellFromCoords(x, y);
    if (cellPos) {
      this.handleCellRightClick(cellPos.row, cellPos.col);
    }

    this.touchTimer = null;
  }

  /**
   * Handle window resize - make canvas responsive
   */
  handleResize() {
    if (!this.canvas || !this.gridRenderer) return;

    this.resizeCanvas();
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    // ESC to cancel card selection
    if (e.key === 'Escape' && this.targetingMode) {
      this.exitTargetingMode();
    }
  }

  /**
   * Resize canvas to fit container
   */
  resizeCanvas() {
    if (!this.canvas || !this.gridRenderer) return;

    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Get container dimensions
    const containerWidth = container.clientWidth - 40; // Account for padding
    const containerHeight = container.clientHeight - 40;

    // Get grid dimensions from renderer
    const gridWidth = this.gridRenderer.canvas.width;
    const gridHeight = this.gridRenderer.canvas.height;

    // Calculate scale to fit container while maintaining aspect ratio
    const scaleX = containerWidth / gridWidth;
    const scaleY = containerHeight / gridHeight;
    this.canvasScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    // Apply scale
    if (this.canvasScale < 1) {
      const newWidth = gridWidth * this.canvasScale;
      const newHeight = gridHeight * this.canvasScale;

      this.canvas.style.width = `${newWidth}px`;
      this.canvas.style.height = `${newHeight}px`;
    } else {
      // Reset to natural size
      this.canvas.style.width = '';
      this.canvas.style.height = '';
    }
  }
}

// Export for ES6 modules
export default Game;
