# 横版 PDF 看板构建说明

## 最终交付

- 文件：`output/pdf/野人先生_AI设备维修协同方案看板.pdf`
- 画布：16:9 横版，1152 × 648 pt（16 × 9 in）
- 页数：44 页
- 文件大小：7.43 MB
- SHA-256：`4cd22493ffa0eb2de6d6dc5d0b50405eb9a3bf7cb423bffeffdee81995a084a3`

## 构建方式

PDF不是把网页直接压缩成12张截图，而是由 `scripts/build-standalone-pdf.mjs` 在完全离线环境中读取 Standalone HTML 的真实DOM、固定演示数据和确定性状态，重新编排为横版分页文档：

1. 复用12章原有页面、图片和Design Tokens；
2. 读取12个产品模块在指定场景与角色下的真实渲染结果；
3. 将8张数据表的字段类型和Demo模拟记录展开为独立页面；
4. 将5个验证场景推进至最终状态并保留时间线与后端变化；
5. 使用 Chromium 输出带内部链接的横版PDF；
6. 使用 `pypdf` 添加文档元数据和书签目录。

构建命令：

```bash
npm run build:standalone-pdf
```

自动检查：

```bash
npm run test:standalone-pdf
```

## 页面结构

- 封面与章节总览：2页；
- 01—08章及流程放大/机制展开：12页；
- 09章产品目录、12个产品模块、数据底座与8张业务表：22页；
- 10章场景目录与5条验证路径：6页；
- 11—12章：2页。

## 关键文件

- `scripts/build-standalone-pdf.mjs`：采集、分页编排和PDF渲染；
- `scripts/add-pdf-bookmarks.py`：书签与元数据；
- `scripts/test-standalone-pdf.mjs`：页数、文本、链接、书签和业务内容检查；
- `screenshots/standalone-pdf/contact-sheet-final.png`：44页视觉总览；
- `screenshots/standalone-pdf/final-module-16.png`：产品模块页放大检查。

