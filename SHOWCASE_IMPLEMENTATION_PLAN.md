# Showcase 实施计划

## Scope Lock

只新增 `/showcase` 路由、展示组件、展示样式、展示文档、静态素材和沙盒测试。不得修改 `/demo`、门店端、维修管理端、供应商端、运营端、API、数据库、种子数据、业务规则、状态机或权限结果。

## 技术路径

1. 新增静态优先路由 `app/showcase/page.tsx`，不改现有 catch-all 路由。
2. 以 1440×810 为基准创建 12 个 16:9 章节，桌面横向 scroll snap，移动端纵向完整浏览。
3. 建立章节配置、证据标签、固定导航、进度、总览、全屏、章节链接、图片灯箱与横版打印。
4. 第06、08、09、10章使用 Showcase Sandbox：
   - 复用 `lib/types.ts` 的真实类型和 AI Schema；
   - 复用 `lib/ai.ts` 的本地确定性 AI；
   - 复用 `lib/state-machine.ts` 的状态机校验；
   - 复用 `lib/sla.ts` 的 SLA 计算；
   - 复用与 Demo 相同的规则编号、字段名、角色和固定场景；
   - 仅使用 React 页面级状态，不调用写库 API。
5. 第09章提供产品链路、统一工单、10个可操作视图与7个模块详情。
6. 第10章提供五场景互动验证器、状态时间线、自动播放、暂停、重置和结果边界。
7. 使用 `public/showcase` 中全部指定素材，支持灯箱和失败占位；流程图中的假 Logo 仅在展示层遮盖。
8. 完成两轮视觉审查、五视口截图、内容审计、组件复用审计、交互矩阵和质量门禁。

## 验收门禁

- 12章存在且顺序固定。
- 07—10章默认状态可理解核心产品逻辑，详情通过交互展开。
- As-Is、Demo、待企业验证标签准确。
- 无未经来源支持的数字、团队经历或企业制度。
- `/demo` 与原业务路由行为不变。
- 1440×810、1920×1080、1366×768、1024×768、390×844 可用。
- lint、typecheck、26项测试和 production build 通过。

## 输出

- `/showcase`
- 13张章节/总览截图
- `SHOWCASE_CONTENT_SOURCE.md`
- `SHOWCASE_IMPLEMENTATION_PLAN.md`
- `SHOWCASE_BUILD_STATUS.md`
- `SHOWCASE_VISUAL_REVIEW.md`
- `SHOWCASE_CONTENT_AUDIT.md`
- `SHOWCASE_KNOWN_LIMITATIONS.md`
- `SHOWCASE_COMPONENT_REUSE_AUDIT.md`
- `SHOWCASE_INTERACTION_TESTS.md`
- `SHOWCASE_SCENARIO_MATRIX.md`
