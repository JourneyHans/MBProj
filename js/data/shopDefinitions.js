/**
 * Shop Definitions
 * Shop tiers, item slots and refresh costs are configurable.
 */

const SHOP_TIERS = {
  BASIC: 'basic',
  ADVANCED: 'advanced',
  ELITE: 'elite'
};

const SHOP_DEFINITIONS = {
  [SHOP_TIERS.BASIC]: {
    id: SHOP_TIERS.BASIC,
    name: '基础商店',
    unlockLevel: 1,
    itemSlots: 3,
    rollWeight: 60,
    cardRarityWeights: {
      common: 80,
      rare: 20,
      epic: 0
    }
  },
  [SHOP_TIERS.ADVANCED]: {
    id: SHOP_TIERS.ADVANCED,
    name: '进阶商店',
    unlockLevel: 6,
    itemSlots: 4,
    rollWeight: 30,
    cardRarityWeights: {
      common: 55,
      rare: 40,
      epic: 5
    }
  },
  [SHOP_TIERS.ELITE]: {
    id: SHOP_TIERS.ELITE,
    name: '精英商店',
    unlockLevel: 12,
    itemSlots: 5,
    rollWeight: 10,
    cardRarityWeights: {
      common: 35,
      rare: 50,
      epic: 15
    }
  }
};

const SHOP_REFRESH_COSTS = {
  baseCost: 1,
  incrementPerRefresh: 1,
  maxCost: 6
};

function getShopDefinition(tierId) {
  return SHOP_DEFINITIONS[tierId] || null;
}

function getAllShopDefinitions() {
  return Object.values(SHOP_DEFINITIONS);
}

function resolveShopRefreshCost(refreshCount = 0) {
  const safeRefreshCount = Math.max(0, refreshCount);
  const cost = SHOP_REFRESH_COSTS.baseCost + safeRefreshCount * SHOP_REFRESH_COSTS.incrementPerRefresh;

  return Math.min(cost, SHOP_REFRESH_COSTS.maxCost);
}

export {
  SHOP_TIERS,
  SHOP_DEFINITIONS,
  SHOP_REFRESH_COSTS,
  getShopDefinition,
  getAllShopDefinitions,
  resolveShopRefreshCost
};
