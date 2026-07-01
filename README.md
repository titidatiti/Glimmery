# Glimmery

一款本地优先的沉浸式 Markdown 写作 Web 应用，支持主题定制与文稿管理。

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
