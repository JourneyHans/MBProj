# core 模块开发文档

`js/core/` 是游戏运行时的控制中枢，负责状态、循环、事件和主流程编排。
在 `v0.3.x-alpha` 阶段，核心目标是承接“怪物化扫雷”主线重构。

## 目录与职责

- `Game.js`：主控制器，组织网格信息层、卡牌战术层与 Run 流程
- `GameLoop.js`：基于 `requestAnimationFrame` 的主循环
- `StateManager.js`：状态机与状态栈（`PLAYING` / `CARD_SELECTION` 等）
- `EventBus.js`：发布-订阅事件系统，解耦模块通信
- （跨模块接线）`Game` 会注入并调度 `AudioManager` / `EffectsManager`

## 设计模式

- **Facade（门面）**：`Game` 对外暴露统一入口，内部协调 grid/cards/ui
- **Pub/Sub（发布订阅）**：模块间通过 `EventBus` 通知，不直接强耦合
- **State Machine（状态机）**：输入是否可交互由 `StateManager` 控制

## 核心流程

1. `Game.initialize(canvas)` 初始化渲染器、输入、卡牌系统
2. `GameLoop.start()` 驱动 `update()` + `render()`
3. 用户输入进入 `Game.handleClick/handleTouch...`
4. 根据状态分流到网格揭示、怪物处理或卡牌逻辑
5. 通过 `EventBus.emit()` 通知 HUD/UI 更新
6. 通过 `AudioManager` / `EffectsManager` 输出反馈（SFX + 动效）

### 怪物遭遇最小闭环（P3-A）

1. 揭示地雷 -> `mineTripped` -> `Game.startMonsterEncounter()`
2. 进入显形怪物处理阶段（默认阻挡常规揭示，展示怪物 `intent`）
3. 使用卡牌造成伤害并结算（点击怪物格仅查看信息；烟幕可短暂解除阻挡）
4. 怪物结算 -> `Game.resolveMonsterEncounter()` -> 新回合补能量/补手牌
5. 仅在“安全区清空 + 怪物全处理”时触发胜利

### 能量-抽牌循环（P3-B）

1. 揭示安全格获得能量（上限封顶）
2. 进入显形怪物遭遇时触发最低能量保底
3. 每回合开始恢复能量并重置“抽牌动作”次数
4. 玩家可执行“抽牌”动作（消耗 1 能量抽 1 张，回合内限 1 次）
5. 玩家可在全屏覆盖层查看牌库/弃牌堆，卡牌展示样式与手牌区保持一致

## 常用接口

- `Game.startNewGame()`：重置网格、牌组、能量、玩家状态并进入 `PLAYING`
- `Game.onCardSelected(card)`：统一卡牌选择入口
- `Game.playCard(card, target)`：执行卡牌效果并更新资源
- `StateManager.pushState()/popState()`：临时状态进出栈
- `EventBus.on()/emit()/off()`：模块事件通信

## 状态流（卡牌交互）

1. `PLAYING`：默认可交互状态（网格/手牌）
2. 点击需目标卡后进入 `CARD_SELECTION`（`targetingMode=true`）
3. 选择有效目标后执行 `Game.playCard()`，并退出 `CARD_SELECTION`
4. 无目标卡走二次确认：第一次点击进入确认态，第二次点击同卡执行
5. 取消入口统一（ESC / 空白点击 / 取消按钮）并回到 `PLAYING`

## 事件命名规范（当前约定）

- 命名统一使用小驼峰动词短语：`stateChanged`、`cardPlayed`、`energyChanged`
- 状态类事件：
  - `stateChanging`：状态切换前
  - `stateChanged`：状态切换后
- 卡牌主流程事件：
  - `handUpdated`、`targetingModeStarted`、`targetingModeEnded`、`cardPlayed`
- 网格主流程事件：
  - `cellRevealed`、`cellFlagged`、`mineTripped`、`gridComplete`
- UI 驱动事件：
  - `updateHUD`、`showDialog`

## 开发建议

- 新增系统时优先通过 `EventBus` 接入，而不是在 `Game` 里硬编码跨模块调用
- 新状态要同步更新 `canInteract()` 规则
- 调试日志统一通过 `Game.debug()` 输出，并由 `CONFIG.debug.enabled` 控制开关
- 玩法重构期间需保持约束：揭示到地雷后应进入可处理状态，而非直接作为唯一失败来源
- 反馈层改动（音效/动效）应优先走 `Game` 统一触发，避免在子模块散落硬编码
- 卡牌流程改动后要重点回归：
  - 选卡切换
  - 目标选择
  - 目标悬停反馈（可选/不可选高亮）
  - ESC/空白点击/取消按钮 取消
  - 无目标卡确认
