# js 目录说明

`js/` 是项目主代码目录，按“运行核心 / 玩法系统 / 数据定义 / 规划模块”分层。

## 子目录

- `core/`：主流程、状态、循环、事件通信
- `grid/`：网格信息层（揭示、标记、邻格情报、显形触发）
- `cards/`：卡牌战术层（抽牌、能量、目标选择、效果结算）
- `data/`：静态数据定义
- `audio/`：音频管理层（Howler 封装、统一 SFX 入口）
- `effects/`：视觉特效层（Canvas Overlay，短生命周期动效与持久高亮）
- `roguelike/`：Run 级系统（关卡、事件、奖励、存档）
- `player/`：玩家系统（预留）
- `ui/`：通用 UI 组件（预留）
- `utils/`：工具函数（预留）

## 文件

- `config.js`：全局配置中心（平衡参数、状态枚举、颜色）

## 建议阅读顺序

1. `config.js`
2. `core/Game.js`
3. `grid/` -> `cards/`
4. `roguelike/`（规划接口）
5. `data/cardDefinitions.js`
