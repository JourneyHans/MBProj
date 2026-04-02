# 多 AI 任务板（精简版）

适用阶段：P3-B Event System  
目标：把任务拆成可并行、可验收、可直接投喂的 Prompt。

---

## 1) 依赖与合并顺序

1. `AI-EVT-DATA-01`
2. `AI-EVT-CORE-01`（依赖 DATA）
3. `AI-EVT-UI-01`（依赖 CORE）
4. `AI-EVT-QA-01`（可并行准备，最后收口）
5. `AI-EVT-SHOP-SEM-01`（依赖 CORE + UI，用于修正商店触发语义）

---

## 2) 全局硬规则

- 每个 AI 使用独立分支：`feature/<task-id>`
- 不允许修改任务白名单外文件
- 每个任务结束后必须 `commit + push`
- 默认流程是“分支开发 -> 校验通过 -> 自动合并到 `main` -> push `main`”
- 仅 `main` 分支 push 会触发自动发布
- 若校验失败，禁止合并到 `main`，仅回报失败原因

## 2.1 文档更新范围（强约束）

- 功能实现后必须更新“代码所在模块文档”（对应目录 `README.md`）
- 必须同步更新：`RELEASE_NOTES.md`、`ROADMAP.md`、`SMOKE_TEST.md`
- 禁止修改设计文档（除非任务明确要求）：
  - `ACT_STRUCTURE_DESIGN.md`
  - `COMBAT_DESIGN.md`
  - `ENERGY_DRAW_LOOP_DESIGN.md`
  - `CARD_ROLE_MATRIX.md`
  - `EVENT_SYSTEM_DESIGN.md`

---

## 3) 统一回报格式（所有任务）

1. 修改文件列表  
2. 关键实现点（3~6条）  
3. 验证步骤与结果  
4. 未完成项与风险  
5. Git 证据（必须）：
   - `git status -sb`
   - `git log -1 --oneline`
   - `git push` 原始输出
   - 合并到 `main` 与 `push main` 的原始输出（失败也要给）

---

## 4) 任务卡与可投喂 Prompt

## 4.1 AI-EVT-DATA-01

**目标**：落地事件/商店/怪物分层的数据定义与参数配置。

**允许修改**：
- `js/data/monsterDefinitions.js`
- `js/data/` 下新增事件定义文件
- `js/config.js`（仅新增事件参数）
- `js/data/README.md`

**禁止修改**：
- `js/core/Game.js`
- `index.html`
- `css/main.css`
- 其他未列出文件

**必须实现**：
- 事件类型：`enemy/npc/reward/boss`
- 子类型：`easy/hard/elite/merchant/chest_gold/rest/chest_card/boss`
- Boss 门槛参数：`requiredBattles`、`requiredHardOrElite`
- 商店多档位与刷新成本
- 战斗收益递增：普通 < 困难 < 精英

**DoD**：
- 核心层可读取并按类型查询
- 无循环依赖
- 文档字段说明已同步

**Prompt（直接投喂）**：
```text
你负责 Task: AI-EVT-DATA-01。

目标：
落地事件/商店/怪物分层的数据定义与参数配置。

允许修改：
- js/data/monsterDefinitions.js
- js/data/ 下新增事件定义文件
- js/config.js（仅新增事件参数）
- js/data/README.md

禁止修改：
- js/core/Game.js
- index.html
- css/main.css
- 其他未列出文件

必须满足：
1) 事件类型与子类型完整
2) Boss 门槛参数可配置
3) 商店多档位与刷新费用可配置
4) 敌人收益满足普通 < 困难 < 精英

交付动作（强制）：
1) git add && git commit
2) git push 到 feature/ai-evt-data-01（或当前任务分支）
3) 输出 git status -sb
4) 输出 git log -1 --oneline
5) 输出 git push 原始结果
6) 更新文档：js/data/README.md + RELEASE_NOTES.md + ROADMAP.md + SMOKE_TEST.md
7) 运行最小校验（至少保证无明显报错）
8) 校验通过后，合并到 main 并 push main；若失败则禁止合并并回报原因

完成后按统一回报格式输出。
```

---

## 4.2 AI-EVT-CORE-01

