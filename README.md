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

早期开发中，采用「本地优先 + 面向接口 + 分层解耦」架构，从最小 demo 渐进迭代。详见文档。

## 文档

| 文档 | 用途 |
| --- | --- |
| [docs/PROJECT_PLAN.md](./docs/PROJECT_PLAN.md) | 项目架构与规划 |
| [docs/ENGINEERING_STANDARDS.md](./docs/ENGINEERING_STANDARDS.md) | 程序架构设计与编码标准 |
| [docs/TASK.md](./docs/TASK.md) | 任务看板 |
| [docs/MEMORY.md](./docs/MEMORY.md) | 开发记忆与错误归纳 |
| [docs/AGENT_WORKFLOW.md](./docs/AGENT_WORKFLOW.md) | AI agent 行事标准与工作流 |

## 参与开发（人类或 AI agent）

本项目为文档驱动、多 agent 协作。开始前请先阅读 [AGENTS.md](./AGENTS.md) 与 [docs/AGENT_WORKFLOW.md](./docs/AGENT_WORKFLOW.md)。

## 许可

见 [LICENSE](./LICENSE)。
