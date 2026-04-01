# 多 AI 并行开发任务板（P3-B / Event System）

本任务板用于将同一阶段功能拆分给多个 AI 并行实现。  
目标是降低冲突、提高可验收性，并避免“真人任务单”在 AI 场景下的信息缺失问题。

---

## 0. 使用原则（AI-First）

- 不使用“工时估算”作为核心字段，改用“依赖关系 + 验收条件”控制进度
- 每个任务必须限定“允许修改文件”，减少跨模块误改
- 每个任务必须附带可直接执行的提示词模板（Prompt）
- 每个任务必须定义 DoD（Definition of Done），可由测试项判定
- 提交前必须同步文档与冒烟清单（若行为变更）
- 每个 Prompt 必须包含“提交并 push”的后置指令，不允许只停留在本地提交

## 0.1 Prompt 通用后置指令（建议直接追加到每个任务 Prompt 末尾）

```text
交付动作（必须执行）：
1) git add/commit
2) git push 到你的任务分支
3) 输出 git status -sb、git log -1 --oneline、git push 结果
4) 若目标是触发发布，再执行合并到 main 并 push main
```

---

## 1. 任务依赖图

- `AI-EVT-DATA-01`（事件/商店/怪物数据骨架）为多数任务前置
- `AI-EVT-CORE-01`（核心状态机）依赖 `AI-EVT-DATA-01`
- `AI-EVT-UI-01`（事件/商店 UI）依赖 `AI-EVT-CORE-01`
- `AI-EVT-QA-01`（测试与文档收口）可并行跟进，但最终在其余任务后收敛

---

## 2. 统一提交与回报格式

## 2.1 提交信息前缀

- `feat:` 新功能
- `fix:` 修复行为
- `docs:` 文档更新
- `test:` 测试与清单更新

## 2.2 回报格式（所有 AI 必须输出）

1. 修改文件列表  
2. 关键实现点（3~6 条）  
3. 验证步骤与结果  
4. 未完成项与风险（如有）  
5. Git 交付证据（必须）：
   - `git status -sb`
   - `git log -1 --oneline`
   - `git push` 输出（含远端分支）
   - 若目标是发布：说明是否已形成 `main` 分支 push

## 2.3 发布触发说明（强制认知）

- 本项目部署触发条件：`main` 分支 push（或手动触发）
- AI 推送到 `feature/*` 仅完成代码交付，不会自动发布
- 需要发布时，必须执行“合并到 `main` + push `main`”

---

## 3. AI-A（Data）任务卡

### Task ID

`AI-EVT-DATA-01`

### 目标（单句）

落地事件系统的数据定义与参数配置，形成 core 可直接消费的数据层。

### 允许修改文件

- `js/data/monsterDefinitions.js`
- `js/data/` 下新增事件相关定义文件（如 `eventDefinitions.js`、`shopDefinitions.js`）
- `js/config.js`（仅新增事件参数，不重构其他配置）
- `js/data/README.md`

### 禁止修改文件

- `js/core/Game.js`
- `index.html`
- `css/main.css`
- 除上述范围外的任意业务代码

### 前置依赖

无

### 实现要求（必须）

- 定义事件分类：`enemy / npc / reward / boss`
- 定义事件子类型：`easy / hard / elite / merchant / chest_gold / rest / chest_card / boss`
- 提供 Boss 门槛参数：`requiredBattles`、`requiredHardOrElite`
- 提供商店多档位与刷新成本配置
- 提供敌人分层金币收益配置（普通 < 困难 < 精英）

### 验收标准（DoD）

- 核心层可通过统一接口读取事件定义与数值配置
- 不引入循环依赖
- `js/data/README.md` 同步说明新字段含义

### 可直接投喂的 Prompt

```text
你负责 Task: AI-EVT-DATA-01。

目标：
落地事件系统的数据定义与参数配置，形成 core 可直接消费的数据层。

你只能修改这些文件：
- js/data/monsterDefinitions.js
- js/data/ 下新增事件相关定义文件（eventDefinitions.js / shopDefinitions.js 等）
- js/config.js（仅新增事件参数）
- js/data/README.md

禁止修改：
- js/core/Game.js
- index.html
- css/main.css
- 其他未列出的文件

必须满足：
1) 事件类型与子类型字段完整可用
2) Boss 门槛参数可配置
3) 商店多档位与刷新费用可配置
4) 敌人金币收益保持普通 < 困难 < 精英

验收标准：
- 核心层能读取配置并按类型查询
- 无循环依赖
- 文档已同步

完成后请输出：
1) 修改文件列表
2) 关键实现点
3) 验证步骤与结果
4) 残留风险
```

---

## 4. AI-B（Core）任务卡

### Task ID

`AI-EVT-CORE-01`

### 目标（单句）

在 `Game` 主流程中接入事件状态机与 Boss 解锁门槛。

### 允许修改文件

- `js/core/Game.js`
- `js/core/README.md`
- `js/roguelike/README.md`（如涉及接口口径补充）

### 禁止修改文件

- `js/data/` 定义文件（由 Data 任务负责）
- `index.html`
- `css/main.css`

### 前置依赖

- `AI-EVT-DATA-01`

### 实现要求（必须）

- 增加事件状态流：`hidden -> revealed -> pending -> resolved`
- 实现 Boss gate 判定：
  - 已发现 Boss
  - 战斗事件完成数 >= N
  - 至少 1 次困难/精英战斗
- 保持现有卡牌战斗主循环不回退
- 不破坏当前 smoke 中已覆盖的交互行为

### 验收标准（DoD）

