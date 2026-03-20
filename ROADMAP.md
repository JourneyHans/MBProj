# 项目路线图 (Roadmap)

**项目名称**: Minesweeper Deck-Building Roguelike  
**当前版本状态**: v0.3.0-alpha（开发主线，已切换）  
**最后更新**: 2026-03-20

---

## 当前阶段结论

项目已完成 `Phase 2` 的核心收尾并正式切入 `Phase 3`：

- 扫雷核心玩法稳定可用（首击安全、泛洪展开、胜负判定）
- 卡牌系统已接入主循环（Deck/Hand/Card/UI/Effect）
- 5 张基础卡牌均可使用，且效果已接入实际游戏逻辑
- GitHub Pages 自动部署可用，页面可显示构建版本短哈希
- 交互与可维护性收口：统一提示文案、取消交互、debug 开关、冒烟清单
- 状态流与事件命名文档已整理，支持进入 Roguelike 核心开发

> 现阶段定位：**Alpha 可玩版本 + Roguelike 核心起步阶段（v0.3.0-alpha）**。

---

## 进度总览

```text
Phase 1: ████████████████████ 100%  ✅ 完成
Phase 2: ██████████████████░░  90%  ✅ 核心收尾完成
Phase 3: ██░░░░░░░░░░░░░░░░░░  10%  🚧 已启动
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0%  📋 计划中
Phase 5: ░░░░░░░░░░░░░░░░░░░░   0%  📋 计划中

总进度: ██████████░░░░░░░░░░ 50%
```

---

## 已完成里程碑

### Phase 1（已完成）

- 扫雷底层网格逻辑（`Grid` / `Cell`）
- Canvas 渲染器（`GridRenderer`）
- 主循环与状态机（`GameLoop` / `StateManager`）
- 菜单、HUD、胜负对话框
- GitHub Pages 自动部署链路

### Phase 2（进行中，已完成部分）

- 卡牌实体与卡库：`Card`、`CardLibrary`、`cardDefinitions`
- 手牌与牌堆：`Hand`、`Deck`
- 卡牌 UI：渲染、高亮、目标选择、确认施放
- 能量系统：实时刷新与可用性判定
- 卡牌效果接入实战逻辑（已修复）：
  - `scout`：安全揭示（含地雷保护）
  - `shield`：保护格子并在网格生效
  - `mine_detector`：探测高亮并自动清除
  - `extra_life`：踩雷时消耗生命继续
  - `energy_restore`：恢复能量
- HUD 扩展：Lives 显示
- 版本角标：显示当前部署提交短哈希

---

## Phase 2 收尾结果

1. **交互与体验**
   - 卡牌提示文案统一 ✅
   - 目标反馈与目标取消交互（ESC/空白点击/按钮）✅
   - 移动端触控深度打磨 ⏸（延后到后续 UX 专项）

2. **稳定性与可维护性**
   - 清理调试日志并接入统一 debug 开关 ✅
   - 关键流程冒烟测试清单（`SMOKE_TEST.md`）✅
   - 事件命名与状态流文档整理 ✅

3. **文档完善**
   - 模块开发文档持续补充 ✅
   - Release Notes 与 Roadmap 同步更新 ✅

---

## 下一阶段计划（Phase 3，已启动）

`Phase 3` 目标是把“单局可玩”升级为“可持续 Run 体验”：

- 关卡推进与难度曲线（Level）
- 事件系统（Event）
- 奖励与选卡（Reward）
- 玩家成长系统（Perk / Meta）
- 基础存档（LocalStorage）

**进入条件（已满足）**：

- Phase 2 关键交互 bug 收敛 ✅
- 卡牌系统基础机制稳定 ✅
- 文档与配置结构可支持扩展 ✅

---

## 版本规划（更新）

- `v0.1.0-alpha`：扫雷核心（已完成）
- `v0.2.0-alpha`：卡牌系统基础（已完成并收口）
- `v0.3.0-alpha`：Roguelike 核心（当前开发主线）
- `v0.4.0-beta`：内容扩展与 UX 打磨
- `v1.0.0`：正式发布

---

## 开发与验证建议

### 本地运行

```bash
python -m http.server 8080
```

访问：`http://localhost:8080`

### 提交前检查

- 功能流程可跑通（菜单 -> 开局 -> 用卡 -> 胜负）
- 无明显控制台异常
- 右上角版本号显示正确
- 移动端基础触控不回归

### 开发规范（执行）

- 完成功能开发并通过本地检查后，必须执行一次 Git 提交（commit）
- 提交完成后，必须推送到远端分支（push），确保协作与部署链路可追踪

---

## 文档导航

- 总览入口：`README.md`
- 核心模块：`js/core/README.md`
- 网格模块：`js/grid/README.md`
- 卡牌模块：`js/cards/README.md`
- 数据模块：`js/data/README.md`
- 样式模块：`css/README.md`
- 规划中模块：
  - `js/roguelike/README.md`
  - `js/player/README.md`
  - `js/ui/README.md`
  - `js/utils/README.md`

---

**维护说明**：Roadmap 应与代码主线同步更新，不再保留与当前实现明显冲突的状态信息。
