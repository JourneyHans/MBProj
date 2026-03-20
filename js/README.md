# js 目录说明

`js/` 是项目主代码目录，按“运行核心 / 玩法系统 / 数据定义 / 规划模块”分层。

## 子目录

- `core/`：主流程、状态、循环、事件通信
- `grid/`：扫雷逻辑与渲染
- `cards/`：卡牌系统
- `data/`：静态数据定义
- `roguelike/`：Roguelike 相关（预留）
- `player/`：玩家系统（预留）
- `ui/`：通用 UI 组件（预留）
- `utils/`：工具函数（预留）

## 文件

- `config.js`：全局配置中心（平衡参数、状态枚举、颜色）

## 建议阅读顺序

1. `config.js`
2. `core/Game.js`
3. `grid/` -> `cards/`
4. `data/cardDefinitions.js`
