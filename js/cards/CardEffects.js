/**
 * CardEffects - Card effect execution system
 * Provides helper methods and validation for card effects
 */

import EventBus from '../core/EventBus.js';

class CardEffects {
  /**
   * Execute a card effect
   * @param {Card} card - Card to play
   * @param {Object|null} target - Target object (Cell, Player, etc.)
   * @param {Object} gameState - Current game state
   * @returns {Object} Result object with success, message, and data
   */
  static executeEffect(card, target, gameState) {
    // Validate target
    const validation = this.validateTarget(card, target, gameState);
    if (!validation.valid) {
      return {
        success: false,
        reason: validation.reason
      };
    }

    // Execute the card's effect function
    if (card.effect && typeof card.effect === 'function') {
      try {
        const result = card.effect(target, gameState);

        // Emit card effect executed event
        EventBus.emit('cardEffectExecuted', {
          card: card,
          target: target,
          result: result
        });

        return result;
      } catch (error) {
        console.error(`Error executing card effect for ${card.id}:`, error);
        return {
          success: false,
          reason: 'Effect execution failed'
        };
      }
    }

    return {
      success: false,
      reason: 'Card effect not defined'
    };
  }

  /**
   * Validate if a target is valid for a card
   * @param {Card} card - Card to validate
   * @param {Object|null} target - Target to validate
   * @param {Object} gameState - Current game state
   * @returns {Object} Validation result
   */
  static validateTarget(card, target, gameState) {
    // Check if card needs a target
    if (card.targetType === 'none') {
      return { valid: true };
    }

    // Check if target exists
    if (!target) {
      return { valid: false, reason: '需要选择目标' };
    }

    // Check target type specific validation
    switch (card.targetType) {
      case 'single':
        // Single cell target
        if (this.isCell(target)) {
          if (!target.covered) {
            return { valid: false, reason: '目标已揭示' };
          }
          return { valid: true };
        }
        return { valid: false, reason: '无效目标' };

      case 'area':
        // Area target (center cell + neighbors)
        if (this.isCell(target)) {
          const grid = gameState.grid;
          const neighbors = grid.getNeighbors(target.row, target.col);
          if (neighbors.length === 0) {
            return { valid: false, reason: '没有有效的目标区域' };
          }
          return { valid: true };
        }
        return { valid: false, reason: '无效目标' };

      case 'self':
        // Self target (player)
        return { valid: true };

      default:
        return { valid: false, reason: '未知目标类型' };
    }
  }

  /**
   * Check if object is a cell
   * @param {Object} obj - Object to check
   * @returns {boolean} True if object is a cell
   */
  static isCell(obj) {
    return obj && typeof obj.row === 'number' && typeof obj.col === 'number';
  }

  /**
   * Get neighboring cells of a target cell
   * @param {Object} target - Target cell
   * @param {Object} gameState - Current game state
   * @returns {Object[]} Array of neighboring cells
   */
  static getNeighbors(target, gameState) {
    if (!this.isCell(target) || !gameState.grid) {
      return [];
    }

    return gameState.grid.getNeighbors(target.row, target.col);
  }

  /**
   * Apply effect to all cells in an area
   * @param {Object} centerCell - Center cell of the area
   * @param {Function} effectFn - Effect function to apply to each cell
   * @param {Object} gameState - Current game state
   * @returns {Object[]} Array of affected cells
   */
  static applyToArea(centerCell, effectFn, gameState) {
    const affectedCells = [];
    const grid = gameState.grid;

    if (!grid) {
      return affectedCells;
    }

    // Get center and neighbors
    const cells = [centerCell, ...grid.getNeighbors(centerCell.row, centerCell.col)];

    // Apply effect to each cell
    cells.forEach(cell => {
      const result = effectFn(cell);
      if (result) {
        affectedCells.push(cell);
      }
    });

    return affectedCells;
  }

  /**
   * Mark cells as highlighted
   * @param {Object[]} cells - Cells to highlight
   * @param {number} duration - Highlight duration in ms (optional)
   */
  static highlightCells(cells, duration) {
    cells.forEach(cell => {
      cell.highlighted = true;
    });

    // Auto-remove highlight after duration
    if (duration) {
      setTimeout(() => {
        cells.forEach(cell => {
          cell.highlighted = false;
        });
        EventBus.emit('cellsUnhighlighted', { cells });
      }, duration);
    }

    EventBus.emit('cellsHighlighted', { cells, duration });
  }

  /**
   * Mark cells as protected
   * @param {Object[]} cells - Cells to protect
   */
  static protectCells(cells) {
    cells.forEach(cell => {
      cell.protected = true;
    });

    EventBus.emit('cellsProtected', { cells });
  }

  /**
   * Safely reveal a cell
   * @param {Object} cell - Cell to reveal
   * @param {Object} gameState - Current game state
   * @returns {Object} Result object
   */
  static revealCell(cell, gameState) {
    if (!cell.covered) {
      return { success: false, reason: 'Cell already revealed' };
    }

    if (!gameState.grid) {
      return { success: false, reason: 'Grid not available' };
    }

    // "Safe reveal" semantics: mine targets are auto-protected before reveal.
    if (cell.isMine && !cell.protected) {
      cell.protected = true;
    }

    const safe = gameState.grid.revealCell(cell.row, cell.col);
    if (!safe) {
      return { success: false, reason: 'Hit mine while revealing' };
    }

    return { success: true };
  }

  /**
   * Calculate card power based on game state
   * @param {Card} card - Card to calculate power for
   * @param {Object} gameState - Current game state
   * @returns {number} Power value
   */
  static calculatePower(card, gameState) {
    // Base power is energy cost
    let power = card.energyCost;

    // Bonus power based on card type and game state
    switch (card.type) {
      case 'scout':
        // Scout cards are more powerful when many cells are hidden
        if (gameState.grid) {
          const hiddenCells = gameState.grid.getAllCells().flat().filter((c) => c.covered).length;
          power += Math.floor(hiddenCells / 10);
        }
        break;

      case 'defense':
        // Defense cards are more powerful when many mines are remaining
        if (gameState.grid) {
          const minesRemaining = gameState.grid.getStats().mineCount;
          power += Math.floor(minesRemaining / 5);
        }
        break;

      case 'utility':
        // Utility cards have fixed power
        break;
    }

    return power;
  }
}

export default CardEffects;
