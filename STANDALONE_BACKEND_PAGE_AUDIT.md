# Standalone 数据后端页面审计

## 页面结构

第09章内部09B使用完整画布，采用三栏数据库工作台：

1. 左栏：Dashboard、Overview、Monitoring、SQL Editor、Tables、Backup & Restore、Data Masking、Data API、Auth、Settings；无第三方品牌。
2. 中栏：8张业务表、表搜索、记录数、关联关系入口。
3. 右栏：字段类型、记录表格、记录搜索、Filters/Sort/Columns/Add record演示、记录详情、分页、场景数据流。

页面标题与副标题使用用户指定文案，并显示Demo模拟数据提示。

## 8张表

- Asset：9条设备，10个指定字段。
- FaultEvent：原始描述、影响、AI置信度、缺失字段、人工标志和状态。
- NotificationLog：通知类型、接收角色、消息、发送时间和状态。
- ResponsibilityParty：6个模拟责任方及服务范围。
- RoutingRule：R001/R003/R009/R010、优先级、条件、责任方、SLA和人工复核。
- StateEvent：状态前后值、操作者、原因和时间。
- Store：3家模拟门店。
- WorkOrder：工单、事件、设备、最终分类/等级/责任方、状态、SLA、维修、验收与返修。

## 交互

- 8表切换、表名搜索、当前表记录搜索。
- 字段类型展示、Columns字段显隐。
- 行hover和点击详情抽屉。
- Filters、Sort、Add record为明确的内存视觉演示，不写数据。
- 查看表说明与关系：Store → Asset → FaultEvent → WorkOrder → StateEvent / NotificationLog；RoutingRule → ResponsibilityParty。

## 安全

没有连接字符串、API Key、环境变量、Token、账号、密码、真实客户、真实供应商隐私或第三方数据库Logo。
