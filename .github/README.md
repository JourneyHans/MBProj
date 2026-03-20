# CI/CD 模块说明

`.github/` 用于放置自动化工作流配置。

## 当前工作流

- `.github/workflows/deploy.yml`
  - 触发：`main` 分支 push / 手动触发
  - 动作：构建 Pages 制品并部署
  - 特性：部署时自动生成 `version.json`，用于页面显示提交短哈希

## 维护建议

- 修改部署行为时，优先保持“本地可跑 + 线上可识别版本号”
- 若引入构建步骤，确保产物目录仍被 `upload-pages-artifact` 正确上传
