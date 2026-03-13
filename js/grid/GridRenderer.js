/**
 * GridRenderer - Canvas rendering for minesweeper grid
 */

import CONFIG from '../config.js';

class GridRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = CONFIG.grid.cellSize;
    this.cellGap = CONFIG.grid.cellGap;
    this.grid = null;
    this.dirtyCells = new Set();
    this.needsFullRedraw = true;
  }

  /**
   * Set the grid to render
   * @param {Grid} grid - Grid instance
   */
  setGrid(grid) {
    this.grid = grid;
    this.resizeCanvas();
    this.needsFullRedraw = true;
  }

  /**
   * Resize canvas to fit grid
   */
  resizeCanvas() {
    if (!this.grid) return;

    const totalWidth = this.grid.cols * (this.cellSize + this.cellGap) + this.cellGap;
    const totalHeight = this.grid.rows * (this.cellSize + this.cellGap) + this.cellGap;

    this.canvas.width = totalWidth;
    this.canvas.height = totalHeight;
  }

  /**
   * Mark a cell as dirty (needs redraw)
   * @param {Cell} cell - Cell to mark dirty
   */
  markDirty(cell) {
    this.dirtyCells.add(`${cell.row},${cell.col}`);
  }

  /**
   * Mark all cells as dirty
   */
  markAllDirty() {
    this.needsFullRedraw = true;
  }

  /**
   * Render the grid
   */
  render() {
    if (!this.grid) return;

    if (this.needsFullRedraw) {
      this.renderFull();
      this.needsFullRedraw = false;
      this.dirtyCells.clear();
    } else {
      this.renderDirty();
    }
  }

  /**
   * Full render of all cells
   */
  renderFull() {
    // Clear canvas
    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render all cells
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const cell = this.grid.getCell(r, c);
        this.renderCell(cell);
      }
    }
  }

  /**
   * Render only dirty cells
   */
  renderDirty() {
    this.dirtyCells.forEach(key => {
      const [row, col] = key.split(',').map(Number);
      const cell = this.grid.getCell(row, col);
      if (cell) {
        this.renderCell(cell);
      }
    });
    this.dirtyCells.clear();
  }

  /**
   * Render a single cell
   * @param {Cell} cell - Cell to render
   */
  renderCell(cell) {
    const x = this.cellGap + cell.col * (this.cellSize + this.cellGap);
    const y = this.cellGap + cell.row * (this.cellSize + this.cellGap);

    // Clear cell area
    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(x - 1, y - 1, this.cellSize + 2, this.cellSize + 2);

    // Draw cell background
    this.drawCellBackground(cell, x, y);

    // Draw cell content
    this.drawCellContent(cell, x, y);

    // Draw highlight
    if (cell.highlighted) {
      this.drawHighlight(cell, x, y);
    }
  }

  /**
   * Draw cell background
   * @param {Cell} cell - Cell to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawCellBackground(cell, x, y) {
    let bgColor;

    if (cell.revealed) {
      if (cell.isMine) {
        bgColor = CONFIG.colors.cell.mine;
      } else {
        bgColor = CONFIG.colors.cell.revealed;
      }
    } else if (cell.flagged) {
      bgColor = CONFIG.colors.cell.flag;
    } else if (cell.highlighted) {
      bgColor = CONFIG.colors.cell.highlighted;
    } else {
      bgColor = CONFIG.colors.cell.hidden;
    }

    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
  }

  /**
   * Draw cell content
   * @param {Cell} cell - Cell to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawCellContent(cell, x, y) {
    if (cell.flagged && !cell.revealed) {
      this.drawFlag(x, y);
    } else if (cell.revealed) {
      if (cell.isMine) {
        this.drawMine(x, y);
      } else if (cell.adjacentMines > 0) {
        this.drawNumber(cell.adjacentMines, x, y);
      }
    }
  }

  /**
   * Draw a flag
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawFlag(x, y) {
    const centerX = x + this.cellSize / 2;
    const centerY = y + this.cellSize / 2;

    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 5, centerY - 8);
    this.ctx.lineTo(centerX + 5, centerY - 3);
    this.ctx.lineTo(centerX - 5, centerY + 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = '#d97706';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 5, centerY - 8);
    this.ctx.lineTo(centerX - 5, centerY + 8);
    this.ctx.stroke();
  }

  /**
   * Draw a mine
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawMine(x, y) {
    const centerX = x + this.cellSize / 2;
    const centerY = y + this.cellSize / 2;
    const radius = 10;

    this.ctx.fillStyle = '#7f1d1d';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#1f2937';
    this.ctx.beginPath();
    this.ctx.arc(centerX - 3, centerY - 3, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Draw a number
   * @param {number} num - Number to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawNumber(num, x, y) {
    const centerX = x + this.cellSize / 2;
    const centerY = y + this.cellSize / 2;

    this.ctx.fillStyle = CONFIG.colors.numbers[num - 1] || '#9ca3af';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(num.toString(), centerX, centerY);
  }

  /**
   * Draw highlight around cell
   * @param {Cell} cell - Cell to highlight
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawHighlight(cell, x, y) {
    this.ctx.strokeStyle = '#60a5fa';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
  }

  /**
   * Get cell from canvas coordinates
   * @param {number} canvasX - Canvas X coordinate
   * @param {number} canvasY - Canvas Y coordinate
   * @returns {Object|null} Cell position {row, col} or null
   */
  getCellFromCoords(canvasX, canvasY) {
    if (!this.grid) return null;

    const col = Math.floor((canvasX - this.cellGap) / (this.cellSize + this.cellGap));
    const row = Math.floor((canvasY - this.cellGap) / (this.cellSize + this.cellGap));

    if (this.grid.isValidCell(row, col)) {
      return { row, col };
    }

    return null;
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.needsFullRedraw = true;
  }
}

// Export for ES6 modules
export default GridRenderer;
