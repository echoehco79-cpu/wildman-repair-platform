# Standalone Showcase Interaction Tests

## 环境

- Next.js服务已停止，localhost连接失败符合预期。
- Chromium离线模式开启。
- 通过 `file://` 直接加载最终HTML。
- 监听全部网络请求、console error和page error。

## 自动结果

`npm run test:standalone-showcase`：**81/81通过**。

覆盖：

- 单HTML、内联CSS/JS/图片、12章、总览、横向导航。
- 顶部01—12逐项点击后，目标章节均占满视口且存在可见内容；总览点击01可返回第一章，不再出现空白画布。
- 章节轨道禁止鼠标滚轮、触摸板横向手势和方向键翻页；顶部章节索引、总览和底部上一页/下一页按钮可显式切换章节。
- To-Be主图宽度、图片放大、14个顺序节点、责任/处理/输出/下一责任人说明和内嵌系统页面联动。
- To-Be验证器具备真实纵向滚动，长内容能够到达对应产品页面。
- 无Next、localhost、Demo、Vercel、HTTP、绝对路径、敏感字段。
- 09A/09B、8表切换、Asset 9条记录、表/记录搜索、字段菜单、详情抽屉、数据流切表。
- 智能报修、AI字段、AI v1/v2、人工原因必填、人工派发。
- 390px产品预览宽度与内部滚动宽度一致，无表单控件横向溢出。
- 第09章产品窗口使用独立纵向滚动；鼠标在产品窗口内滚动不会触发章节变化。
- 供应商接单、开始处理、维修结果、权限前置条件。
- 验收原因必填、同一工单返修、二次维修、二次验收、设备履历。
- P1即将超时、已超时、改派与责任变更日志。
- 五场景确定性运行、上一/下一、刷新恢复。
- 打印媒体、零外部请求、零控制台错误。

## 截图

`screenshots/standalone-showcase/`

- `standalone-09A-product.png`
- `standalone-09A-product-1024.png`
- `standalone-09B-backend.png`
- `standalone-10-scenarios.png`
- `standalone-03-as-is.png`
- `standalone-06-to-be.png`
- `standalone-06-to-be-1024.png`
- `standalone-12-summary.png`
- `standalone-mobile-390.png`
- `standalone-mobile-06.png`
- `overview.png`
- `print-preview.png`
