/**
 * Game Configuration
 * Contains all balance constants and game settings
 */

const CONFIG = {
  // Grid settings
  grid: {
    minSize: 8,
    maxSize: 20,
    defaultRows: 10,
    defaultCols: 10,
    cellSize: 40,
    cellGap: 2
  },

  // Mines settings
  mines: {
    minDensity: 0.10,
    maxDensity: 0.25,
    defaultDensity: 0.15
  },

  // Player settings
  player: {
    startHp: 5,
    startEnergy: 3,
    maxEnergy: 6,
    startGold: 0,
    cardsPerTurn: 5,
    maxHandSize: 5,
    turnEnergyRegen: 1,
    revealActionEnergyGain: 1,
    encounterMinEnergy: 2,
    handRefreshCost: 1,
    handRefreshPerTurn: 1,
    startingDeck: [
      'strike', 'strike', 'strike', 'strike', 'strike',
      'guard', 'guard',
      'chain_probe', 'chain_probe',
      'smoke_screen',
      'armor_break',
      'energy_restore'
    ]
  },

  // Progression settings
  progression: {
    maxLevels: 20,
    baseEventChance: 0.2,
    perkPointsPerLevel: 1,
    goldMultiplier: 1.0
  },

  // Event system settings
  events: {
    bossMonsterType: 'act1_gatekeeper',
    typeWeights: {
      combat: 45,
      shop: 15,
      rest: 15,
      story: 10,
      treasure: 10,
      boss: 5
    },
    bossThresholds: {
      gatekeeperLevel: 5,
      finalBossLevel: 10,
      minEliteKillsForBoss: 2
    },
    shop: {
      tiers: {
        basic: {
          unlockLevel: 1,
          itemSlots: 3
        },
        advanced: {
          unlockLevel: 6,
          itemSlots: 4
        },
        elite: {
          unlockLevel: 12,
          itemSlots: 5
        }
      },
      refreshCosts: {
        baseCost: 1,
        incrementPerRefresh: 1,
        maxCost: 6
      }
    }
  },

  // Debug settings
  debug: {
    enabled: false
  },

  // Card settings
  cards: {
    maxDeckSize: 30,
    minDeckSize: 10,
    maxRerolls: 3,
    animationDuration: 300,
    highlightDuration: 3000,
    maxHandSize: 5
  },

  // Card colors
  cardColors: {
    common: {
      border: '#64748b',
      bg: '#1e293b',
      shadow: 'rgba(100, 116, 139, 0.3)'
    },
    rare: {
      border: '#3b82f6',
      bg: '#1e3a5f',
      shadow: 'rgba(59, 130, 246, 0.4)'
    },
    epic: {
      border: '#a855f7',
      bg: '#3b0764',
      shadow: 'rgba(168, 85, 247, 0.5)'
    },
    legendary: {
      border: '#fbbf24',
      bg: '#78350f',
      shadow: 'rgba(251, 191, 36, 0.6)'
    }
  },

  // Game states
  gameState: {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    CARD_SELECTION: 'card_selection',
    EVENT_DIALOG: 'event_dialog',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
  },

  // Colors
  colors: {
    cell: {
      hidden: '#374151',
      revealed: '#1f2937',
      highlighted: '#4b5563',
      mine: '#ef4444',
      flag: '#f59e0b'
    },
    numbers: [
      '#3b82f6', // 1 - blue
      '#22c55e', // 2 - green
      '#ef4444', // 3 - red
      '#8b5cf6', // 4 - purple
      '#f59e0b', // 5 - orange
      '#06b6d4', // 6 - cyan
      '#1f2937', // 7 - dark
      '#9ca3af'  // 8 - gray
    ]
  }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);

// Export for ES6 modules
export default CONFIG;
