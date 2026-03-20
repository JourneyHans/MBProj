# data 模块开发文档

`js/data/` 存放纯数据定义，避免业务逻辑散落到控制层。

## 当前文件

- `cardDefinitions.js`：基础卡牌定义（MVP）

## 设计原则

- 数据优先：卡牌“配置”与“流程控制”分离
- 定义文件可读性优先，便于策划/开发协作
- 尽量保持字段稳定，避免上层大量 if-else 兼容

## 卡牌定义结构

```js
{
  id: 'energy_restore',
  name: '能量恢复',
  description: '恢复2点能量',
  energyCost: 0,
  type: 'utility',
  targetType: 'none',
  rarity: 'common',
  effect: (target, gameState) => ({ success: true, data: {} })
}
```

## 扩展建议

- 新增字段时同步更新：
  - `Card.js`（实例映射）
  - `CardUI.js`（展示层）
  - 模块文档 `js/cards/README.md`
- 效果中若产生临时视觉状态，建议放到 `data` 返回结构，由 `Game` 统一收口处理
