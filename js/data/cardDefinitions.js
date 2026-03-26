/**
 * Card Definitions - Combat-enabled Card Set (Phase 3)
 * Data-driven cards used by deck/hand/combat flow.
 */

const CARD_DEFINITIONS = {
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

  guard: {
    id: 'guard',
    name: '格挡',
    description: '获得2点格挡，优先抵消怪物伤害',
    energyCost: 1,
    type: 'defense',
    targetType: 'none',
    rarity: 'common',
    tags: ['defense', 'block'],
    effect: (target, gameState) => {
      if (!gameState.player) {
        return { success: false, reason: '玩家状态不存在' };
      }

      gameState.player.block = (gameState.player.block || 0) + 2;
      return {
        success: true,
        message: '获得2点格挡',
        data: { blockGained: 2, currentBlock: gameState.player.block }
      };
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
    tags: ['economy', 'energy'],
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
  },

  strike: {
    id: 'strike',
    name: '打击',
    description: '对显形怪物造成2点伤害',
    energyCost: 1,
    type: 'attack',
    targetType: 'single',
    rarity: 'common',
    combatOnly: true,
    baseDamage: 2,
    attackTag: 'physical',
    tags: ['attack', 'damage'],
    effect: (target, gameState) => {
      if (!target) {
        return { success: false, reason: '无效目标' };
      }

      if (!gameState.combat || !gameState.combat.activeEncounter) {
        return { success: false, reason: '当前没有显形怪物' };
      }

      return { success: true, message: '发动打击' };
    }
  },

  chain_probe: {
    id: 'chain_probe',
    name: '连锁探针',
    description: '造成1点伤害并抽1张牌',
    energyCost: 1,
    type: 'attack',
    targetType: 'single',
    rarity: 'common',
    combatOnly: true,
    baseDamage: 1,
    attackTag: 'technical',
    tags: ['attack', 'cycle'],
    effect: (target, gameState) => {
      if (!target) {
        return { success: false, reason: '无效目标' };
      }

      if (!gameState.combat || !gameState.combat.activeEncounter) {
        return { success: false, reason: '当前没有显形怪物' };
      }

      return {
        success: true,
        message: '连锁探针命中，准备抽牌',
        data: { drawCards: 1 }
      };
    }
  },

  armor_break: {
    id: 'armor_break',
    name: '破甲',
    description: '造成1点伤害并施加2回合易伤（受伤+1）',
    energyCost: 1,
    type: 'attack',
    targetType: 'single',
    rarity: 'common',
    combatOnly: true,
    baseDamage: 1,
    attackTag: 'pierce',
    tags: ['attack', 'debuff'],
    effect: (target, gameState) => {
      if (!target) {
        return { success: false, reason: '无效目标' };
      }

      if (!gameState.combat || !gameState.combat.activeEncounter) {
        return { success: false, reason: '当前没有显形怪物' };
      }

      return {
        success: true,
        message: '目标护甲被削弱',
        data: {
          encounter: {
            applyVulnerable: 2
          }
        }
      };
    }
  },

  smoke_screen: {
    id: 'smoke_screen',
    name: '烟幕',
    description: '用烟雾覆盖目标2回合，期间可继续探索不受其阻挡',
    energyCost: 1,
    type: 'defense',
    targetType: 'single',
    rarity: 'uncommon',
    combatOnly: true,
    tags: ['control', 'counter'],
    effect: (target, gameState) => {
      if (!target) {
        return { success: false, reason: '无效目标' };
      }

      if (!gameState.combat || !gameState.combat.activeEncounter) {
        return { success: false, reason: '当前没有显形怪物' };
      }

      return {
        success: true,
        message: '烟幕生效：目标被覆盖 2 回合',
        data: {
          encounter: {
            applySmokeScreenTurns: 2
          }
        }
      };
    }
  }
};

// Export the card definitions
export default CARD_DEFINITIONS;
