# Standalone 数据流联动测试

## 联动顺序

1. 门店提交报修 → FaultEvent新增。
2. AI分析 → FaultEvent写入摘要、置信度、缺失字段或AI版本。
3. 规则命中 → RoutingRule高亮R003/R009/R010。
4. 创建工单 → WorkOrder新增。
5. 状态变化 → StateEvent新增。
6. 发送提醒 → NotificationLog新增。
7. 验收关闭 → WorkOrder更新并关联Asset履历。

## 五场景

| 场景 | 前台机制 | 后端变化 |
| --- | --- | --- |
| 正常自动派单 | AI high → R003 → 供应商A → P2 → 验收关闭 | FaultEvent、RoutingRule、WorkOrder、StateEvent、NotificationLog、Asset履历 |
| 信息缺失 | 缺设备ID → 待补充 → COLD-002 → AI v2 → R009 | 补充前只有FaultEvent；补充后更新事件并新增WorkOrder |
| 低置信度 | low → R010 → 人工原因必填 → 派发 | FaultEvent写low；WorkOrder待人工；StateEvent保留人工前后值 |
| P1超时 | R009 → 即将超时 → 已超时 → 改派 | WorkOrder更新SLA与责任方；StateEvent、NotificationLog新增 |
| 验收返修 | 待验收 → 不通过 → 同单返修 → 再验收 | WorkOrder返修次数+1；多条StateEvent；最终关联Asset履历 |

## 测试结果

- 场景数据流选择器：通过。
- 上一步/下一步切换：通过。
- 对应表高亮和自动切表：通过。
- 刷新恢复固定数据：通过。
- 外部数据库写入：0。
