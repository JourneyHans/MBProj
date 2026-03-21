# grid 模块开发文档

`js/grid/` 实现网格信息规则与渲染，遵循“逻辑层 + 渲染层”分离。
在 `Phase 3` 中，网格层负责“信息与触发”，不再独占失败判定。

## 目录与职责

- `Cell.js`：单格数据结构（`isMine/revealed/flagged/protected/highlighted/monsterType/monsterCleared`）
- `Grid.js`：网格规则与格子操作（揭示、标记、邻格信息）
- `GridRenderer.js`：Canvas 绘制与坐标映射

## 设计思路

- **数据与表现分离**：`Grid` 只处理规则，`GridRenderer` 只负责画面
- **首击安全**：首次点击后生成地雷，并保证首击区域安全
- **事件驱动回调**：格子揭示、插旗、踩雷、胜利通过 `EventBus` 通知上层
- **主线约束**：踩雷事件作为“高风险触发”，具体惩罚可由上层战斗/资源系统决定

## 关键流程

1. `Grid.initialize(firstClick)` 生成地雷并计算邻雷数
2. `Grid.revealCell(row, col)` 执行揭示与风险触发判定
3. `GridRenderer.render()` 按 dirty/full 策略绘制
4. `GridRenderer.getCellFromCoords()` 把坐标映射到格子

## 当前扩展点

- `protected`：被卡牌保护的地雷可安全揭示
- `highlighted`：用于探测类卡牌视觉提示
- `isMine` 在后续语义上可映射为“潜伏怪物格”触发标记
- `monsterType/monsterCleared`：怪物类型与结算状态，供战斗与渲染层复用

## 常用接口

- `Grid.revealCell(row, col): boolean`
- `Grid.flagCell(row, col): void`
- `Grid.getNeighbors(row, col): Cell[]`
- `Grid.getStats(): object`
- `GridRenderer.markDirty(cell): void`
- `GridRenderer.render(): void`

## 开发建议

- 任何规则变更优先放到 `Grid`，不要直接改 `Renderer`
- 新增视觉状态时，先补 `Cell` 字段，再补 `GridRenderer` 映射
- 修改胜负判定后，必须回归：
  - 首击安全
  - flood fill
  - 保护格行为
