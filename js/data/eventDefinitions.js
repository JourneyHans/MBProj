/**
 * Event Definitions
 * Provides data-first event catalog and query helpers.
 */

const EVENT_TYPES = {
  COMBAT: 'combat',
  SHOP: 'shop',
  REST: 'rest',
  STORY: 'story',
  TREASURE: 'treasure',
  BOSS: 'boss'
};

const EVENT_SUB_TYPES = {
  COMBAT: {
    NORMAL: 'normal',
    HARD: 'hard',
    ELITE: 'elite'
  },
  SHOP: {
    WEAPON: 'weapon',
    UTILITY: 'utility',
    MIXED: 'mixed'
  },
  REST: {
    HEAL: 'heal',
    TRAIN: 'train'
  },
  STORY: {
    RANDOM: 'random',
    FIXED: 'fixed'
  },
  TREASURE: {
    SMALL: 'small',
    LARGE: 'large'
  },
  BOSS: {
    GATEKEEPER: 'gatekeeper',
    FINAL: 'final'
  }
};

const EVENT_DEFINITIONS = [
  {
    id: 'combat_normal_01',
    type: EVENT_TYPES.COMBAT,
    subType: EVENT_SUB_TYPES.COMBAT.NORMAL,
    emoji: '⚔️',
    name: '普通遭遇',
    description: '基础战斗事件，敌人强度较低。',
    tags: ['battle', 'scalable'],
    rewardProfile: {
      goldMultiplier: 1.0,
      lootTier: 'common'
    }
  },
  {
    id: 'combat_hard_01',
    type: EVENT_TYPES.COMBAT,
    subType: EVENT_SUB_TYPES.COMBAT.HARD,
    emoji: '🛡️',
    name: '困难遭遇',
    description: '中高强度战斗事件。',
    tags: ['battle', 'scalable'],
    rewardProfile: {
      goldMultiplier: 1.25,
      lootTier: 'rare'
    }
  },
  {
    id: 'combat_elite_01',
    type: EVENT_TYPES.COMBAT,
    subType: EVENT_SUB_TYPES.COMBAT.ELITE,
    emoji: '🔥',
    name: '精英遭遇',
    description: '高风险高收益战斗事件。',
    tags: ['battle', 'elite'],
    rewardProfile: {
      goldMultiplier: 1.6,
      lootTier: 'epic'
    }
  },
  {
    id: 'shop_mixed_01',
    type: EVENT_TYPES.SHOP,
    subType: EVENT_SUB_TYPES.SHOP.MIXED,
    emoji: '🛒',
    name: '黑市商人',
    description: '提供混合商品池并支持刷新。',
    tags: ['economy', 'merchant'],
    unlocksShop: true
  },
  {
    id: 'rest_heal_01',
    type: EVENT_TYPES.REST,
    subType: EVENT_SUB_TYPES.REST.HEAL,
    emoji: '⛺',
    name: '临时营地',
    description: '回复生命值并整理状态。',
    tags: ['recovery']
  },
  {
    id: 'story_random_01',
    type: EVENT_TYPES.STORY,
    subType: EVENT_SUB_TYPES.STORY.RANDOM,
    emoji: '📜',
    name: '废墟低语',
    description: '触发随机叙事分支。',
    tags: ['narrative']
  },
  {
    id: 'treasure_small_01',
    type: EVENT_TYPES.TREASURE,
    subType: EVENT_SUB_TYPES.TREASURE.SMALL,
    emoji: '🎁',
    name: '补给箱',
    description: '获取一次小型奖励。',
    tags: ['reward']
  },
  {
    id: 'boss_gatekeeper_01',
    type: EVENT_TYPES.BOSS,
    subType: EVENT_SUB_TYPES.BOSS.GATEKEEPER,
    emoji: '👑',
    name: '守关首领',
    description: '阶段 Boss 战入口事件。',
    tags: ['boss', 'milestone']
  }
];

function getEventDefinition(eventId) {
  return EVENT_DEFINITIONS.find((eventDef) => eventDef.id === eventId) || null;
}

function getEventDefinitionsByType(type) {
  return EVENT_DEFINITIONS.filter((eventDef) => eventDef.type === type);
}

function getEventDefinitionsByTypeAndSubType(type, subType) {
  return EVENT_DEFINITIONS.filter((eventDef) => eventDef.type === type && eventDef.subType === subType);
}

function getEventTypeEmoji(type) {
  const map = {
    [EVENT_TYPES.COMBAT]: '⚔️',
    [EVENT_TYPES.SHOP]: '🛒',
    [EVENT_TYPES.REST]: '⛺',
    [EVENT_TYPES.STORY]: '📜',
    [EVENT_TYPES.TREASURE]: '🎁',
    [EVENT_TYPES.BOSS]: '👑'
  };

  return map[type] || '❔';
}

export {
  EVENT_TYPES,
  EVENT_SUB_TYPES,
  EVENT_DEFINITIONS,
  getEventDefinition,
  getEventDefinitionsByType,
  getEventDefinitionsByTypeAndSubType,
  getEventTypeEmoji
};