**目标**：在 `Game` 主流程接入事件状态机与 Boss gate。

**允许修改**：
- `js/core/Game.js`
- `js/core/README.md`
- `js/roguelike/README.md`（必要时）

**禁止修改**：
- `js/data/` 定义文件
- `index.html`
- `css/main.css`
- 其他未列出文件

**前置依赖**：`AI-EVT-DATA-01`

**必须实现**：
- 事件状态：`hidden -> revealed -> pending -> resolved`
- Boss gate：
  - 发现 Boss
  - 战斗事件数 >= N
  - 至少 1 次困难/精英
- 不回退现有卡牌与战斗交互

**DoD**：
- gate 阻挡/放行可复现
- 主循环可持续：翻格 -> 事件 -> 处理 -> 翻格
- 文档同步

**Prompt（直接投喂）**：
```text
你负责 Task: AI-EVT-CORE-01。

目标：
在 Game 主流程接入事件状态机与 Boss gate。

允许修改：
- js/core/Game.js
- js/core/README.md
- js/roguelike/README.md（必要时）

禁止修改：
- js/data/ 定义文件
- index.html
- css/main.css
- 其他未列出文件

前置依赖：
- AI-EVT-DATA-01

必须满足：
1) 事件状态流完整
2) Boss gate 三条件生效
3) 不回退现有战斗与卡牌交互

交付动作（强制）：
1) git add && git commit
2) git push 到 feature/ai-evt-core-01（或当前任务分支）
3) 输出 git status -sb
4) 输出 git log -1 --oneline
5) 输出 git push 原始结果
6) 更新文档：js/core/README.md + RELEASE_NOTES.md + ROADMAP.md + SMOKE_TEST.md
7) 运行最小校验（至少保证无明显报错）
8) 校验通过后，合并到 main 并 push main；若失败则禁止合并并回报原因

完成后按统一回报格式输出。
```

---

## 4.3 AI-EVT-UI-01

**目标**：实现事件展示与商店最小可用 UI（多档位/刷新/回访）。

**允许修改**：
- `index.html`（仅事件/商店容器）
- `css/main.css`（仅事件/商店样式）
- `js/core/Game.js`（仅 UI 接线）
- `js/ui/README.md`

**禁止修改**：
- `js/data/` 定义文件
- `js/cards/` 目录
- 其他未列出文件

**前置依赖**：`AI-EVT-CORE-01`

**必须实现**：
- 翻开事件后展示类型信息
- 商店多档位商品展示
- 刷新按钮（金币消耗）
- 同幕可回访商店

**DoD**：
- 购买/刷新/回访完整可跑
- 金币不足反馈清晰
- 不影响现有卡牌 UI 主流程

**Prompt（直接投喂）**：
```text
你负责 Task: AI-EVT-UI-01。

目标：
实现事件展示与商店最小可用 UI（多档位/刷新/回访）。

允许修改：
- index.html（仅事件/商店容器）
- css/main.css（仅事件/商店样式）
- js/core/Game.js（仅 UI 接线）
- js/ui/README.md

禁止修改：
- js/data/ 定义文件
- js/cards/ 目录
- 其他未列出文件

前置依赖：
- AI-EVT-CORE-01

必须满足：
1) 事件展示可用
2) 商店多档位可用
3) 刷新与金币消耗可用
4) 同幕可回访

交付动作（强制）：
1) git add && git commit
2) git push 到 feature/ai-evt-ui-01（或当前任务分支）
3) 输出 git status -sb
4) 输出 git log -1 --oneline
5) 输出 git push 原始结果
6) 更新文档：js/ui/README.md + RELEASE_NOTES.md + ROADMAP.md + SMOKE_TEST.md
7) 运行最小校验（至少保证无明显报错）
8) 校验通过后，合并到 main 并 push main；若失败则禁止合并并回报原因

完成后按统一回报格式输出。
```

---

## 4.4 AI-EVT-QA-01

**目标**：收口文档与测试，确保规则口径一致且可回归。

**允许修改**：
- `SMOKE_TEST.md`
- `README.md`
- `ROADMAP.md`
- `RELEASE_NOTES.md`
- `DEVELOPMENT_GUIDE.md`

