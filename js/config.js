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
    startEnergy: 3,
    maxEnergy: 10,
    startExtraLives: 0,
    startGold: 0,
    cardsPerTurn: 3,
    maxHandSize: 8
  },

  // Progression settings
  progression: {
    maxLevels: 20,
    baseEventChance: 0.2,
    perkPointsPerLevel: 1,
    goldMultiplier: 1.0
  },

  // Card settings
  cards: {
    maxDeckSize: 30,
    minDeckSize: 10,
    maxRerolls: 3
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
