# roguelike 模块开发文档（规划中）

`js/roguelike/` 预留给 Run 级进度系统，目前尚未实装。

## 目标职责

- 关卡推进（Level）
- 事件系统（Event：Enemy / NPC / Reward）
- 奖励与选卡（Reward）
- 长线进度（Meta Progression）
- 怪物化扫雷规则的 Run 级编排（战斗、结算、难度节奏）

## 计划接口方向

- `LevelManager.startRun() / nextLevel()`
- `EventSystem.rollEvent(context)`
- `EventSystem.resolveEvent(event, context)`
- `RewardSystem.generateOptions(context)`
- `ShopSystem.generateInventory(context) / refresh(context)`
- `MetaProgression.save()/load()`
- `CombatDirector.onMineRevealed(context)`（规划）
- `TurnManager.beginTurn()/endTurn()`（规划）

## 与现有系统的衔接点

- 使用 `EventBus` 通知 UI 和核心逻辑
- 通过 `Game` 注入上下文（当前关卡、玩家状态、牌组）
- 读取 `config.js` 中 progression 配置
- Boss 解锁规则建议落到 `ActState`：
  - `bossDiscovered`
  - `battleEventsResolved`
  - `hardOrEliteResolved`

## Phase 3 实施顺序（建议）

1. Mine -> Monster 最小闭环（揭示触发 -> 处理 -> 结算）
2. 回合与资源循环（抽牌、能量、敌方结算）
3. 关卡/事件/奖励串联
4. Run 存档与轻量 Meta 承接
