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
    goldReward: {
      normal: 2,
      hard: 3,
      elite: 5
    },
    stats: {
      baseHp: 2,
      hpPerTier: 1,
      baseAttack: 1,
      attackPerTier: 0
    },
    damageProfile: {},
    resistanceTag: 'none',
    tagModifiers: {
      physical: 0,
      technical: 0,
      pierce: 0
    },
    intentProfile: {
      type: 'attack',
      ratio: 1.0,
      bonus: 0
    },
    weights: {
      early: 60,
      mid: 45,
      late: 35
    }
  },
  brute: {
    id: 'brute',
    name: '蛮兽',
    emoji: '🦬',
    clearedEmoji: '🦴',
    rarity: 'rare',
    description: '高生命近战怪，出手沉重。',
    goldReward: {
      normal: 3,
      hard: 4,
      elite: 6
    },
    stats: {
      baseHp: 3,
      hpPerTier: 2,
      baseAttack: 1,
      attackPerTier: 1
    },
    damageProfile: {},
    resistanceTag: 'physical',
    tagModifiers: {
      physical: -1,
      technical: 0,
      pierce: 1
    },
    intentProfile: {
      type: 'attack',
      ratio: 1.1,
      bonus: 0
    },
    weights: {
      early: 25,
      mid: 35,
      late: 30
    }
  },
  spiker: {
    id: 'spiker',
    name: '刺针怪',
    emoji: '🦔',
    clearedEmoji: '🪡',
    rarity: 'rare',
    description: '外壳带刺，对近身攻击更耐受。',
    goldReward: {
      normal: 3,
      hard: 5,
      elite: 7
    },
    stats: {
      baseHp: 2,
      hpPerTier: 1,
      baseAttack: 2,
      attackPerTier: 1
    },
    damageProfile: {},
    resistanceTag: 'technical',
    tagModifiers: {
      physical: -1,
      technical: 0,
      pierce: 1
    },
    intentProfile: {
      type: 'attack',
      ratio: 1.0,
      bonus: 1
    },
    weights: {
      early: 15,
      mid: 20,
      late: 25
    }
  },
  phantom: {
    id: 'phantom',
    name: '幽影',
    emoji: '👻',
    clearedEmoji: '✨',
    rarity: 'epic',
    description: '高机动敌人，后期更常见。',
    goldReward: {
      normal: 4,
      hard: 6,
      elite: 9
    },
    stats: {
      baseHp: 2,
      hpPerTier: 1,
      baseAttack: 2,
      attackPerTier: 1
    },
    damageProfile: {},
    resistanceTag: 'pierce',
    tagModifiers: {
      physical: 0,
      technical: 1,
      pierce: -1
    },
    intentProfile: {
      type: 'attack',
      ratio: 1.2,
      bonus: 0
    },
    weights: {
      early: 0,
      mid: 10,
      late: 20
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
  if (!MONSTER_DEFINITIONS.slime) return 'slime';
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
  const intent = buildMonsterIntent(definition, attack);

  return {
    type: definition.id,
    name: definition.name,
    emoji: definition.emoji,
    clearedEmoji: definition.clearedEmoji,
    tier,
    hp,
    maxHp: hp,
    attack,
    intent,
    resistanceTag: definition.resistanceTag || 'none',
    tagModifiers: {
      ...(definition.tagModifiers || {})
    },
    status: {
      vulnerableTurns: 0,
      smokeScreenTurns: 0
    },
    damageProfile: {
      ...definition.damageProfile
    }
  };
}

function buildMonsterIntent(definition, attack) {
  const profile = definition.intentProfile || { type: 'attack', ratio: 1, bonus: 0 };
  const value = Math.max(1, Math.round(attack * (profile.ratio || 1)) + (profile.bonus || 0));

  return {
    type: 'attack',
    value,
    label: `攻击 ${value}`
  };
}

function getMonsterGoldReward(monsterId, difficulty = 'normal') {
  const definition = getMonsterDefinition(monsterId) || MONSTER_DEFINITIONS.slime;
  const rewardTable = definition.goldReward || MONSTER_DEFINITIONS.slime.goldReward;
  const normalizedDifficulty = ['normal', 'hard', 'elite'].includes(difficulty) ? difficulty : 'normal';

  return rewardTable[normalizedDifficulty];
}

export {
  MONSTER_DEFINITIONS,
  getMonsterDefinition,
  getMonsterGoldReward,
  getTierByTurn,
  rollMonsterType,
  buildMonsterEncounter
};

