# player 模块开发文档（规划中）

`js/player/` 预留给玩家长期状态管理，目前仅由 `Game` 内部对象临时承载。

## 目标职责

- 玩家基础属性（生命、金币、资源）
- 战斗/关卡中的临时状态（护盾、易伤、回合效果等）
- 背包与消耗品（后续）
- 统计数据（胜率、平均时长、卡牌使用次数）

## 计划接口方向

- `Player.getState() / patchState()`
- `Inventory.addItem()/useItem()`
- `Stats.track(event)`
- `Player.applyCombatResult(result)`（规划）

## 与现有系统的衔接点

- 当前 `hp/gold` 已在 `Game.player` 中使用
- 后续可无缝迁移为 `Player` 实例并维持同名字段，减少回归风险
- 需支持“揭雷后战斗结算”的生命与资源变动收口
