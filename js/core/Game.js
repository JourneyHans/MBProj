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

    // Game state
    this.stats = {
      minesRemaining: 0,
      timeElapsed: 0,
      startTime: 0
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

    // Start game loop
    this.gameLoop.start();

    // Show menu
    this.showMenu();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    EventBus.on('gridComplete', () => this.onGridComplete());
    EventBus.on('mineTripped', () => this.onMineTripped());
    EventBus.on('cellRevealed', (cell) => this.onCellRevealed(cell));
    EventBus.on('cellFlagged', (cell) => this.onCellFlagged(cell));
  }

  /**
   * Setup input handlers
   */
  setupInputHandlers() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
  }

  /**
   * Handle click on canvas
   * @param {MouseEvent} e - Mouse event
   */
  handleClick(e) {
    if (!this.stateManager.canInteract()) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellPos = this.gridRenderer.getCellFromCoords(x, y);
    if (cellPos) {
      this.handleCellLeftClick(cellPos.row, cellPos.col);
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    // Reveal cell
    const safe = this.grid.revealCell(row, col);

    if (!safe) {
      this.gameOver();
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

    this.updateHUD();
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
   * Handle mine tripped event
   */
  onMineTripped() {
    // Reveal all mines
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
   * Game over
   */
  gameOver() {
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

    // Emit event for UI to update
    EventBus.emit('updateHUD', {
      minesRemaining: this.stats.minesRemaining,
      timeElapsed: this.stats.timeElapsed
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

  /**
   * Cleanup
   */
  destroy() {
    this.gameLoop.stop();
    EventBus.clear();
  }
}

// Export for ES6 modules
export default Game;
