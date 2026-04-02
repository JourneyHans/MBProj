# data 模块开发文档

`js/data/` 存放纯数据定义，避免业务逻辑散落到控制层。
在 `Phase 3` 将逐步承载怪物与事件等玩法数据。

## 当前文件

- `cardDefinitions.js`：基础卡牌定义（MVP）
- `monsterDefinitions.js`：怪物类型、权重与成长模板（P3）
- `eventDefinitions.js`：事件类型/子类型与事件清单（AI-EVT-DATA-01）
- `shopDefinitions.js`：商店档位、权重与刷新费用（AI-EVT-DATA-01）

## 设计原则

- 数据优先：卡牌“配置”与“流程控制”分离
- 定义文件可读性优先，便于策划/开发协作
- 尽量保持字段稳定，避免上层大量 if-else 兼容

## 卡牌定义结构

```js
{
  id: 'energy_restore',
  name: '能量恢复',
  description: '恢复2点能量',
  energyCost: 0,
  type: 'utility',
  targetType: 'none',
  rarity: 'common',
  effect: (target, gameState) => ({ success: true, data: {} })
}
```

## 扩展建议

- 新增字段时同步更新：
  - `Card.js`（实例映射）
  - `CardUI.js`（展示层）
  - 模块文档 `js/cards/README.md`
- 效果中若产生临时视觉状态，建议放到 `data` 返回结构，由 `Game` 统一收口处理
- 奖励、掉落等后续可继续拆分到独立表（如 `rewardTables.js`）

## 怪物定义结构（当前）

`monsterDefinitions.js` 每个怪物包含：

- 基础信息：`id/name/emoji/clearedEmoji`
- 成长模板：`stats.baseHp/hpPerTier/baseAttack/attackPerTier`
- 行为模板：`intentProfile`（用于生成 `intent`）
- 伤害映射：`damageProfile`（卡牌对该怪物的伤害修正）
- 克制字段：`resistanceTag/tagModifiers`（按 `attackTag` 修正伤害）
- 刷新权重：`weights.early/mid/late`
- 金币收益：`goldReward.normal/hard/elite`（保证普通 < 困难 < 精英）

遭遇实例（`buildMonsterEncounter`）还会包含：

- `status.vulnerableTurns`（易伤剩余回合）
- `status.smokeScreenTurns`（烟幕覆盖剩余回合，用于控制“是否阻挡探索”）

## 事件定义结构（新增）

`eventDefinitions.js` 提供统一字段：

- `type`：主类型（`combat/shop/rest/story/treasure/boss`）
- `subType`：子类型（如 `combat.normal`、`combat.elite`、`boss.gatekeeper`）
- `id/name/description/tags`：事件基础元数据
- `unlocksShop`：可选字段，标记该事件是否用于解锁商店访问（当前 `shop_mixed_01=true`）
- `rewardProfile`：可选奖励倍率/品质标签

并提供查询函数：

- `getEventDefinition(eventId)`：按 ID 查询
- `getEventDefinitionsByType(type)`：按主类型查询
- `getEventDefinitionsByTypeAndSubType(type, subType)`：按主+子类型查询

## 商店定义结构（新增）

`shopDefinitions.js` 提供：

- `SHOP_TIERS`：商店档位枚举（`basic/advanced/elite`）
- `SHOP_DEFINITIONS`：每档位的解锁关卡、槽位、权重、稀有度权重
- `SHOP_REFRESH_COSTS`：刷新费用曲线（基础费用/递增/上限）

并提供查询函数：

- `getShopDefinition(tierId)`：按档位读取
- `getAllShopDefinitions()`：获取全部档位
- `resolveShopRefreshCost(refreshCount)`：按刷新次数计算费用

## 配置联动（`config.js`）

事件系统参数统一放在 `CONFIG.events`：

- `typeWeights`：事件主类型权重
- `bossThresholds`：Boss 放行门槛（关卡/精英击杀等）
- `shop.tiers`：商店档位解锁与槽位
- `shop.refreshCosts`：刷新费用曲线

建议 core 层优先读取 `CONFIG.events` 作为运行时参数源，`js/data/*.js` 作为静态定义源。
