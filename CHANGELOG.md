# 更新日志

本项目的 notable 变更记录此文件。版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.2.0] - 2026-07-05

### 云同步 · 数据架构升级（v2 → v3）

- **Google Drive 备份布局 v3**：由单文件 `glimmery-documents.json` 改为 manifest 索引 + 按文稿/设置分文件存储，支持增量同步。
- **历史版本**：每篇文稿与用户设置（自定义主题等）在云端保留最多 3 个历史版本；可在「设置 → 云同步 → 云端版本历史」恢复到本地。
- **数据结构迁移**：首次升级时检测云端旧版备份，弹窗引导一次性迁移；用户可选择「稍后」（本会话内暂不使用云同步）。
- **增量拉取**：依据 manifest 与本地 `updatedAt` 仅下载有变动的文件；本地 IndexedDB 缓存上次已知 manifest，减少无效请求。
- **上传前校验**：手动/自动备份前读取 manifest 比对时间戳，云端较新时需用户确认后再覆盖。

### 修复

- 修复 Drive 文件列表 API 调用参数顺序错误，导致数据方案检查误报 JSON 解析失败的问题。
- 修复 v3 manifest 与旧版单文件并存时未提示迁移的问题。

## [0.1.0] - 初始公开版本

- Markdown 沉浸式写作、本地 IndexedDB 存储、主题与排版设置。
- Google Drive 云同步（单文件备份）、自动/手动备份与恢复。

[0.2.0]: https://github.com/titidatiti/Glimmery/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/titidatiti/Glimmery/releases/tag/v0.1.0
