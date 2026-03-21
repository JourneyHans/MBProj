# MBProj 开发总览

这是一个基于 **怪物化扫雷 + 卡牌构筑** 设计的前端原型项目，当前处于 `v0.3.0-alpha` 开发阶段。

---

## 1. 项目目标

- 将“地雷即失败”重构为“地雷显形为怪物并进入处理流程”
- 让卡牌从可选辅助升级为主解题手段，避免“纯扫雷无卡通关”
- 逐步扩展为可持续的 Roguelike 单局（Run）体验
- 保持模块化结构，降低后续扩展成本

---

## 2. 新人快速开始

### 本地运行

```bash
python -m http.server 8080
```

打开 `http://localhost:8080`。

### 先读这三个文件

1. `ROADMAP.md`（看当前阶段与近期目标）
2. `index.html`（看入口与页面结构）
3. `js/core/Game.js`（看核心流程）

---

## 3. 代码目录指引

### 核心代码

- `js/core/`：主控制器、事件总线、状态机、主循环
- `js/grid/`：网格信息层（揭示/标记/邻格情报）与 Canvas 渲染
- `js/cards/`：卡牌战术层（抽牌、能量、施放、效果执行）
- `js/data/`：数据定义（当前为卡牌定义）
- `js/config.js`：全局配置与平衡参数

### 界面与资源

- `css/`：样式系统（含移动端响应式）
- `assets/`：资源目录（预留）
- `index.html`：应用入口与基础 UI 容器

### 规划中模块（目录已预留）

- `js/roguelike/`：关卡、事件、奖励、Meta 进度（主开发方向）
- `js/player/`：玩家状态、库存、统计
- `js/ui/`：未来拆分专用 UI 组件
- `js/utils/`：未来通用工具函数

---

## 4. 架构概览

### 设计模式

- **发布-订阅模式**：`EventBus` 负责模块解耦通信
- **状态机 + 状态栈**：`StateManager` 管理主状态和临时状态
- **数据与渲染分离**：
  - `Grid` 只关心规则与数据
  - `GridRenderer` 只关心绘制

### 主流程（简化）

1. 页面加载 -> 创建 `Game`
2. `Game.initialize()` 初始化系统并启动 `GameLoop`
3. 用户输入（鼠标/触控）进入 `Game` 统一分发
4. 执行网格信息逻辑并触发卡牌处理逻辑
5. 通过 `EventBus` 更新 HUD / UI
6. `GameLoop` 持续渲染

---

## 5. 文档地图

- `DEVELOPMENT_GUIDE.md`（开发执行规范）
- `js/core/README.md`
- `js/grid/README.md`
- `js/cards/README.md`
- `js/data/README.md`
- `css/README.md`
- `js/roguelike/README.md`（规划）
- `js/player/README.md`（规划）
- `js/ui/README.md`（规划）
- `js/utils/README.md`（规划）

---

## 6. 开发约定（当前）

- 使用 ES Module（`import/export`）
- 业务配置优先放在 `js/config.js`
- 新功能优先通过事件通信，而不是跨模块直接硬调用
- 更新功能时同步更新模块 README 和 `ROADMAP.md`
- 设计与实现需遵守主线约束：不能回到“纯扫雷即可稳定通关”的玩法结构
