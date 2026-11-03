# 绒光冒险 · UI 素材与样式

本次只提交 UI，不包含人物、行走动画、战斗逻辑或游戏发布配置。

- `assets/embroidered-panel.webp`：粉彩纸张与刺绣布边，含星叶、花朵和末末角饰。
- `theme.css`：现有界面使用的样式，已移除对人物立绘及场景封面的图片依赖。
- `index.html`：独立组件预览，可查看 HUD、按钮、技能卡片及剧情面板。

## 查看预览

在仓库根目录执行 `python -m http.server 8000`，打开 `http://localhost:8000/ui/`。GitHub 中保存的是源文件，不会自动启用 GitHub Pages 或更新现有游戏。

## 接入现有游戏

此样式沿用现有游戏的 `.panel`、`.card`、`.choice`、`#hud`、`#quest`、`#skills`、`#burst` 等选择器。CSS 中纸张边框使用 `border-image` 九宫格拉伸；文字与按钮仍由 HTML 控制。

人物和动画需要单独确认后接入，本目录无人物图和动作文件。
