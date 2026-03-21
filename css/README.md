# css 模块开发文档

`css/` 负责项目视觉样式与响应式适配。

## 当前文件

- `main.css`：主样式文件（HUD、菜单、对话框、卡牌区、移动端适配）

## 样式分层（当前约定）

1. 全局重置与基础布局
2. HUD / 菜单 / 对话框
3. 移动端响应式（`@media`）
4. 卡牌系统样式
5. 状态样式（如 `card-selected`、`card-confirm`）
6. 怪物化扫雷阶段状态样式（规划）

## 关键状态类

- `.card-unplayable`
- `.card-selected`
- `.card-confirm`
- `#hand-container.targeting-mode`
- `#git-version-badge`

## 开发建议

- 新增样式时优先复用已有状态类，减少内联样式
- 交互态样式命名统一使用 `card-*` 或 `*-mode`
- 移动端改动后需要在竖屏/横屏都验证布局
- 后续新增敌方与回合 UI 时，优先保证可读性而非装饰复杂度
