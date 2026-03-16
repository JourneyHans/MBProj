/**
 * Card Definitions - MVP Card Set (Phase 2)
 * Basic card definitions for the card system
 */

const CARD_DEFINITIONS = {
  // ========================================
  // SCOUT CARDS - Reconnaissance
  // ========================================

  scout: {
    id: 'scout',
    name: '侦察',
    description: '安全揭示一个格子',
    energyCost: 1,
    type: 'scout',
    targetType: 'single',
    rarity: 'common',
    effect: (target, gameState) => {
      if (!target) {
        return { success: false, reason: '无效目标' };
      }

      if (target.revealed) {
        return { success: false, reason: '目标已揭示' };
      }

      // Safely reveal the cell
      target.revealed = true;

      // If it's a mine, protect it so it doesn't explode
      if (target.isMine) {
        target.protected = true;
      }

      // Check for empty cells and flood-fill
      if (!target.isMine && target.adjacentMines === 0) {
        const grid = gameState.grid;
        grid.revealEmptyArea(target.row, target.col);
      }

      return { success: true, message: '格子已安全揭示' };
    }
  },

  mine_detector: {
    id: 'mine_detector',
    name: '地雷探测',
    description: '显示3x3区域内的所有地雷',
    energyCost: 2,
    type: 'scout',
    targetType: 'single',
    rarity: 'common',
    effect: (target, gameState) => {
      if (!target) {
        return { success: false, reason: '无效目标' };
      }

      const grid = gameState.grid;
      const neighbors = grid.getNeighbors(target.row, target.col);
      neighbors.push(target); // Include the target cell

      let minesFound = 0;

      // Highlight all mines in the area
      neighbors.forEach(cell => {
        if (cell.isMine && !cell.revealed) {
          cell.highlighted = true;
          minesFound++;
        }
      });

      return {
        success: true,
        message: `发现了 ${minesFound} 个地雷`,
        data: { minesFound }
      };
    }
  },

  // ========================================
  // DEFENSE CARDS - Protection
  // ========================================

  shield: {
    id: 'shield',
    name: '护盾',
    description: '标记一个格子，保护下次踩雷',
    energyCost: 1,
    type: 'defense',
    targetType: 'single',
    rarity: 'common',
    effect: (target, gameState) => {
      if (!target) {
        return { success: false, reason: '无效目标' };
      }

      if (target.revealed) {
        return { success: false, reason: '无法保护已揭示的格子' };
      }

      // Protect the cell
      target.protected = true;

      return { success: true, message: '格子已受到保护' };
    }
  },

  // ========================================
  // UTILITY CARDS - Functions
  // ========================================

  extra_life: {
    id: 'extra_life',
    name: '额外生命',
    description: '获得1点额外生命',
    energyCost: 2,
    type: 'utility',
    targetType: 'none',
    rarity: 'rare',
    effect: (target, gameState) => {
      // This will be implemented when we have a player object
      // For now, we'll store it in game stats
      if (!gameState.player) {
        gameState.player = { extraLives: 0 };
      }

      gameState.player.extraLives = (gameState.player.extraLives || 0) + 1;

      return {
        success: true,
        message: '获得1点额外生命',
        data: { extraLives: gameState.player.extraLives }
      };
    }
  },

  energy_restore: {
    id: 'energy_restore',
    name: '能量恢复',
    description: '恢复2点能量',
    energyCost: 0,
    type: 'utility',
    targetType: 'none',
    rarity: 'common',
    effect: (target, gameState) => {
      // Restore energy
      const restoreAmount = 2;
      const currentEnergy = gameState.energy || 0;
      const maxEnergy = gameState.maxEnergy || 10;
      const newEnergy = Math.min(currentEnergy + restoreAmount, maxEnergy);

      gameState.energy = newEnergy;

      return {
        success: true,
        message: `恢复了 ${restoreAmount} 点能量`,
        data: { energyRestored: restoreAmount, newEnergy }
      };
    }
  }
};

// Export the card definitions
export default CARD_DEFINITIONS;
