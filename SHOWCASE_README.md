# Showcase 使用说明

## 打开

```bash
npm run dev
```

浏览器访问：

```text
http://localhost:3000/showcase
```

可使用hash直达章节，例如：

```text
http://localhost:3000/showcase#product-features
http://localhost:3000/showcase#demo-validation
```

## 导航

- 鼠标滚轮、触控板横向滑动、左右方向键：切换章节。
- 顶部 `01—12`：跳转指定章节。
- 底部“上一页 / 下一页”：顺序翻页。
- “复制链接”：复制当前章节hash。
- “总览”：显示12章总览；Esc或按钮返回当前章节。
- “全屏”：进入浏览器全屏。
- 图片：点击放大；Esc关闭。
- “进入系统Demo”：跳转 `/demo`。

## 产品窗口

- 1440 / 1024 / 390：切换产品预览宽度。
- 缩放：在固定窗口内缩小内容。
- 全屏：只放大当前产品窗口。
- 重置：恢复当前固定沙盒场景。
- 页面标签：切换门店报修、AI、补充、复核、工单、供应商、SLA、维修、验收和履历。

## 场景验证器

第10章选择五个场景后，可使用：

- 上一步（恢复当前场景初始态）
- 下一步
- 自动演示
- 暂停
- 重置
- 进入完整Demo

## 导出横版PDF

使用浏览器打印：

1. 打开 `/showcase`；
2. 选择“打印”；
3. 目标选择“另存为PDF”；
4. 布局选择“横向”；
5. 建议开启“背景图形”；
6. 纸张可用A4横向；每章自动分页。

打印样式会隐藏导航与交互控件，保留12章核心内容。

## 截图与回归

```bash
node scripts/capture-showcase.mjs
node scripts/test-showcase.mjs
```

截图输出：`screenshots/showcase/`
