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
import { buildMonsterEncounter, getMonsterDefinition, rollMonsterType } from '../data/monsterDefinitions.js';

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
      startTime: 0,
      turn: 0,
      monstersResolved: 0,
      hardPassStreak: 0
    };
    this.turnPhase = 'player';

    // Card system
    this.deck = null;
    this.hand = null;
    this.cardUI = null;
    this.energy = CONFIG.player.startEnergy;
    this.maxEnergy = CONFIG.player.maxEnergy;
    this.selectedCard = null;
    this.targetingMode = false;
    this.pendingCardConfirmation = null;
    this.previewTargetCell = null;
    this.debugEnabled = Boolean(CONFIG.debug && CONFIG.debug.enabled);

    // Player state
    this.player = {
      hp: this.getConfiguredStartHp(),
      gold: CONFIG.player.startGold,
      block: 0
    };
    this.turnEffects = {
      preventCounterAttack: false
    };
    this.turnActions = {
      handRefreshUsed: 0
    };
    this.activeMonsterEncounter = null;

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
    EventBus.on('mineTripped', (cell) => this.onMineTripped(cell));
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
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });

    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('click', (e) => this.handleDocumentClick(e));

    // Window resize for responsive canvas
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Handle document click to cancel card interaction on blank areas
   * @param {MouseEvent} e - Mouse event
   */
  handleDocumentClick(e) {
    if (!this.isCardInteractionActive()) return;

    const target = e.target;
    if (!(target instanceof Element)) return;

    const isOnCanvas = Boolean(target.closest('#game-canvas'));
    const isInHand = Boolean(target.closest('#hand-container'));
    const isInDialog = Boolean(target.closest('#dialog-overlay'));
    const isInMenu = Boolean(target.closest('#menu'));

    if (isOnCanvas || isInHand || isInDialog || isInMenu) {
      return;
    }

    this.cancelCardInteraction();
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
   * Handle mouse move on canvas for targeting preview
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    if (!this.grid || !this.gridRenderer) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    const cellPos = this.gridRenderer.getCellFromCoords(x, y);
    const hoveredCell = cellPos ? this.grid.getCell(cellPos.row, cellPos.col) : null;
    this.updateMonsterHoverInfo(hoveredCell);

    if (!this.targetingMode) return;

    if (!cellPos) {
      this.clearTargetPreview();
      return;
    }

    this.updateTargetPreview(hoveredCell);
  }

  /**
   * Handle mouse leave on canvas
   */
  handleMouseLeave() {
    this.clearTargetPreview();
    this.hideMonsterHoverInfo();
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
    const clickedCell = this.grid.getCell(row, col);

    // Clicking revealed unresolved mine cells should open or inspect encounter info.
    if (clickedCell && clickedCell.revealed && clickedCell.isMine && !clickedCell.monsterCleared) {
      if (this.activeMonsterEncounter && this.isActiveMonsterCell(row, col)) {
        const encounter = this.activeMonsterEncounter;
        const info = `${encounter.emoji} ${encounter.name} HP:${encounter.hp}/${encounter.maxHp} 意图:${encounter.intent.label}`;
        this.showToast(info, 1600);
        return;
      }

      if (!this.activeMonsterEncounter) {
        this.startMonsterEncounter(clickedCell);
        if (this.activeMonsterEncounter && this.isActiveMonsterCell(row, col)) {
          const encounter = this.activeMonsterEncounter;
          const info = `${encounter.emoji} ${encounter.name} HP:${encounter.hp}/${encounter.maxHp} 意图:${encounter.intent.label}`;
          this.showToast(info, 1600);
        }
      } else {
        const def = getMonsterDefinition(clickedCell.monsterType);
        const monsterName = def ? def.name : '未知怪物';
        this.showToast(`检测到待处理怪物：${monsterName}。可先继续探索。`, 1500);
      }
      return;
    }

    // Active encounter blocks normal revealing unless smoke screen is active.
    if (this.activeMonsterEncounter && !this.isActiveMonsterCell(row, col) && this.isEncounterBlockingExploration()) {
      this.showToast('当前有显形怪物阻挡探索，请先处理它或使用烟幕。', 1400, 'error');
      return;
    }

    // First click initialization
    if (!this.grid.initialized) {
      this.grid.initialize({ row, col });
      this.stats.startTime = Date.now();
    }

    const revealedBefore = this.grid.getStats().revealedCount;
    const safe = this.grid.revealCell(row, col);
    const revealedAfter = this.grid.getStats().revealedCount;

    if (safe && revealedAfter > revealedBefore) {
      const revealGain = CONFIG.player.revealActionEnergyGain || CONFIG.player.safeRevealEnergyGain || 1;
      this.gainEnergy(revealGain);
    }

    if (!safe) {
      // Mine hit now enters a monster handling flow.
      // Keep fallback safety in case event delivery fails unexpectedly.
      if (!this.activeMonsterEncounter) {
        this.startMonsterEncounter(this.grid.getCell(row, col));
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
    this.stats.turn = 0;
    this.stats.monstersResolved = 0;
    this.stats.hardPassStreak = 0;
    this.turnPhase = 'player';

    // Reset card system
    const turnRegen = CONFIG.player.turnEnergyRegen || 1;
    this.energy = Math.max(0, (CONFIG.player.startEnergy || 0) - turnRegen);
    this.player.hp = this.getConfiguredStartHp();
    this.player.gold = CONFIG.player.startGold;
    this.player.block = 0;
    this.turnEffects.preventCounterAttack = false;
    this.turnActions.handRefreshUsed = 0;
    this.activeMonsterEncounter = null;
    this.hideMonsterHoverInfo();

    // Reset deck and hand
    this.deck.initialize(this.getStartingDeck());
    this.hand.clear();

    // Start first player turn
    this.beginPlayerTurn('开局');

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
    const unresolvedMonsters = this.getUnresolvedMonsterCount();
    if (unresolvedMonsters > 0) {
      this.showToast(`安全区域已清空，但仍有 ${unresolvedMonsters} 个怪物待处理。`, 1800, 'error');
      return;
    }
    this.victory();
  }

  /**
   * Handle mine tripped event - enter monster encounter flow.
   */
  onMineTripped(cell) {
    const targetCell = cell || (this.grid && this.grid.trippedMine);
    this.startMonsterEncounter(targetCell);
    if (targetCell && this.gridRenderer) {
      this.gridRenderer.markDirty(targetCell);
      this.render();
    }
  }

  /**
   * Handle cell revealed event
   * @param {Cell} cell - Revealed cell
   */
  onCellRevealed(cell) {
    if (cell && cell.isMine && cell.protected && !cell.monsterCleared) {
      if (!cell.monsterType) {
        cell.monsterType = rollMonsterType(this.stats.turn || 1);
      }
      cell.monsterCleared = true;
      this.stats.monstersResolved++;
      this.updateHUD();
      this.checkRunCompletion();
    }

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
      hp: this.getCurrentHp(),
      turn: this.stats.turn,
      monstersResolved: this.stats.monstersResolved
    });
  }

  /**
   * Show game over dialog
   */
  showGameOverDialog() {
    EventBus.emit('showDialog', {
      title: 'Game Over',
      message: '你的生命已耗尽，Run 结束。',
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
      message: `你在 ${time} 秒内完成本局，共处理 ${this.stats.monstersResolved} 个怪物。`,
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
    // Create starting deck with configured cards
    this.deck = new Deck(this.getStartingDeck());
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
   * Get a fresh copy of the configured starting deck.
   * @returns {string[]} card id list
   */
  getStartingDeck() {
    const fallbackDeck = ['strike', 'guard', 'chain_probe', 'energy_restore'];
    const configuredDeck = CONFIG.player && Array.isArray(CONFIG.player.startingDeck)
      ? CONFIG.player.startingDeck
      : fallbackDeck;
    return [...configuredDeck];
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
    this.debug('========== Card selected ==========');
    this.debug('Card name:', card.name);
    this.debug('Card energy cost:', card.energyCost);
    this.debug('Current energy:', this.energy);
    this.debug('Card targetType:', card.targetType);

    if (!this.hand.canPlayCard(card, this.energy)) {
      this.showToast(`能量不足（需要 ${card.energyCost}，当前 ${this.energy}）`, 1500, 'error');
      return;
    }

    if (card.targetType === 'none') {
      // No-target cards require explicit confirmation:
      // first click selects, second click on same card confirms play.
      if (this.targetingMode) {
        this.exitTargetingMode();
      }

      if (this.pendingCardConfirmation && this.pendingCardConfirmation.instanceId === card.instanceId) {
        this.debug('Card confirmation received, playing card');
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

    this.debug('Set selectedCard and targetingMode');
    this.debug('selectedCard:', this.selectedCard);
    this.debug('targetingMode:', this.targetingMode);

    // Enter CARD_SELECTION only once; clicking another card while targeting
    // should only switch selected card instead of stacking duplicate states.
    if (!wasTargeting && this.stateManager.getCurrentState() !== CONFIG.gameState.CARD_SELECTION) {
      this.debug('Entering targeting mode');
      this.stateManager.pushState(CONFIG.gameState.CARD_SELECTION);
    } else if (wasTargeting) {
      this.debug('Switching targeting card without state transition');
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

    const validation = this.validateCardTarget(cardToPlay, cell);
    if (!validation.valid) {
      this.showToast(validation.reason || '无效目标', 1200, 'error');
      this.updateTargetPreview(cell);
      return;
    }

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
    this.debug('Playing card:', card.name, 'on target:', target);

    // Prepare game state for effect execution
    const gameState = {
      grid: this.grid,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      player: this.player,
      combat: {
        activeEncounter: this.activeMonsterEncounter,
        turnEffects: this.turnEffects
      }
    };

    this.debug('Game state:', gameState);

    // Execute card effect
    const result = card.play(target, gameState);

    this.debug('Card play result:', result);

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

      if (result.data && typeof result.data.drawCards === 'number' && result.data.drawCards > 0) {
        this.drawCards(result.data.drawCards);
      }

      // Handle temporary highlighted cells returned by card effects
      if (result.data && result.data.highlightedCells && result.data.highlightedCells.length > 0) {
        result.data.highlightedCells.forEach(c => this.gridRenderer.markDirty(c));
        this.scheduleHighlightCleanup(result.data.highlightedCells);
      }

      // Update HUD (hp, energy, etc.)
      this.updateHUD();

      // Update UI
      this.cardUI.render();

      // Force grid re-render to show changes
      this.render();
    } else {
      // Show error message
      console.error('Card play failed:', result.reason);
      this.showToast(`卡牌使用失败：${result.reason || '未知错误'}`, 2000, 'error');
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
    this.clearTargetPreview();
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
   * Cancel current card interaction (targeting or confirmation)
   */
  cancelCardInteraction() {
    if (this.targetingMode) {
      this.exitTargetingMode();
      return;
    }

    if (!this.pendingCardConfirmation) return;

    this.clearTargetPreview();
    this.selectedCard = null;
    this.clearCardConfirmation();
    if (this.hand) {
      this.hand.deselectAll();
    }
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
  showToast(message, duration = 2000, type = 'normal') {
    const messageEl = document.getElementById('targeting-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.style.display = 'block';
      messageEl.classList.toggle('error', type === 'error');
      setTimeout(() => {
        messageEl.style.display = 'none';
        messageEl.classList.remove('error');
      }, duration);
    }
  }

  /**
   * Debug logger controlled by config.debug.enabled
   * @param  {...any} args - log arguments
   */
  debug(...args) {
    if (!this.debugEnabled) return;
    console.log('[Game]', ...args);
  }

  /**
   * Validate target for current selected card
   * @param {Card} card - card to play
   * @param {Object} cell - candidate target cell
   * @returns {{valid: boolean, reason?: string}}
   */
  validateCardTarget(card, cell) {
    if (!card || !cell) return { valid: false, reason: '需要选择目标' };

    if (card.targetType !== 'single') {
      return { valid: true };
    }

    if (this.activeMonsterEncounter) {
      if (!this.isActiveMonsterCell(cell.row, cell.col)) {
        return { valid: false, reason: '怪物战斗中请将目标指向当前显形怪物' };
      }
      return { valid: true };
    }

    if (card.combatOnly) {
      return { valid: false, reason: '该卡只能在显形怪物遭遇中使用' };
    }

    if (cell.revealed) {
      return { valid: false, reason: '该目标已揭示' };
    }

    if (cell.flagged) {
      return { valid: false, reason: '请先取消旗标再施放' };
    }

    return { valid: true };
  }

  /**
   * Update visual preview for card targeting
   * @param {Object|null} cell - current hovered cell
   */
  updateTargetPreview(cell) {
    if (!this.targetingMode || !this.gridRenderer) return;

    const card = this.hand ? this.hand.getSelectedCard() : this.selectedCard;
    if (!card || !cell) {
      this.clearTargetPreview();
      return;
    }

    const validation = this.validateCardTarget(card, cell);
    const isSameCell = this.previewTargetCell
      && this.previewTargetCell.row === cell.row
      && this.previewTargetCell.col === cell.col;

    if (isSameCell) {
      this.gridRenderer.setTargetPreview(cell, validation.valid);
      return;
    }

    if (this.previewTargetCell) {
      this.gridRenderer.markDirty(this.previewTargetCell);
    }
    this.gridRenderer.markDirty(cell);
    this.previewTargetCell = cell;
    this.gridRenderer.setTargetPreview(cell, validation.valid);
  }

  /**
   * Clear target preview visual state
   */
  clearTargetPreview() {
    if (this.previewTargetCell && this.gridRenderer) {
      this.gridRenderer.markDirty(this.previewTargetCell);
    }
    this.previewTargetCell = null;
    if (this.gridRenderer) {
      this.gridRenderer.clearTargetPreview();
    }
  }

  /**
   * Show live monster info while hovering on revealed monster cells.
   * @param {Object|null} cell - Hovered grid cell
   */
  updateMonsterHoverInfo(cell) {
    const infoEl = document.getElementById('monster-hover-info');
    if (!infoEl) return;

    if (!cell || !cell.revealed || !cell.isMine) {
      this.hideMonsterHoverInfo();
      return;
    }

    const definition = getMonsterDefinition(cell.monsterType || 'slime');
    const isActive = this.activeMonsterEncounter
      && this.isActiveMonsterCell(cell.row, cell.col);
    const isCleared = Boolean(cell.monsterCleared);

    const name = definition ? definition.name : '未知怪物';
    const emoji = isCleared
      ? (definition ? definition.clearedEmoji : '💀')
      : (definition ? definition.emoji : '👾');

    let statusLine = '状态：待处理';
    let hpLine = 'HP：?/?';
    let intentLine = '意图：未知';
    let attackLine = '攻击：?';

    if (isCleared) {
      statusLine = '状态：已清算';
      hpLine = 'HP：0/0';
      intentLine = '意图：无';
      attackLine = '攻击：0';
    } else if (isActive && this.activeMonsterEncounter) {
      statusLine = '状态：当前遭遇';
      hpLine = `HP：${this.activeMonsterEncounter.hp}/${this.activeMonsterEncounter.maxHp}`;
      intentLine = `意图：${this.activeMonsterEncounter.intent.label}`;
      attackLine = `攻击：${this.activeMonsterEncounter.attack}`;
    }

    infoEl.innerHTML = `
      <div class="monster-title">${emoji} ${name}</div>
      <div class="monster-line">${statusLine}</div>
      <div class="monster-line">${hpLine}</div>
      <div class="monster-line">${intentLine}</div>
      <div class="monster-line">${attackLine}</div>
    `;
    infoEl.style.display = 'block';
  }

  /**
   * Hide monster hover panel.
   */
  hideMonsterHoverInfo() {
    const infoEl = document.getElementById('monster-hover-info');
    if (!infoEl) return;
    infoEl.style.display = 'none';
  }

  /**
   * Check if there is an active card interaction to cancel
   * @returns {boolean}
   */
  isCardInteractionActive() {
    return this.targetingMode || Boolean(this.pendingCardConfirmation);
  }

  /**
   * Handle card played event
   * @param {Object} data - Event data
   */
  onCardPlayed(data) {
    if (!this.activeMonsterEncounter || !data) {
      return;
    }

    const { card, target, result } = data;
    const isActiveTarget = Boolean(target && this.isActiveMonsterCell(target.row, target.col));
    this.applyEncounterCardEffects(result, isActiveTarget);
    const damage = this.getCardEncounterDamage(card, isActiveTarget);
    if (damage > 0) {
      this.applyDamageToActiveMonster(damage, card);
      return;
    }

    if (!this.turnEffects.preventCounterAttack) {
      this.applyMonsterCounterAttack(`怪物反击！你受到 ${this.getEncounterIntentDamage(this.activeMonsterEncounter)} 点伤害。`);
    } else {
      this.showToast('烟幕生效：本次反击被阻断。', 1200);
      this.turnEffects.preventCounterAttack = false;
      this.tickEncounterStatusOnEnemyAction();
    }
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
   * Start a minimal monster encounter when a mine is revealed.
   * @param {Object|null} cell - Mine cell that triggered the encounter
   */
  startMonsterEncounter(cell) {
    if (!cell || !cell.isMine) return;
    if (this.activeMonsterEncounter && this.isActiveMonsterCell(cell.row, cell.col)) return;
    if (cell.monsterCleared) return;

    if (!cell.monsterType) {
      cell.monsterType = rollMonsterType(this.stats.turn || 1);
    }

    if (this.activeMonsterEncounter) {
      const def = getMonsterDefinition(cell.monsterType);
      const monsterName = def ? def.name : '怪物';
      if (this.gridRenderer) {
        this.gridRenderer.markDirty(cell);
      }
      this.showToast(`又发现了 ${monsterName}，可先继续探索。`, 1400);
      return;
    }

    const encounter = buildMonsterEncounter(cell.monsterType, this.stats.turn || 1);
    this.activeMonsterEncounter = {
      row: cell.row,
      col: cell.col,
      ...encounter
    };
    this.ensureEncounterEnergyFloor();
    if (this.gridRenderer) {
      this.gridRenderer.markDirty(cell);
    }
    this.showToast(
      `${this.activeMonsterEncounter.emoji} ${this.activeMonsterEncounter.name} 显形（T${this.activeMonsterEncounter.tier} HP:${this.activeMonsterEncounter.hp} 意图:${this.activeMonsterEncounter.intent.label}）！`,
      2600,
      'error'
    );
  }

  /**
   * Resolve current monster encounter.
   * @param {string} message - Feedback toast text
   */
  resolveMonsterEncounter(message, options = {}) {
    if (!this.activeMonsterEncounter || !this.grid) return;
    const { viaHardPass = false } = options;

    const cell = this.grid.getCell(this.activeMonsterEncounter.row, this.activeMonsterEncounter.col);
    if (cell) {
      cell.monsterCleared = true;
      if (this.gridRenderer) {
        this.gridRenderer.markDirty(cell);
      }
    }

    this.stats.monstersResolved++;
    this.stats.hardPassStreak = viaHardPass ? this.stats.hardPassStreak + 1 : 0;
    this.activeMonsterEncounter = null;
    if (message) {
      this.showToast(message, 1400);
    }

    this.beginPlayerTurn('遭遇结算');
    this.checkRunCompletion();
  }

  /**
   * Force pass monster encounter by taking damage.
   */
  forcePassMonsterEncounter() {
    const hardPassPenalty = this.stats.hardPassStreak;
    const baseDamage = this.activeMonsterEncounter ? this.getEncounterIntentDamage(this.activeMonsterEncounter) : 1;
    const totalDamage = baseDamage + hardPassPenalty;
    const survived = this.consumeHp(totalDamage);
    if (!survived) return;
    this.resolveMonsterEncounter(`你强行突破了怪物，承受 ${totalDamage} 点伤害。`, { viaHardPass: true });
  }

  /**
   * Apply 1 damage from monster and optionally clear encounter afterwards.
   * @param {string} message - Feedback text
   * @param {boolean} clearAfterHit - Whether to clear encounter after damage
   */
  applyMonsterCounterAttack(message, clearAfterHit = false) {
    if (this.turnEffects.preventCounterAttack) {
      this.turnEffects.preventCounterAttack = false;
      this.tickEncounterStatusOnEnemyAction();
      this.showToast('烟幕生效：本次反击被阻断。', 1200);
      return;
    }

    const attackDamage = this.activeMonsterEncounter
      ? this.getEncounterIntentDamage(this.activeMonsterEncounter)
      : 1;
    const survived = this.consumeHp(attackDamage);
    if (!survived) return;

    if (clearAfterHit) {
      this.activeMonsterEncounter = null;
    }
    this.tickEncounterStatusOnEnemyAction();
    this.showToast(message, 1600, 'error');
  }

  /**
   * Consume HP after applying block.
   * @returns {boolean} true if player still alive after damage
   */
  consumeHp(damage = 1) {
    let remainingDamage = Math.max(0, damage);
    if (remainingDamage <= 0) {
      this.updateHUD();
      return true;
    }

    if (this.player.block > 0) {
      const absorbed = Math.min(this.player.block, remainingDamage);
      this.player.block -= absorbed;
      remainingDamage -= absorbed;
      if (remainingDamage <= 0) {
        this.updateHUD();
        return true;
      }
    }

    while (remainingDamage > 0) {
      this.player.hp = Math.max(0, (this.player.hp || 0) - 1);
      remainingDamage--;
      if (this.getCurrentHp() <= 0) {
        this.updateHUD();
        this.gameOver();
        return false;
      }
    }

    this.updateHUD();
    return true;
  }

  /**
   * Get current HP.
   * @returns {number}
   */
  getCurrentHp() {
    return Math.max(0, this.player.hp || 0);
  }

  /**
   * Resolve configured starting HP with safe fallback.
   * @returns {number}
   */
  getConfiguredStartHp() {
    const configured = Number(CONFIG.player && CONFIG.player.startHp);
    if (Number.isFinite(configured) && configured > 0) {
      return Math.floor(configured);
    }
    return 5;
  }

  /**
   * Check if coordinates match active monster cell.
   * @param {number} row - row index
   * @param {number} col - col index
   * @returns {boolean}
   */
  isActiveMonsterCell(row, col) {
    if (!this.activeMonsterEncounter) return false;
    return this.activeMonsterEncounter.row === row && this.activeMonsterEncounter.col === col;
  }

  /**
   * Determine whether current active encounter blocks revealing other cells.
   * @returns {boolean}
   */
  isEncounterBlockingExploration() {
    if (!this.activeMonsterEncounter) return false;
    const status = this.activeMonsterEncounter.status || {};
    return (status.smokeScreenTurns || 0) <= 0;
  }

  /**
   * Apply card damage to current active monster.
   * @param {number} damage - Damage amount
   * @param {Object} card - Card that caused damage
   */
  applyDamageToActiveMonster(damage, card) {
    if (!this.activeMonsterEncounter) return;

    this.activeMonsterEncounter.hp = Math.max(0, this.activeMonsterEncounter.hp - damage);
    if (this.activeMonsterEncounter.hp <= 0) {
      this.resolveMonsterEncounter(`你用【${card.name}】击败了显形怪物。`);
      return;
    }

    this.showToast(`怪物受到 ${damage} 点伤害，剩余 ${this.activeMonsterEncounter.hp} HP。`, 1200);
    this.applyMonsterCounterAttack(
      `敌方阶段：${this.activeMonsterEncounter.intent.label}，你受到 ${this.getEncounterIntentDamage(this.activeMonsterEncounter)} 点伤害。`
    );
  }

  /**
   * Get card damage against active encounter.
   * @param {Object} card - Played card
   * @param {boolean} isActiveTarget - Whether target is current monster
   * @returns {number}
   */
  getCardEncounterDamage(card, isActiveTarget) {
    if (!card || !this.activeMonsterEncounter) return 0;
    if (!isActiveTarget) return 0;

    const damageProfile = this.activeMonsterEncounter.damageProfile || {};
    let damage = 0;

    if (typeof card.baseDamage === 'number' && card.baseDamage > 0) {
      damage = card.baseDamage;
    } else {
      damage = damageProfile[card.id] || 0;
    }

    const tag = card.attackTag;
    if (tag && this.activeMonsterEncounter.tagModifiers && typeof this.activeMonsterEncounter.tagModifiers[tag] === 'number') {
      damage += this.activeMonsterEncounter.tagModifiers[tag];
    }

    const encounterStatus = this.activeMonsterEncounter.status || {};
    if ((encounterStatus.vulnerableTurns || 0) > 0) {
      damage += 1;
    }

    return Math.max(0, damage);
  }

  /**
   * Begin a new player turn: refill energy and top-up hand.
   * @param {string} reason - Turn transition reason
   */
  beginPlayerTurn(reason = '') {
    this.stats.turn += 1;
    this.turnPhase = 'player';
    this.energy = Math.min(this.maxEnergy, this.energy + (CONFIG.player.turnEnergyRegen || 1));
    this.player.block = 0;
    this.turnEffects.preventCounterAttack = false;
    this.turnActions.handRefreshUsed = 0;

    EventBus.emit('energyChanged', {
      current: this.energy,
      max: this.maxEnergy
    });

    const targetHandSize = Math.min(CONFIG.player.maxHandSize || CONFIG.player.cardsPerTurn, this.hand.getMaxSize());
    const missingCards = Math.max(0, targetHandSize - this.hand.getHandSize());
    if (missingCards > 0) {
      this.drawCards(missingCards);
    } else if (this.cardUI) {
      this.cardUI.render();
    }

    this.updateHUD();
    if (reason) {
      this.showToast(`回合 ${this.stats.turn}：${reason}`, 900);
    }
  }

  /**
   * Get effective damage of encounter intent.
   * @param {Object} encounter - Active encounter
   * @returns {number}
   */
  getEncounterIntentDamage(encounter) {
    if (!encounter) return 1;
    const intentDamage = encounter.intent && encounter.intent.value;
    if (typeof intentDamage === 'number') return Math.max(1, intentDamage);
    return Math.max(1, encounter.attack || 1);
  }

  /**
   * Apply additional encounter effects from card resolution data.
   * @param {Object} result - card result payload
   * @param {boolean} isActiveTarget - whether card targeted current encounter
   */
  applyEncounterCardEffects(result, isActiveTarget) {
    if (!this.activeMonsterEncounter || !isActiveTarget || !result || !result.data || !result.data.encounter) {
      return;
    }

    const encounterData = result.data.encounter;

    if (typeof encounterData.applyVulnerable === 'number' && encounterData.applyVulnerable > 0) {
      const encounterStatus = this.activeMonsterEncounter.status || { vulnerableTurns: 0, smokeScreenTurns: 0 };
      encounterStatus.vulnerableTurns = (encounterStatus.vulnerableTurns || 0) + encounterData.applyVulnerable;
      this.activeMonsterEncounter.status = encounterStatus;
      this.showToast(`目标易伤 +${encounterData.applyVulnerable} 回合。`, 1100);
    }

    if (typeof encounterData.applySmokeScreenTurns === 'number' && encounterData.applySmokeScreenTurns > 0) {
      const encounterStatus = this.activeMonsterEncounter.status || { vulnerableTurns: 0, smokeScreenTurns: 0 };
      encounterStatus.smokeScreenTurns = Math.max(
        encounterStatus.smokeScreenTurns || 0,
        encounterData.applySmokeScreenTurns
      );
      this.activeMonsterEncounter.status = encounterStatus;
      this.showToast(`烟幕覆盖：${encounterStatus.smokeScreenTurns} 回合内该怪物不阻挡探索。`, 1300);
    }

    if (encounterData.preventCounterAttack) {
      this.turnEffects.preventCounterAttack = true;
      this.showToast('烟幕遮蔽：本次敌方反击将失效。', 1100);
    }
  }

  /**
   * Tick encounter status when enemy has taken an action.
   */
  tickEncounterStatusOnEnemyAction() {
    if (!this.activeMonsterEncounter || !this.activeMonsterEncounter.status) return;
    if (this.activeMonsterEncounter.status.vulnerableTurns > 0) {
      this.activeMonsterEncounter.status.vulnerableTurns -= 1;
    }
    if (this.activeMonsterEncounter.status.smokeScreenTurns > 0) {
      this.activeMonsterEncounter.status.smokeScreenTurns -= 1;
      if (this.activeMonsterEncounter.status.smokeScreenTurns === 0) {
        this.showToast('烟幕消散：该怪物再次阻挡探索。', 1100);
      }
    }
  }

  /**
   * Gain energy and sync UI.
   * @param {number} amount - energy amount
   */
  gainEnergy(amount) {
    if (!amount || amount <= 0) return;
    const previous = this.energy;
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    if (this.energy === previous) return;

    EventBus.emit('energyChanged', {
      current: this.energy,
      max: this.maxEnergy
    });
  }

  /**
   * Ensure encounter starts with minimum usable energy.
   */
  ensureEncounterEnergyFloor() {
    const floor = CONFIG.player.encounterMinEnergy || 2;
    if (this.energy >= floor) return;
    this.energy = floor;
    EventBus.emit('energyChanged', {
      current: this.energy,
      max: this.maxEnergy
    });
    this.showToast(`遭遇保底：能量补至 ${floor}。`, 1200);
  }

  /**
   * Check whether draw action is currently allowed.
   * @returns {{allowed: boolean, reason?: string}}
   */
  canUseHandRefresh() {
    if (!this.stateManager || !this.stateManager.canInteract()) {
      return { allowed: false, reason: '当前状态不可执行抽牌' };
    }

    if (!this.hand) {
      return { allowed: false, reason: '手牌系统未初始化' };
    }

    if (this.hand.isFull()) {
      return { allowed: false, reason: '手牌已满，无法抽牌' };
    }

    if (this.targetingMode || this.pendingCardConfirmation) {
      return { allowed: false, reason: '请先取消当前选卡' };
    }

    const maxUses = CONFIG.player.handRefreshPerTurn || 1;
    if (this.turnActions.handRefreshUsed >= maxUses) {
      return { allowed: false, reason: '本回合重整次数已用完' };
    }

    const cost = CONFIG.player.handRefreshCost || 1;
    if (this.energy < cost) {
      return { allowed: false, reason: `能量不足（需要 ${cost}，当前 ${this.energy}）` };
    }

    if (!this.deck || this.deck.getTotalSize() <= 0) {
      return { allowed: false, reason: '牌堆为空，无法抽牌' };
    }

    return { allowed: true };
  }

  /**
   * Execute draw action: spend energy and draw one card.
   * @returns {boolean} true when draw executed
   */
  performHandRefresh() {
    const validation = this.canUseHandRefresh();
    if (!validation.allowed) {
      this.showToast(validation.reason || '当前无法抽牌', 1300, 'error');
      return false;
    }

    const cost = CONFIG.player.handRefreshCost || 1;
    this.energy = Math.max(0, this.energy - cost);
    EventBus.emit('energyChanged', {
      current: this.energy,
      max: this.maxEnergy
    });

    this.drawCards(1);

    this.turnActions.handRefreshUsed += 1;
    this.showToast(`抽牌：消耗 ${cost} 能量，抽 1 张。`, 1200);
    return true;
  }

  /**
   * Check whether run clear condition is met.
   */
  checkRunCompletion() {
    if (!this.grid) return;
    if (this.getUnresolvedMonsterCount() > 0) return;
    if (!this.isSafeAreaCleared()) return;
    this.victory();
  }

  /**
   * Count unresolved mine monsters on board.
   * @returns {number}
   */
  getUnresolvedMonsterCount() {
    if (!this.grid) return 0;

    const cells = this.grid.getAllCells();
    let unresolved = 0;
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const cell = cells[r][c];
        if (cell.isMine && !cell.monsterCleared) {
          unresolved++;
        }
      }
    }
    return unresolved;
  }

  /**
   * Determine whether all safe cells are already revealed.
   * @returns {boolean}
   */
  isSafeAreaCleared() {
    if (!this.grid) return false;
    const stats = this.grid.getStats();
    return stats.revealedCount >= stats.safeCells;
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
    if (e.key === 'Escape' && this.isCardInteractionActive()) {
      this.cancelCardInteraction();
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
