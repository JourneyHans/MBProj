# effects 模块说明

`js/effects/` 负责游戏内视觉反馈（Game Juice）的统一渲染。

## 当前结构

- `EffectsManager.js`：透明 Overlay Canvas 特效管理器

## 架构要点

- 在 `#game-canvas` 上方创建独立特效层，不侵入 `GridRenderer` 绘制逻辑
- 区分两类效果：
  - **瞬态效果**：短生命周期（脉冲、闪白、飘字）
  - **持久效果**：持续渲染（阻挡高亮）
- 由 `requestAnimationFrame` 驱动内部渲染循环

## 已实现效果（Phase 1）

- 格子点击脉冲环：`spawnCellPulse`
- 怪物显形 Pop：`spawnMonsterPop`
- 怪物受击闪白：`spawnDamageFlash`
- 浮动伤害数字：`spawnFloatingText`
- 玩家受伤红色暗角：`spawnPlayerDamageFlash`
- 阻挡怪物边框高亮：`setBlockingHighlight`

## 接入约定

- 由入口创建并注入：`index.html` -> `new EffectsManager()`
- 由 `Game.resizeCanvas()` 调用 `syncSize()` 保持与主画布对齐
- 由 `Game.js` 统一触发具体效果，避免在子模块分散触发