- 未满足 gate 无法进入 Boss
- 满足 gate 可进入 Boss
- 事件处理后可以继续探索，主循环不断裂
- `js/core/README.md` 文档同步

### 可直接投喂的 Prompt

```text
你负责 Task: AI-EVT-CORE-01。

目标：
在 Game 主流程中接入事件状态机与 Boss 解锁门槛。

你只能修改这些文件：
- js/core/Game.js
- js/core/README.md
- js/roguelike/README.md（如需补充接口口径）

禁止修改：
- js/data/ 下定义文件
- index.html
- css/main.css
- 其他未列出的文件

前置依赖：
- 已完成 AI-EVT-DATA-01 的配置结构

必须满足：
1) 事件状态流完整：hidden/revealed/pending/resolved
2) Boss gate 三条件生效
3) 不回退现有战斗与卡牌交互

验收标准：
- gate 阻挡与放行均可复现
- 主循环可继续（翻格 -> 事件 -> 处理 -> 翻格）
- 文档同步完成

完成后请输出：
1) 修改文件列表
2) 关键实现点
3) 验证步骤与结果
4) 残留风险
```

---

## 5. AI-C（UI）任务卡

### Task ID

`AI-EVT-UI-01`

### 目标（单句）

实现事件展示与商店交互 UI（多档位、刷新、可回访）的最小可用版本。

### 允许修改文件

- `index.html`（仅事件/商店相关容器）
- `css/main.css`（仅事件/商店相关样式）
- `js/core/Game.js`（仅事件 UI 接线，避免改动核心战斗逻辑）
- `js/ui/README.md`

### 禁止修改文件

- `js/data/`（由 Data 任务负责）
- `js/cards/`（除非明确需要且另行批准）

### 前置依赖

- `AI-EVT-CORE-01`

### 实现要求（必须）

- 事件翻开后可展示类型信息
- 商店展示低/中/高档位商品
- 刷新按钮可按金币消耗刷新库存
- 已发现商店节点可重复访问

### 验收标准（DoD）

- 商店购买、刷新、回访流程可跑通
- 金币不足反馈清晰
- 不影响现有牌库/弃牌堆全屏覆盖层交互

### 可直接投喂的 Prompt

```text
你负责 Task: AI-EVT-UI-01。

目标：
实现事件展示与商店交互 UI（多档位、刷新、可回访）的最小可用版本。

你只能修改这些文件：
- index.html（仅事件/商店容器）
- css/main.css（仅事件/商店样式）
- js/core/Game.js（仅 UI 接线）
- js/ui/README.md

禁止修改：
- js/data/ 下定义文件
- js/cards/ 目录
- 其他未列出的文件

前置依赖：
- AI-EVT-CORE-01 已完成事件状态与 gate 接线

必须满足：
1) 翻开事件后可进入对应 UI
2) 商店有多档位商品
3) 刷新可用且消耗金币
4) 同一幕可重复访问商店

验收标准：
- 购买/刷新/回访流程完整
- 金币不足有明确反馈
- 不破坏既有卡牌 UI 交互

完成后请输出：
1) 修改文件列表
2) 关键实现点
3) 验证步骤与结果
4) 残留风险
```

---

## 6. AI-D（QA + Docs）任务卡

### Task ID

`AI-EVT-QA-01`

### 目标（单句）

将事件系统行为落入测试与文档，确保多人/多AI协作后口径仍一致。

### 允许修改文件

- `SMOKE_TEST.md`
- `README.md`
- `ROADMAP.md`
- `RELEASE_NOTES.md`
- `DEVELOPMENT_GUIDE.md`

### 禁止修改文件

- 任意 `js/` 业务代码
- `index.html`
- `css/main.css`

### 前置依赖

- 可并行开始，最终收口依赖 `AI-EVT-DATA-01`、`AI-EVT-CORE-01`、`AI-EVT-UI-01`

### 实现要求（必须）

- 将新增行为补齐到 smoke 检查项
- 对齐根文档导航，避免文档孤岛
- 更新开发规范中的 AI 并行协作约束

### 验收标准（DoD）

- 文档无明显口径冲突
- 冒烟清单可覆盖新增核心行为
- 变更记录可追踪

### 可直接投喂的 Prompt

```text
你负责 Task: AI-EVT-QA-01。

目标：
将事件系统行为落入测试与文档，确保多人/多AI协作后口径一致。

你只能修改这些文件：
- SMOKE_TEST.md
- README.md
- ROADMAP.md
- RELEASE_NOTES.md
- DEVELOPMENT_GUIDE.md

禁止修改：
- js/ 业务代码
- index.html
- css/main.css

必须满足：
1) 新增行为有对应 smoke 项
2) 文档导航可找到新设计文档
3) 开发规范写清 AI 并行协作要求

验收标准：
- 文档之间无口径冲突
- smoke 可覆盖关键新流程
- 变更可追踪

完成后请输出：
1) 修改文件列表
2) 关键实现点
3) 验证步骤与结果
4) 残留风险
```

---

## 7. 合并策略（避免多人/多AI冲突）

- 每个 AI 独立分支：`feature/<task-id>`
- 同一文件尽量只由一个 AI 负责
- 合并顺序建议：
  1. `AI-EVT-DATA-01`
  2. `AI-EVT-CORE-01`
  3. `AI-EVT-UI-01`
  4. `AI-EVT-QA-01`
- 每次合并后立即跑一轮 `SMOKE_TEST.md` 核心流程
- 仅当 `main` 接收新提交并推送后，才视为“已触发发布链路”

---

**结论**：该任务板将“规则设计”转为“可并行开发单元”，并通过文件边界和可判定验收标准降低 AI 协作不确定性。
