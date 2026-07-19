# Showcase Component Reuse Audit

## 结论

Showcase的关键窗口不是静态截图，也不是只切换HTML可见性的假交互。工单状态、AI结果、路由结果、SLA、角色权限和非法转换均由当前项目的真实领域模块执行；全部状态保存在页面级React reducer中，不调用写库API。

## 真实代码复用

| 能力 | 复用来源 | Showcase用途 |
| --- | --- | --- |
| 字段与状态类型 | `lib/types.ts` | `ReportInput`、`AIAnalysis`、`AIAnalysisSchema`、`OrderStatus`、`Role`、`RouteDecision` |
| 输入校验 | `ReportInputSchema` | 门店报修提交 |
| 本地确定性AI | `LocalDeterministicAIProvider` | 正常、缺失、低置信度与温控场景分析 |
| 责任路由 | `routeWorkOrder` | R003、R009、低置信度人工兜底与路由理由 |
| 状态机 | `assertTransition` | 接单、维修、验收、返修、关闭、超时与改派 |
| 角色权限 | `assertRole` | 门店补充/验收、供应商处理、维修管理复核 |
| 供应商隔离 | `assertSupplierAssignment` | 供应商只能操作当前责任方工单 |
| 关闭约束 | `assertCanClose` | 未验收不得关闭 |
| SLA | `calculateAcceptanceDeadline`、`getSlaStatus` | P1/P2/P3 Demo截止时间与显示 |
| Design Tokens / CSS语义 | `app/globals.css` | 字体、品牌色、状态标签、表单、按钮、时间线和工单表面 |

## Live页面映射

| Showcase视图 | 对应真实Demo页面/区域 | 复用方式 |
| --- | --- | --- |
| 门店报修 | `ReportForm` / `/store/report` | 相同字段名、枚举、校验Schema、风险安全提示和提交AI逻辑；沙盒动作替代写库API |
| AI分析 | `OrderDetail` 的AI决策块 | 相同AI Schema、摘要、分类、影响、证据、缺失字段和v1/v2历史 |
| 信息补充 | `Supplements` / `/store/supplements` | 相同COLD-002归属校验、原文保留、重新分析和版本追加 |
| 人工复核 | `ActionButtons` 的 `manualReview` | 相同必填项、角色限制、决策原因和变更日志结构 |
| 统一工单 | `OrderDetail` | 相同四块决策结构、状态摘要、责任方、下一步、SLA和时间线 |
| 供应商任务 | `SupplierBoard` + `ActionButtons` | 相同接单/开始处理/维修结果字段与状态前置条件 |
| SLA超时 | `DemoControl` + `OrderDetail` | 相同Demo SLA、即将超时、已超时、通知与双事件改派 |
| 维修结果 | `ActionButtons` 的 `complete` | 相同实际原因、维修动作、配件和待验收转换 |
| 门店验收 | `ActionButtons` 的 `approve/rejectAcceptance` | 相同通过关闭、不通过原因必填、原工单返修和次数增加 |
| 设备履历 | `AssetDetail` | 相同设备主数据、历史工单、关闭、返修与重复故障指标含义 |

## 最小解耦策略

没有修改 `components/app-shell.tsx`、API、数据库服务或现有路由。原因是这些页面函数内部直接调用写库API，直接挂载会违反Showcase沙盒“不污染SQLite”的要求。

新增 `components/showcase/live-product.tsx` 作为“真实领域逻辑的本地状态适配层”，并使用与原系统相同的CSS类和字段语义。适配层没有重新定义业务状态机、路由规则、AI Schema、SLA或角色权限。

## 功能结果影响

- 对 `/demo` 和全部业务端：无改动。
- 对API、SQLite、种子、状态机、权限、规则：无改动。
- 对Showcase：刷新或重置恢复固定场景；操作前后 `/api/bootstrap` 工单ID、状态和 `updatedAt` 完全一致。
