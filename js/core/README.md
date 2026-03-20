# core 模块开发文档

`js/core/` 是游戏运行时的控制中枢，负责状态、循环、事件和主流程编排。

## 目录与职责

- `Game.js`：主控制器，组织所有系统并处理输入
- `GameLoop.js`：基于 `requestAnimationFrame` 的主循环
- `StateManager.js`：状态机与状态栈（`PLAYING` / `CARD_SELECTION` 等）
- `EventBus.js`：发布-订阅事件系统，解耦模块通信

## 设计模式

- **Facade（门面）**：`Game` 对外暴露统一入口，内部协调 grid/cards/ui
- **Pub/Sub（发布订阅）**：模块间通过 `EventBus` 通知，不直接强耦合
- **State Machine（状态机）**：输入是否可交互由 `StateManager` 控制

## 核心流程

1. `Game.initialize(canvas)` 初始化渲染器、输入、卡牌系统
2. `GameLoop.start()` 驱动 `update()` + `render()`
3. 用户输入进入 `Game.handleClick/handleTouch...`
4. 根据状态分流到网格或卡牌逻辑
5. 通过 `EventBus.emit()` 通知 HUD/UI 更新

## 常用接口

- `Game.startNewGame()`：重置网格、牌组、能量、生命并进入 `PLAYING`
- `Game.onCardSelected(card)`：统一卡牌选择入口
- `Game.playCard(card, target)`：执行卡牌效果并更新资源
- `StateManager.pushState()/popState()`：临时状态进出栈
- `EventBus.on()/emit()/off()`：模块事件通信

## 开发建议

- 新增系统时优先通过 `EventBus` 接入，而不是在 `Game` 里硬编码跨模块调用
- 新状态要同步更新 `canInteract()` 规则
- 卡牌流程改动后要重点回归：
  - 选卡切换
  - 目标选择
  - ESC 取消
  - 无目标卡确认
