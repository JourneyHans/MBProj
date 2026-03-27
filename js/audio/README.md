# audio 模块说明

`js/audio/` 负责游戏内音效播放与音频策略统一。

## 当前结构

- `AudioManager.js`：Howler.js 封装层（单例）

## 设计目标

- 对业务层隐藏第三方音频库细节
- 提供统一的 `play(name)` 调用入口
- 支持全局静音和主音量控制
- 在资源缺失或加载失败时静默降级，不影响主流程

## 当前 SFX 事件名（占位）

- `reveal`
- `monsterSpawn`
- `hit`
- `kill`
- `cardPlay`
- `blocked`
- `gameOver`
- `victory`

> 对应资源路径约定：`assets/sfx/<name>.mp3`（可按需替换/补齐）。

## 接入约定

- 由入口初始化：`index.html` 中执行 `AudioManager.init()`
- 由主控制器触发：`Game.js` 内统一调用 `this.audioManager.play(...)`
- 不建议在子系统直接访问 `window.Howl`
