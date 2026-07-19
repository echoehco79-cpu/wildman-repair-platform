# Standalone Showcase Build

## 核心交付

`dist/野人先生_AI设备维修协同方案看板_Standalone.html`

- 文件大小：4,056,507 bytes（3.87 MB）
- SHA-256：`3e1b2458638ce2752b5384b30d94c26251ce42544d01208ca7d26186022e558c`
- 运行方式：双击，或拖入Chrome/Edge/Safari；使用 `file://` 协议。
- 不需要Node、Next.js、localhost、数据库、API、AI服务或网络。

## 单文件方案

采用方案C：现有Showcase内容转换为原生DOM，确定性产品沙盒使用内嵌JavaScript；构建脚本把CSS、数据、状态机、交互脚本和PNG全部注入同一HTML。

源文件：

- `standalone-showcase/index.html`
- `standalone-showcase/standalone.css`
- `standalone-showcase/standalone-data.js`
- `standalone-showcase/standalone-sandbox.js`
- `standalone-showcase/standalone.js`
- `scripts/build-standalone-showcase.mjs`

构建：

```bash
npm run build:standalone-showcase
```

验收：

```bash
npm run test:standalone-showcase
```

## 内联内容

- CSS、JavaScript、系统中文字体栈
- 用户于2026-07-19提供的新版As-Is与To-Be流程图（Base64）
- 3家模拟门店、9台模拟设备、6个模拟责任方
- AI确定性分析、R001/R003/R009/R010路由规则
- 合法状态机、P1/P2/P3 Demo SLA、角色与供应商隔离
- 五个场景、时间线、通知和数据变化
- 8张数据底座业务表

## 删除的外部入口

最终HTML不包含进入Demo、打开完整Demo、Vercel、localhost、`/demo`、iframe、新窗口、网站首页、登录或外部CTA。

## 打印

浏览器打印时选择“横向”和“背景图形”。`@page`使用16:9横向尺寸，一章一页；导航、控制按钮、弹窗和动画状态隐藏。第09章打印09A和09B核心静态状态，第10章保留场景验证核心信息。

## 最终门禁

- lint：0 warnings / 0 errors
- typecheck：通过
- Vitest：26/26
- Next production build：通过
- Standalone：81/81
- 顶部01—12逐页可见性：12/12
- 总览索引返回第一章：通过
- 390px产品预览横向溢出：无
- 滚轮、触摸板横向滚动和方向键章节切换：已关闭
- 底部上一页/下一页显式按钮：已恢复并通过
- 第06章节点验证器与第09章产品窗口纵向滚动：通过
- Next服务停止后：通过
- 浏览器离线模式：通过
