# 线上版本与本地版本差异审计

## Source of Truth

- 产品界面视觉、中文文案、布局、状态标签、表单字段与线上模拟主数据：Vercel线上版本。
- 业务类型、AI结构、路由规则、状态机、SLA和权限约束：当前项目 `lib/` 与Showcase Sandbox。
- 方案章节内容与视觉：当前 `/showcase`。

## 已确认差异

| 项目 | 线上版本 | 当前本地Showcase | Standalone选择 |
| --- | --- | --- | --- |
| 产品壳层 | 顶部角色切换 + 左侧角色导航 | LiveProduct展示框 + 页面级预览控制 | 采用线上系统壳层；外部保留离线看板控制 |
| 首页数据 | 20张模拟工单等线上实时模拟状态 | 本地数据库可能因Demo操作变化 | Standalone不复制实时数量到产品结果；主数据采用线上口径 |
| 设备 | 3店9设备 | 早期Showcase沙盒仅含部分设备 | Standalone补齐线上9台设备 |
| 责任方 | 6个模拟责任方 | 早期Showcase沙盒核心使用3个 | Standalone补齐6个 |
| 工单编号 | `WO-20260719-*` | Showcase使用固定沙盒编号 | Standalone保留线上格式，离线新单使用 `WO-20260719-OFF001` 明确为离线模拟 |
| 产品页面 | 真实路由页面，写API/数据库 | React reducer沙盒 | Standalone采用内嵌DOM和内存状态机，禁止API |
| Demo入口 | 线上存在 `/demo` | Showcase存在跳转按钮 | Standalone全部删除 |

## 未采用的本地页面

- 没有把本地 `components/showcase/live-product.tsx` 的展示框视觉作为最终产品基准。
- 没有打包 `components/app-shell.tsx` 的路由/API耦合页面。
- 没有采用本地数据库当前运行状态、操作后工单数量或时间戳。
- 没有保留 `/demo`、首页、外部链接和服务器功能。

## 不能1:1的部分

- 无法确认线上部署commit，因此不能从精确commit直接打包React页面；采用线上DOM、文案与截图建立离线DOM适配层。
- Standalone不具备数据库持久化、真实通知发送和线上路由；这些行为以同字段、同状态和同规则的内存状态机演示。
- 线上时间相关值会继续变化；Standalone使用固定时间，保证可重复演示。
- `docs/showcase/reference/data-backend-ui.jpeg` 在当前项目及附件中不存在；09B按用户描述的三栏数据库工作台结构实现，没有猜测第三方品牌。
