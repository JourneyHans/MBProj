/**
 * Cell - Individual cell in the minesweeper grid
 */

class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;

    // Core properties
    this.isMine = false;
    this.covered = true;
    this.flagged = false;

    // Adjacency
    this.adjacentMines = 0;

    // Special states
    this.highlighted = false; // For card effects
    this.protected = false;   // Cannot be mine
    this.monsterType = null;
    this.monsterCleared = false;
  }

  /**
   * Reset cell to initial state
   */
  reset() {
    this.isMine = false;
    this.covered = true;
    this.flagged = false;
    this.adjacentMines = 0;
    this.highlighted = false;
    this.protected = false;
    this.monsterType = null;
    this.monsterCleared = false;
  }

  /**
   * Check if cell can be revealed
   * @returns {boolean} True if cell can be revealed
   */
  canReveal() {
    return this.covered && !this.flagged;
  }

  /**
   * Check if cell can be flagged
   * @returns {boolean} True if cell can be flagged
   */
  canFlag() {
    return this.covered;
  }

  /**
   * Toggle flag on the cell
   * @returns {boolean} New flag state
   */
  toggleFlag() {
    if (!this.canFlag()) return this.flagged;

    this.flagged = !this.flagged;
    return this.flagged;
  }

  /**
   * Get cell state for rendering
   * @returns {string} Cell state
   */
  getState() {
    if (!this.covered) {
      return this.isMine ? 'mine' : 'revealed';
    }
    if (this.flagged) {
      return 'flagged';
    }
    return 'hidden';
  }

  /**
   * Check if cell is in a specific state
   * @param {string} state - State to check
   * @returns {boolean} True if cell is in the given state
   */
  isState(state) {
    return this.getState() === state;
  }

  /**
   * Get cell's position as object
   * @returns {Object} Position with row and col
   */
  getPosition() {
    return { row: this.row, col: this.col };
  }

  /**
   * Create a copy of this cell
   * @returns {Cell} Cloned cell
   */
  clone() {
    const cloned = new Cell(this.row, this.col);
    cloned.isMine = this.isMine;
    cloned.covered = this.covered;
    cloned.flagged = this.flagged;
    cloned.adjacentMines = this.adjacentMines;
    cloned.highlighted = this.highlighted;
    cloned.protected = this.protected;
    cloned.monsterType = this.monsterType;
    cloned.monsterCleared = this.monsterCleared;
    return cloned;
  }
}

// Export for ES6 modules
export default Cell;
