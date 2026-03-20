# roguelike 模块开发文档（规划中）

`js/roguelike/` 预留给 Run 级进度系统，目前尚未实装。

## 目标职责

- 关卡推进（Level）
- 事件系统（Event）
- 奖励与选卡（Reward）
- 长线进度（Meta Progression）

## 计划接口方向

- `LevelManager.startRun() / nextLevel()`
- `EventSystem.rollEvent(context)`
- `RewardSystem.generateOptions(context)`
- `MetaProgression.save()/load()`

## 与现有系统的衔接点

- 使用 `EventBus` 通知 UI 和核心逻辑
- 通过 `Game` 注入上下文（当前关卡、玩家状态、牌组）
- 读取 `config.js` 中 progression 配置
