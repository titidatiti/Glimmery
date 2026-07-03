<p align="center">
  <img src="./public/icon.png" alt="Glimmery" width="96">
</p>

# Glimmery

*Where every glimmer becomes memory.*

*微光汇聚，字句成行。*

「微光汇聚，字句成行」——做极致的减法，让创作的空间中只有创作。愿你的灵感微光，都能融汇成美好的记忆，留在这里。

## 功能

这是一款追求极致沉浸式写作的 Web 应用，拥有极致简洁优雅的响应式界面，丰富的配色方案，支持 Markdown 格式。

**现已支持**

- **Markdown 写作**：Typora 式所见即所得编辑
- **本地自动保存**：文稿保存在设备本地（IndexedDB），离线可用
- **配色主题**：多套预设主题，支持自定义配色
- **字体与排版**：字号、行距、字体等可在设置中调整
- **响应式布局**：从桌面、平板到手机均可使用；手机端支持侧栏横滑、横屏优化与 PWA 安装
- **Google Drive 云同步**：文稿与自定义配色备份至 Drive 应用专用空间；支持自动/手动备份与恢复（需在 `.env.local` 配置 `VITE_GOOGLE_CLIENT_ID`）

**即将支持**

- 白噪音 BGM
- 打字音效

## 快速开始

环境要求：Node.js 18+

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。局域网内其他设备可通过终端显示的 Network 地址访问。

## 部署

构建产物输出到 `dist/`，将目录托管为静态站点即可。

### 自建（站点根路径）

```bash
npm run build
npm run preview   # 本地预览，可选
```

默认 `base` 为 `/`。若需修改，在项目根目录创建 `.env` 并设置 `VITE_BASE_PATH`（参见 `.env.example`）。

### GitHub Pages（子路径 `/Glimmery/`）

```bash
npm run build:pages
```

`build:pages` 使用 Vite 的 `pages` 模式，需在项目根目录提供 `.env.pages`（已 gitignore），例如：

```
VITE_BASE_PATH=/Glimmery/
```

将 `dist/` 内容发布到 Pages 即可。
