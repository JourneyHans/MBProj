# cards 模块开发文档

`js/cards/` 负责卡牌系统的实体、容器与交互，是当前版本主开发模块。
在 `Phase 3` 中，卡牌从“辅助工具”升级为“核心处理手段”。

## 目录与职责

- `Card.js`：单张卡牌实例（含唯一 `instanceId`）
- `CardLibrary.js`：卡牌定义查询与筛选
- `Deck.js`：牌堆/弃牌堆管理、洗牌、抽牌
- `Hand.js`：手牌管理、选择、可用性判断
- `CardEffects.js`：效果执行辅助与目标校验（工具类）
- `CardUI.js`：手牌 DOM 渲染与点击交互

## 交互流程（当前实现）

1. 点击手牌 -> `CardUI.onCardClick(card)`
2. 交由 `Game.onCardSelected(card)` 判断目标类型
3. 需目标卡：进入目标选择态，点击网格后执行
4. 无目标卡：二次确认后执行
5. `Game.playCard()` 扣能量、移除手牌、进入弃牌堆、刷新 UI

## Phase 3 目标（怪物化扫雷）

- 网格揭示产生的高风险目标（怪物）需通过卡牌处理
- 卡牌效果将从“信息辅助”扩展到“伤害/控制/防护/资源转换”
- 回合与敌方结算接入后，卡牌成为稳定通关必需资源

### 当前战斗卡（P3-B 首轮）

- 输出：`strike`、`chain_probe`、`armor_break`
- 防御/控制：`guard`、`smoke_screen`
- 侦察/资源：`scout`、`energy_restore`

### 卡牌复杂度策略（当前约束）

- 为优先跑通整体循环，`mine_detector` 暂时下线，不纳入首轮战斗卡池
- 侦测类复杂机制延后到 P3-C 再评估回归（避免过早分散调参与实现精力）

### 抽牌循环动作（P3-B）

- 新增手动动作：`重整手牌`
- 规则：消耗 1 能量，弃掉当前手牌并重抽到目标手牌数
- 限制：每回合最多 1 次
- 抽牌堆不足时自动使用弃牌堆回洗后继续抽牌

## 卡牌效果扩展规范

在 `js/data/cardDefinitions.js` 中新增卡牌定义：

- 必填字段：`id/name/description/energyCost/type/targetType/effect`
- 可选战斗字段：
  - `combatOnly`：仅能在显形怪物遭遇中使用
  - `baseDamage`：基础伤害
  - `attackTag`：伤害标签（用于怪物克制修正）
  - `tags`：用途标签（便于后续奖励池和统计）
- `effect(target, gameState)` 返回格式建议：
  - 成功：`{ success: true, message?, data? }`
  - 失败：`{ success: false, reason }`

`gameState` 常用字段：

- `grid`
- `energy/maxEnergy`
- `player`
- `combat.activeEncounter`（当前遭遇）
- `combat.turnEffects`（回合内效果，如反击抑制）

## 常用接口

- `Hand.selectCard(instanceId)`
- `Hand.getSelectedCard()`
- `Hand.canPlayCard(card, energy)`
- `Deck.drawCard()`
- `Deck.discardCard(card)`
- `Card.play(target, gameState)`

## 已知技术注意点

- 目标选择状态必须与 `StateManager` 保持一致
- 无目标卡采用“二次确认”，防止误触
- 卡牌提示文案统一显示在 `#targeting-message`（目标选择、二次确认、能量不足）
- 取消操作支持 ESC、空白区域点击和手牌区取消按钮（目标态/确认态）
- 效果返回的视觉数据（如 `highlightedCells`）由 `Game` 统一调度清理
- 玩法迁移期间需避免把卡牌重新退化为“非必需捷径”
