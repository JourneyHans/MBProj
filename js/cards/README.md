# cards 模块开发文档

`js/cards/` 负责卡牌系统的实体、容器与交互，是当前版本主开发模块。

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

## 卡牌效果扩展规范

在 `js/data/cardDefinitions.js` 中新增卡牌定义：

- 必填字段：`id/name/description/energyCost/type/targetType/effect`
- `effect(target, gameState)` 返回格式建议：
  - 成功：`{ success: true, message?, data? }`
  - 失败：`{ success: false, reason }`

`gameState` 常用字段：

- `grid`
- `energy/maxEnergy`
- `player`

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
- 效果返回的视觉数据（如 `highlightedCells`）由 `Game` 统一调度清理
