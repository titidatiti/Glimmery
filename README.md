# Glimmery

**Glimmery = Glimmer（微光）+ Memory（记忆）** —— 一款优雅、简约的沉浸式写作 Web 应用。

「微光」象征眼前的屏幕、营地的篝火、头顶的星空，以及创作者的灵光一现；也与独立游戏《微光之镜 - Glimmer in Mirror》概念相通。让写作者进入无干扰、有氛围、专注的心流。

## 核心功能

- 沉浸式写作氛围：优雅简约 UI，多套配色模板，默认夜间模式，支持自定义配色
- Markdown 支持：所见即所得（Typora 式）编辑，输入门槛低
- 音频氛围（阶段二）：打字音效 + 白噪音 BGM，音源可配置
- 云备份（阶段二）：一键同步到 Google Drive
- 工作室协作（阶段三）：多人协作与账户体系

## 技术栈

React 18 + TypeScript + Vite · Milkdown · Zustand · CSS 变量主题 · IndexedDB（本地优先）

## 项目状态

阶段一 MVP 已实现：脚手架、主题系统、沉浸式外壳、Milkdown 编辑器、IndexedDB 本地存储与文稿管理。

## 快速开始

```bash
npm install
npm run dev          # 本地开发（base=/）
npm run build        # 自建部署构建
npm run build:pages  # GitHub Pages 构建（base=/Glimmery/）
npm run lint
npm run test
```

## 许可

见 [LICENSE](./LICENSE)。