**禁止修改**：
- 任意 `js/` 业务代码
- `index.html`
- `css/main.css`

**必须实现**：
- 新行为补齐到 smoke
- 导航与文档入口对齐
- 多 AI 协作规范与发布要求一致

**DoD**：
- 文档无口径冲突
- smoke 覆盖新增核心流程
- 变更记录可追踪

**Prompt（直接投喂）**：
```text
你负责 Task: AI-EVT-QA-01。

目标：
收口文档与测试，确保规则口径一致且可回归。

允许修改：
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
2) 文档导航可找到相关设计文档
3) 协作规范与发布触发规则一致

交付动作（强制）：
1) git add && git commit
2) git push 到 feature/ai-evt-qa-01（或当前任务分支）
3) 输出 git status -sb
4) 输出 git log -1 --oneline
5) 输出 git push 原始结果
6) 仅更新允许范围文档，禁止改设计文档
7) 运行最小校验（检查文档一致性与 smoke 条目）
8) 校验通过后，合并到 main 并 push main；若失败则禁止合并并回报原因

完成后按统一回报格式输出。
```

---

## 4.5 AI-EVT-SHOP-SEM-01

**目标**：将商店从“常驻可进”修正为“商人事件触发后可进且可回访”。

**允许修改**：
- `js/core/Game.js`
- `js/data/eventDefinitions.js`
- `js/core/README.md`
- `js/data/README.md`
- `js/ui/README.md`
- `RELEASE_NOTES.md`
- `ROADMAP.md`
- `SMOKE_TEST.md`

**禁止修改**：
- 设计文档：`ACT_STRUCTURE_DESIGN.md`、`COMBAT_DESIGN.md`、`ENERGY_DRAW_LOOP_DESIGN.md`、`CARD_ROLE_MATRIX.md`、`EVENT_SYSTEM_DESIGN.md`
- `index.html`（除非确有必要且任务说明明确）
- `css/main.css`（除非确有必要且任务说明明确）
- 其他未列出文件

**必须满足**：
1) 商店不可在开局直接进入（未触发商人事件前禁用）
2) 只有触发商人事件后，商店入口才开放
3) 已触发商人事件在同一幕内可回访
4) 不能破坏现有战斗、Boss gate、奖励发放逻辑

**DoD**：
- 新局开始时商店入口不可进入
- 首次触发商人事件后可进入商店
- 触发后可多次回访且刷新/购买流程正常
- `SMOKE_TEST.md` 增加对应回归项

**Prompt（直接投喂）**：
```text
你负责 Task: AI-EVT-SHOP-SEM-01。

目标：
将商店从“常驻可进”修正为“商人事件触发后可进且可回访”。

允许修改：
- js/core/Game.js
- js/data/eventDefinitions.js
- js/core/README.md
- js/data/README.md
- js/ui/README.md
- RELEASE_NOTES.md
- ROADMAP.md
- SMOKE_TEST.md

禁止修改：
- 设计文档：ACT_STRUCTURE_DESIGN.md、COMBAT_DESIGN.md、ENERGY_DRAW_LOOP_DESIGN.md、CARD_ROLE_MATRIX.md、EVENT_SYSTEM_DESIGN.md
- index.html（除非确有必要且任务说明明确）
- css/main.css（除非确有必要且任务说明明确）
- 其他未列出文件

必须满足：
1) 商店在未触发商人事件前不可进入
2) 触发商人事件后才开放商店
3) 已触发商人事件在同一幕可回访
4) 不破坏战斗、Boss gate、金币结算等既有流程

交付动作（强制）：
1) git add && git commit
2) git push 到 feature/ai-evt-shop-sem-01（或当前任务分支）
3) 输出 git status -sb
4) 输出 git log -1 --oneline
5) 输出 git push 原始结果
6) 更新文档：对应模块 README + RELEASE_NOTES.md + ROADMAP.md + SMOKE_TEST.md
7) 运行最小校验（至少保证无明显报错）
8) 校验通过后，合并到 main 并 push main；若失败则禁止合并并回报原因

完成后按统一回报格式输出。
```
