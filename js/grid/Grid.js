/**
 * Grid - Minesweeper Grid Logic
 * Core minesweeper puzzle mechanics
 */

import Cell from './Cell.js';
import EventBus from '../core/EventBus.js';

class Grid {
  constructor(rows, cols, mineCount) {
    this.rows = rows;
    this.cols = cols;
    this.mineCount = mineCount;
    this.cells = [];
    this.revealedCount = 0;
    this.flaggedCount = 0;
    this.trippedMine = null;
    this.initialized = false;

    // Create cells array immediately (but don't place mines yet)
    this.createCells();
  }

  /**
   * Create the cells array
   */
  createCells() {
    this.cells = [];
    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.cells[r][c] = new Cell(r, c);
      }
    }
  }

  /**
   * Initialize the grid (generates mines after first click)
   * @param {Object} firstClickCell - Position of first click {row, col}
   */
  initialize(firstClickCell) {
    // Reset stats
    this.revealedCount = 0;
    this.flaggedCount = 0;
    this.trippedMine = null;

    // Reset all cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.cells[r][c].reset();
      }
    }

    // Generate mines (ensuring first click is safe)
    this.generateMines(firstClickCell);

    // Calculate adjacency
    this.calculateAdjacency();

    this.initialized = true;
  }

  /**
   * Generate mines randomly, ensuring first click area is safe
   * @param {Object} safeCell - Cell that should be safe {row, col}
   */
  generateMines(safeCell) {
    // Get all cells
    const allCells = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        allCells.push(this.cells[r][c]);
      }
    }

    // Create safe zone (first click cell and its neighbors)
    const safeZone = this.getNeighbors(safeCell.row, safeCell.col);
    safeZone.push(this.cells[safeCell.row][safeCell.col]);

    // Filter out safe zone cells
    const availableCells = allCells.filter(cell => !safeZone.includes(cell));

    // Place mines randomly
    const minesToPlace = Math.min(this.mineCount, availableCells.length);
    for (let i = 0; i < minesToPlace; i++) {
      const randomIndex = Math.floor(Math.random() * availableCells.length);
      const cell = availableCells.splice(randomIndex, 1)[0];
      cell.isMine = true;
    }
  }

  /**
   * Calculate adjacent mine count for each cell
   */
  calculateAdjacency() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.cells[r][c].isMine) {
          this.cells[r][c].adjacentMines = this.countAdjacentMines(r, c);
        }
      }
    }
  }

  /**
   * Count mines adjacent to a cell
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {number} Number of adjacent mines
   */
  countAdjacentMines(row, col) {
    const neighbors = this.getNeighbors(row, col);
    return neighbors.filter(cell => cell.isMine).length;
  }

  /**
   * Reveal a cell
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {boolean} True if safe, false if mine
   */
  revealCell(row, col) {
    if (!this.isValidCell(row, col)) return false;

    const cell = this.cells[row][col];
    if (!cell.canReveal()) return true; // Already revealed or flagged

    cell.revealed = true;
    this.revealedCount++;

    if (cell.isMine) {
      this.trippedMine = cell;
      EventBus.emit('mineTripped', cell);
      return false;
    }

    // Flood fill if cell has no adjacent mines
    if (cell.adjacentMines === 0) {
      this.revealAdjacentCells(row, col);
    }

    EventBus.emit('cellRevealed', cell);
    this.checkVictory();

    return true;
  }

  /**
   * Reveal all adjacent cells (flood fill)
   * @param {number} row - Row index
   * @param {number} col - Column index
   */
  revealAdjacentCells(row, col) {
    const neighbors = this.getNeighbors(row, col);
    neighbors.forEach(cell => {
      if (cell.canReveal()) {
        this.revealCell(cell.row, cell.col);
      }
    });
  }

  /**
   * Get all neighboring cells
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {Array<Cell>} Array of neighboring cells
   */
  getNeighbors(row, col) {
    const neighbors = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const nr = row + dr;
        const nc = col + dc;

        if (this.isValidCell(nr, nc)) {
          neighbors.push(this.cells[nr][nc]);
        }
      }
    }

    return neighbors;
  }

  /**
   * Toggle flag on a cell
   * @param {number} row - Row index
   * @param {number} col - Column index
   */
  flagCell(row, col) {
    if (!this.isValidCell(row, col)) return;

    const cell = this.cells[row][col];
    if (!cell.canFlag()) return;

    cell.toggleFlag();
    this.flaggedCount += cell.flagged ? 1 : -1;

    EventBus.emit('cellFlagged', cell);
  }

  /**
   * Check if cell coordinates are valid
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {boolean} True if valid
   */
  isValidCell(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  /**
   * Check if player has won
   */
  checkVictory() {
    const totalCells = this.rows * this.cols;
    const safeCells = totalCells - this.getActualMineCount();

    if (this.revealedCount === safeCells) {
      EventBus.emit('gridComplete');
    }
  }

  /**
   * Get the actual number of mines on the grid
   * @returns {number} Mine count
   */
  getActualMineCount() {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c].isMine) count++;
      }
    }
    return count;
  }

  /**
   * Get cell at position
   * @param {number} row - Row index
   * @param {number} col - Column index
   * @returns {Cell|null} Cell or null if invalid
   */
  getCell(row, col) {
    if (!this.isValidCell(row, col)) return null;
    return this.cells[row][col];
  }

  /**
   * Get all cells
   * @returns {Array<Array<Cell>>} 2D array of cells
   */
  getAllCells() {
    return this.cells;
  }

  /**
   * Reset the grid
   */
  reset() {
    this.initialized = false;
    this.trippedMine = null;
    this.revealedCount = 0;
    this.flaggedCount = 0;

    // Reset all cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.cells[r][c].reset();
      }
    }
  }

  /**
   * Get grid statistics
   * @returns {Object} Grid stats
   */
  getStats() {
    return {
      rows: this.rows,
      cols: this.cols,
      mineCount: this.getActualMineCount(),
      revealedCount: this.revealedCount,
      flaggedCount: this.flaggedCount,
      totalCells: this.rows * this.cols,
      safeCells: (this.rows * this.cols) - this.getActualMineCount(),
      initialized: this.initialized
    };
  }
}

// Export for ES6 modules
export default Grid;
