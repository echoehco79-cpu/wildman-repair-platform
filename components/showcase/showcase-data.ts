import {
  Bot,
  ClipboardCheck,
  Clock3,
  FileSearch,
  History,
  Route,
  Send,
  UserCog,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type EvidenceKind =
  | "已确认事实"
  | "合理推断"
  | "行业参照"
  | "待企业验证"
  | "Demo模拟验证";

export type Chapter = {
  id: string;
  number: string;
  title: string;
  act: string;
  source: string;
};

export const chapters: Chapter[] = [
  { id: "business-context", number: "01", title: "业务背景与命题理解", act: "第一幕 · 业务与研究", source: "DeepResearch / 系统需求说明书" },
  { id: "business-impact", number: "02", title: "为什么设备维修是经营问题", act: "第一幕 · 业务与研究", source: "DeepResearch / 需求说明书" },
  { id: "as-is-boundary", number: "03", title: "As-Is流程假设与研究边界", act: "第一幕 · 业务与研究", source: "DeepResearch / AS-IS流程图" },
  { id: "breakpoints", number: "04", title: "核心协同断点", act: "第二幕 · 问题诊断", source: "DeepResearch / 详细设计说明书" },
  { id: "root-causes", number: "05", title: "根因分析", act: "第二幕 · 问题诊断", source: "DeepResearch" },
  { id: "to-be", number: "06", title: "To-Be目标流程", act: "第三幕 · 方案与产品", source: "需求说明书 / To-Be流程图 / 真实Demo页面" },
  { id: "solution-architecture", number: "07", title: "整体解决方案架构", act: "第三幕 · 方案与产品", source: "需求说明书 / 详细设计 / PoC逐表设计" },
  { id: "responsibility-boundary", number: "08", title: "AI、规则、系统、人工分工", act: "第三幕 · 方案与产品", source: "DeepResearch / 真实AI、规则与状态机代码" },
  { id: "product-features", number: "09", title: "核心产品功能", act: "第三幕 · 方案与产品", source: "需求、详细设计 / 当前Demo组件与逻辑" },
  { id: "demo-validation", number: "10", title: "Demo验证结果", act: "第四幕 · 验证、价值与团队", source: "人工验收 / 自动化测试 / 当前Demo" },
  { id: "value-roadmap", number: "11", title: "价值指标与未来落地路径", act: "第四幕 · 验证、价值与团队", source: "DeepResearch / 需求说明书 / 已知限制" },
  { id: "team-summary", number: "12", title: "团队能力与总结", act: "第四幕 · 验证、价值与团队", source: "本项目已完成交付物" },
];

export const businessChain = [
  { label: "中央预处理", detail: "原料与基底预处理", tone: "neutral" },
  { label: "冷链运输", detail: "冷冻基底运输", tone: "sage" },
  { label: "门店制作", detail: "终端制作节点", tone: "orange" },
  { label: "现场出品", detail: "品质与效率兑现", tone: "orange" },
  { label: "顾客体验", detail: "品牌承诺落点", tone: "neutral" },
];

export const roleTasks = [
  {
    role: "门店端",
    tasks: ["扫码/选择设备", "自然语言报修", "信息补充", "进度查看", "门店验收"],
  },
  {
    role: "维修管理端",
    tasks: ["人工复核", "责任确认", "异常处理", "超时监控", "重新定责"],
  },
  {
    role: "供应商端",
    tasks: ["接单", "拒单", "维修处理", "结果提交"],
  },
  {
    role: "运营管理端",
    tasks: ["设备台账", "责任方配置", "路由规则", "运营看板", "设备履历"],
  },
];

export const collaborationFlow = [
  "故障事件",
  "统一维修工单",
  "当前责任方",
  "当前状态",
  "SLA",
  "状态时间线",
];

export const capabilityGroups = [
  {
    title: "AI信息理解",
    tone: "ai",
    items: ["报修信息结构化", "缺失字段识别", "定向追问", "故障分类建议", "业务影响建议", "置信度与证据"],
  },
  {
    title: "确定性规则",
    tone: "rule",
    items: ["设备与门店校验", "保修、区域与供应商路由", "重复故障识别"],
  },
  {
    title: "流程自动化",
    tone: "system",
    items: ["状态机", "SLA计时与超时升级", "通知", "权限", "审计日志"],
  },
  {
    title: "人工协同",
    tone: "human",
    items: ["现场事实确认", "低置信度人工复核", "规则冲突处理", "专业维修执行", "供应商改派", "门店验收"],
  },
];

export const architectureJourney = [
  "门店报修",
  "故障事件",
  "AI分析",
  "规则路由",
  "统一工单",
  "供应商处理",
  "门店验收",
  "设备履历",
];

export const dataLayer = [
  "Store",
  "Asset",
  "ResponsibilityParty",
  "RoutingRule",
  "FaultEvent",
  "WorkOrder",
  "StateEvent",
  "NotificationLog",
];

export const architectureValues = [
  "报修信息结构化",
  "责任判断可解释",
  "三方状态同步",
  "SLA异常可管理",
  "门店验收闭环",
  "设备维修履历沉淀",
];

export const responsibilityColumns = [
  {
    key: "ai",
    title: "AI",
    tagline: "听懂与整理",
    owns: ["理解自然语言与语音转写", "提取故障现象和业务影响", "识别缺失字段并定向追问", "建议分类、优先级、置信度与证据", "生成维修知识摘要草稿"],
    not: ["不虚构设备、供应商和保修", "不做专业维修诊断", "不决定最终责任方", "不关闭工单"],
  },
  {
    key: "rule",
    title: "规则",
    tagline: "确定责任与约束",
    owns: ["检查必填字段", "校验设备与门店", "判断模拟保修", "匹配供应商与区域", "确定SLA等级", "判断强制人工与重复故障"],
    not: ["不替代现场事实", "不替代专业维修判断", "冲突时不擅自选择"],
  },
  {
    key: "system",
    title: "系统",
    tagline: "状态、通知与留痕",
    owns: ["保存原始报修", "创建故障事件与统一工单", "管理状态机和权限", "计算SLA与超时升级", "记录时间戳和责任变化", "归档设备履历"],
    not: ["不绕过状态机", "不把维修完成自动等同关闭", "不覆盖原始信息"],
  },
  {
    key: "human",
    title: "人工",
    tagline: "专业判断与最终确认",
    owns: ["确认现场事实和设备身份", "处理低置信度与规则冲突", "执行专业维修", "处理拒单、改派和异常", "完成门店验收", "审核知识条目"],
    not: ["决策原因不能为空", "不得绕过权限与留痕"],
  },
];

export type ProductModule = {
  id: string;
  title: string;
  icon: LucideIcon;
  role: string;
  trigger: string;
  input: string[];
  process: string[];
  rules: string[];
  ai: string;
  output: string[];
  next: string;
  exceptions: string[];
  breaks: string[];
  scenario: string;
  status: "Demo已实现" | "Demo部分实现" | "未来规划" | "待企业数据校准";
  screenshot: string;
  value: string;
};

export const productModules: ProductModule[] = [
  {
    id: "report",
    title: "智能报修",
    icon: Send,
    role: "门店员工",
    trigger: "现场发现设备异常",
    input: ["门店", "设备", "自然语言描述", "发生时间", "生产影响", "营业影响", "风险标签"],
    process: ["保存原始内容", "校验设备归属", "创建故障事件", "调用AI分析"],
    rules: ["设备可暂不选择", "原始事实不得被后续内容覆盖"],
    ai: "对非结构化描述做信息提取，不生成维修动作。",
    output: ["故障事件", "AI分析任务"],
    next: "AI与系统",
    exceptions: ["设备不明确 → 待补充", "高风险 → 强制人工"],
    breaks: ["信息分散", "专业表单难填写", "转述改变原始事实"],
    scenario: "正常自动派单 / 信息缺失",
    status: "Demo已实现",
    screenshot: "/showcase/store-report.png",
    value: "自然语言进入统一事实链。",
  },
  {
    id: "analysis",
    title: "AI分析与信息补充",
    icon: Bot,
    role: "门店员工 / 维修管理",
    trigger: "故障事件创建或门店补充关键字段",
    input: ["原始描述", "设备台账", "影响选择", "风险标签"],
    process: ["生成标准摘要", "提取现象与影响", "识别缺失字段", "输出置信度与证据", "生成最多3个定向追问"],
    rules: ["缺关键字段不创建正式工单", "低置信度/高风险必须人工", "保留AI v1/v2历史"],
    ai: "输出建议 Schema，与当前 Demo 的 AIAnalysisSchema 一致。",
    output: ["结构化分析", "缺失字段", "追问", "分析版本"],
    next: "门店补充或规则引擎",
    exceptions: ["AI调用失败 → 重试后转人工", "设备门店不匹配 → 阻止路由"],
    breaks: ["信息不完整", "无序反复追问", "表达口径不同"],
    scenario: "信息缺失 / 低置信度",
    status: "Demo已实现",
    screenshot: "/showcase/ai-analysis.png",
    value: "把模糊表达变为可流转数据。",
  },
  {
    id: "routing",
    title: "责任路由与人工复核",
    icon: Route,
    role: "规则系统 / 维修管理",
    trigger: "关键信息完整",
    input: ["设备类别与型号", "门店与区域", "模拟保修", "故障类别", "风险标签", "AI置信度"],
    process: ["按优先级匹配确定性规则", "输出推荐责任方与SLA", "检测冲突", "必要时进入人工复核"],
    rules: ["R003：华中Gelato保修内机械异常", "R009：一般低温温控异常", "R010：人工复核兜底"],
    ai: "AI只提供分类与置信度，不直接决定责任方。",
    output: ["推荐责任方", "紧急等级", "SLA", "规则编号", "路由理由"],
    next: "供应商或维修管理",
    exceptions: ["无规则命中", "同优先级责任方冲突", "低置信度", "高风险"],
    breaks: ["责任边界不清", "派单依赖个人经验", "路由不可解释"],
    scenario: "正常自动派单 / 低置信度",
    status: "Demo已实现",
    screenshot: "/showcase/manager-review.png",
    value: "把责任判断变成可解释规则。",
  },
  {
    id: "supplier",
    title: "供应商协同",
    icon: Wrench,
    role: "供应商 / 维修工程师",
    trigger: "工单进入待接单",
    input: ["门店与设备", "故障摘要", "模拟保修", "当前SLA"],
    process: ["接单或拒单", "开始处理", "填写实际故障原因", "填写维修动作与配件", "提交维修结果"],
    rules: ["只能操作自己的工单", "待接单才能接单", "处理中才能提交维修结果", "拒单必须填写原因"],
    ai: "不代替维修人员填写实际故障原因。",
    output: ["接单状态", "维修事实", "待验收通知"],
    next: "门店",
    exceptions: ["拒单 → 维修管理", "补充请求 → 门店/维修管理"],
    breaks: ["接单不可见", "状态依赖电话聊天", "进度口径不一致"],
    scenario: "正常自动派单 / 验收返修",
    status: "Demo已实现",
    screenshot: "/showcase/supplier-task.png",
    value: "同一工单同步真实处理状态。",
  },
  {
    id: "sla",
    title: "SLA与异常管理",
    icon: Clock3,
    role: "系统 / 维修管理 / 运营",
    trigger: "工单派发后开始计时",
    input: ["最终紧急度", "派发时间", "模拟SLA", "当前责任方"],
    process: ["计算接单截止时间", "显示倒计时", "识别即将超时", "超时升级", "重新定责并派发"],
    rules: ["Demo P1 60秒 / P2 120秒 / P3 300秒", "P1超时通知维修管理和运营"],
    ai: "不介入计时与升级判断。",
    output: ["SLA状态", "异常队列", "通知日志", "责任变更记录"],
    next: "维修管理",
    exceptions: ["已超时 → 人工重新定责", "原责任方与新责任方同时留痕"],
    breaks: ["流程停滞无人发现", "未接单无后续", "异常不进入管理视野"],
    scenario: "P1超时",
    status: "Demo已实现",
    screenshot: "/showcase/sla-timeout.png",
    value: "让停滞变成可见且有下一责任人。",
  },
  {
    id: "acceptance",
    title: "维修结果与门店验收",
    icon: ClipboardCheck,
    role: "维修人员 / 门店员工",
    trigger: "维修方提交维修结果",
    input: ["实际故障原因", "维修动作", "配件", "运行恢复情况", "门店试运行结果"],
    process: ["维修结果结构化", "门店现场验收", "通过关闭", "不通过原工单返修", "再次维修与再次验收"],
    rules: ["未验收不得关闭", "验收不通过原因必填", "返回原责任方", "返修次数加1"],
    ai: "可生成知识摘要草稿，但不代替验收结论。",
    output: ["验收记录", "返修状态或关闭状态", "完整时间线"],
    next: "原责任方或设备履历",
    exceptions: ["验收不通过 → 返修中", "不创建无关联新工单"],
    breaks: ["维修完成等同问题解决", "缺少业务试运行", "返修记录断裂"],
    scenario: "验收返修",
    status: "Demo已实现",
    screenshot: "/showcase/acceptance.png",
    value: "以业务可用性而非维修提交作为关闭条件。",
  },
  {
    id: "history",
    title: "设备履历与运营看板",
    icon: History,
    role: "维修管理 / 运营管理员",
    trigger: "工单状态与维修事实持续沉淀",
    input: ["历史工单", "故障分类", "维修动作", "验收结果", "返修与重复故障标记"],
    process: ["按设备汇总历史", "计算流程指标", "识别重复故障", "形成运营视图"],
    rules: ["当前看板使用模拟数据", "指标只展示系统可计算能力"],
    ai: "未来可辅助摘要，当前不生成经营结论。",
    output: ["设备履历", "流程指标", "重复故障提示"],
    next: "维修管理 / 运营",
    exceptions: ["真实指标基线与目标待企业数据校准"],
    breaks: ["关闭后记录分散", "设备历史不可追溯", "缺少流程数据"],
    scenario: "正常闭环 / 返修",
    status: "Demo已实现",
    screenshot: "/showcase/asset-history.png",
    value: "把一次处理沉淀为可追溯资产事实。",
  },
];

export const liveViews = [
  { id: "report", title: "门店报修", icon: Send },
  { id: "analysis", title: "AI分析", icon: Bot },
  { id: "supplement", title: "信息补充", icon: FileSearch },
  { id: "review", title: "人工复核", icon: UserCog },
  { id: "order", title: "统一工单", icon: ClipboardCheck },
  { id: "supplier", title: "供应商任务", icon: Wrench },
  { id: "sla", title: "SLA超时", icon: Clock3 },
  { id: "repair", title: "维修结果", icon: Wrench },
  { id: "acceptance", title: "门店验收", icon: ClipboardCheck },
  { id: "history", title: "设备履历", icon: History },
];

export const scenarioDefinitions = [
  {
    id: "normal",
    title: "正常自动派单",
    input: "光谷店、GEL-001、设备异响和产品成型异常。",
    mechanism: "AI结构化 → 设备台账 → R003 → 供应商A → P2 SLA",
    result: "自动创建工单，供应商接单，维修后门店验收关闭。",
    proves: "正常链路可在不需要维修管理人工定责时跑通。",
    notProves: "不证明真实维修效率、成本或一次修复率。",
  },
  {
    id: "missing",
    title: "信息缺失",
    input: "江汉路店，售卖柜温度升高，但不知道具体设备。",
    mechanism: "识别温控风险与缺设备ID → 阻止派单 → 补充COLD-002 → AI v2 → R009",
    result: "补充前无正式工单，补充后进入确定性路由。",
    proves: "系统不会在关键设备信息缺失时错误派单。",
    notProves: "不证明真实门店信息完整率。",
  },
  {
    id: "low",
    title: "低置信度",
    input: "光谷店、GEL-002：“机器坏了，没反应。”",
    mechanism: "AI置信度低 → 禁止自动派单 → R010 → 人工填写最终决定与原因",
    result: "人工确认后才允许派发，修改前后写入时间线。",
    proves: "系统具备AI不确定性兜底能力。",
    notProves: "不证明真实AI准确率。",
  },
  {
    id: "timeout",
    title: "P1超时",
    input: "一张P1待接单工单。",
    mechanism: "60秒Demo SLA → 即将超时 → 已超时 → 通知 → 重新定责",
    result: "原责任方、新责任方、超时时间和改派原因均留存。",
    proves: "系统能识别流程停滞并推动下一步处理。",
    notProves: "不证明真实SLA改善。",
  },
  {
    id: "return",
    title: "验收返修",
    input: "维修方提交完成，但门店试运行仍然异常。",
    mechanism: "验收不通过 → 原工单返修 → 原责任方 → 二次维修 → 再验收",
    result: "不创建无关联工单，返修次数与历史完整保留。",
    proves: "维修完成不等于业务问题关闭。",
    notProves: "不证明真实返修率下降。",
  },
] as const;
