/**
 * Monster Definitions
 * Data-driven monster templates for mine encounters.
 */

const MONSTER_DEFINITIONS = {
  slime: {
    id: 'slime',
    name: '史莱姆',
    emoji: '🟢',
    clearedEmoji: '💧',
    rarity: 'common',
    description: '基础怪物，属性均衡。',
    stats: {
      baseHp: 2,
      hpPerTier: 1,
      baseAttack: 1,
      attackPerTier: 0
    },
    damageProfile: {
      scout: 2,
      mine_detector: 1
    },
    weights: {
      early: 60,
      mid: 45,
      late: 35
    }
  },
  brute: {
    id: 'brute',
    name: '重甲魔',
    emoji: '🧱',
    clearedEmoji: '🪨',
    rarity: 'uncommon',
    description: '血厚但攻击中等。',
    stats: {
      baseHp: 4,
      hpPerTier: 1,
      baseAttack: 1,
      attackPerTier: 1
    },
    damageProfile: {
      scout: 1,
      mine_detector: 1
    },
    weights: {
      early: 30,
      mid: 35,
      late: 35
    }
  },
  spiker: {
    id: 'spiker',
    name: '尖刺兽',
    emoji: '🟣',
    clearedEmoji: '🦴',
    rarity: 'rare',
    description: '血量较低但反击强。',
    stats: {
      baseHp: 2,
      hpPerTier: 1,
      baseAttack: 2,
      attackPerTier: 1
    },
    damageProfile: {
      scout: 2,
      mine_detector: 1
    },
    weights: {
      early: 10,
      mid: 20,
      late: 30
    }
  }
};

const TIER_INTERVAL = 3;

function getMonsterDefinition(monsterId) {
  return MONSTER_DEFINITIONS[monsterId] || null;
}

function getTierByTurn(turn = 1) {
  return Math.max(1, Math.floor(Math.max(1, turn) / TIER_INTERVAL) + 1);
}

function resolveWeightStage(turn = 1) {
  if (turn <= 4) return 'early';
  if (turn <= 10) return 'mid';
  return 'late';
}

function rollMonsterType(turn = 1, rng = Math.random) {
  const stage = resolveWeightStage(turn);
  const entries = Object.values(MONSTER_DEFINITIONS);
  const totalWeight = entries.reduce((sum, def) => sum + (def.weights[stage] || 0), 0);

  if (totalWeight <= 0) return 'slime';

  let cursor = rng() * totalWeight;
  for (let i = 0; i < entries.length; i++) {
    const def = entries[i];
    cursor -= def.weights[stage] || 0;
    if (cursor <= 0) {
      return def.id;
    }
  }

  return entries[entries.length - 1].id;
}

function buildMonsterEncounter(monsterId, turn = 1) {
  const definition = getMonsterDefinition(monsterId) || MONSTER_DEFINITIONS.slime;
  const tier = getTierByTurn(turn);
  const hp = definition.stats.baseHp + definition.stats.hpPerTier * (tier - 1);
  const attack = definition.stats.baseAttack + definition.stats.attackPerTier * (tier - 1);

  return {
    type: definition.id,
    name: definition.name,
    emoji: definition.emoji,
    clearedEmoji: definition.clearedEmoji,
    tier,
    hp,
    maxHp: hp,
    attack,
    damageProfile: {
      ...definition.damageProfile
    }
  };
}

export {
  MONSTER_DEFINITIONS,
  getMonsterDefinition,
  getTierByTurn,
  rollMonsterType,
  buildMonsterEncounter
};

