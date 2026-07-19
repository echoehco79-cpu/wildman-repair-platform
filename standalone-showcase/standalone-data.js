const CHAPTERS = [
  ["01","business-context","业务背景与命题理解"],["02","business-impact","为什么设备维修是经营问题"],
  ["03","as-is-boundary","As-Is流程假设与研究边界"],["04","breakpoints","核心协同断点"],
  ["05","root-causes","根因分析"],["06","to-be","To-Be目标流程"],
  ["07","solution-architecture","整体解决方案架构"],["08","responsibility-boundary","AI、规则、系统、人工分工"],
  ["09","product-features","核心产品功能"],["10","demo-validation","Demo验证结果"],
  ["11","value-roadmap","价值指标与未来落地路径"],["12","team-summary","团队能力与总结"]
];

const STORES = [
  {id:"store-001",code:"STORE-001",name:"光谷店（模拟）",region:"华中",type:"直营",address:"武汉市洪山区示范地址（模拟）",managerName:"张店长（模拟）",status:"营业中"},
  {id:"store-002",code:"STORE-002",name:"江汉路店（模拟）",region:"华中",type:"加盟",address:"武汉市江汉区示范地址（模拟）",managerName:"李店长（模拟）",status:"营业中"},
  {id:"store-003",code:"STORE-003",name:"徐家汇店（模拟）",region:"华东",type:"加盟",address:"上海市徐汇区示范地址（模拟）",managerName:"王店长（模拟）",status:"营业中"}
];

const PARTIES = [
  {id:"party-it",code:"INT-IT",name:"内部IT（模拟）",type:"内部IT",serviceCategories:"收银设备",serviceRegions:"*",contactName:"IT值班（模拟）",status:"有效"},
  {id:"party-maint",code:"INT-M",name:"内部维修组（模拟）",type:"内部维修",serviceCategories:"一般设备,操作/清洁问题",serviceRegions:"*",contactName:"维修值班（模拟）",status:"有效"},
  {id:"party-a",code:"SUP-A",name:"设备供应商A（模拟）",type:"设备供应商",serviceCategories:"Gelato制作设备",serviceRegions:"华中",contactName:"周工程师（模拟）",status:"有效"},
  {id:"party-b",code:"SUP-B",name:"设备供应商B（模拟）",type:"设备供应商",serviceCategories:"低温储存设备,售卖温控设备",serviceRegions:"华中,华东",contactName:"陈工程师（模拟）",status:"有效"},
  {id:"party-c",code:"SUP-C",name:"设备供应商C（模拟）",type:"设备供应商",serviceCategories:"Gelato制作设备",serviceRegions:"华东",contactName:"赵工程师（模拟）",status:"有效"},
  {id:"party-d",code:"SUP-D",name:"设施供应商D（模拟）",type:"设施供应商",serviceCategories:"空调设备",serviceRegions:"华东",contactName:"钱工程师（模拟）",status:"有效"}
];

const ASSETS = [
  {id:"asset-ac-001",code:"AC-001",name:"徐家汇空调设备（模拟）",storeId:"store-003",category:"空调设备",model:"DEMO-A01",location:"营业区",warrantyStatus:"保修内",operationalStatus:"正常",defaultPartyId:"party-d"},
  {id:"asset-cold-001",code:"COLD-001",name:"光谷低温储存设备（模拟）",storeId:"store-001",category:"低温储存设备",model:"DEMO-C01",location:"后场冷藏区",warrantyStatus:"保修内",operationalStatus:"正常",defaultPartyId:"party-b"},
  {id:"asset-cold-002",code:"COLD-002",name:"江汉路售卖温控设备（模拟）",storeId:"store-002",category:"售卖温控设备",model:"DEMO-C02",location:"前场售卖区",warrantyStatus:"保修内",operationalStatus:"异常运行",defaultPartyId:"party-b"},
  {id:"asset-cold-003",code:"COLD-003",name:"徐家汇低温储存设备（模拟）",storeId:"store-003",category:"低温储存设备",model:"DEMO-C03",location:"后场冷藏区",warrantyStatus:"保修外",operationalStatus:"正常",defaultPartyId:"party-b"},
  {id:"asset-gel-001",code:"GEL-001",name:"光谷后场 Gelato 制作设备 1 号（模拟）",storeId:"store-001",category:"Gelato制作设备",model:"DEMO-G01",location:"后场制作区",warrantyStatus:"保修内",operationalStatus:"正常",defaultPartyId:"party-a"},
  {id:"asset-gel-002",code:"GEL-002",name:"光谷后场 Gelato 制作设备 2 号（模拟）",storeId:"store-001",category:"Gelato制作设备",model:"DEMO-G02",location:"后场制作区",warrantyStatus:"保修外",operationalStatus:"异常运行",defaultPartyId:"party-maint"},
  {id:"asset-gel-003",code:"GEL-003",name:"江汉路 Gelato 制作设备（模拟）",storeId:"store-002",category:"Gelato制作设备",model:"DEMO-G03",location:"后场制作区",warrantyStatus:"保修内",operationalStatus:"正常",defaultPartyId:"party-a"},
  {id:"asset-gel-004",code:"GEL-004",name:"徐家汇 Gelato 制作设备（模拟）",storeId:"store-003",category:"Gelato制作设备",model:"DEMO-G04",location:"后场制作区",warrantyStatus:"保修内",operationalStatus:"正常",defaultPartyId:"party-c"},
  {id:"asset-pos-001",code:"POS-001",name:"江汉路收银设备（模拟）",storeId:"store-002",category:"收银设备",model:"DEMO-P01",location:"收银台",warrantyStatus:"不适用",operationalStatus:"正常",defaultPartyId:"party-it"}
];

const RULES = [
  {id:"rule-001",code:"R001",name:"人身与电气安全硬规则（模拟）",priority:10,assetCategories:"*",faultCategories:"电气/供电异常",riskTags:"冒烟/焦味,漏电,人员安全",responsibilityPartyId:"party-maint",priorityLevel:"P1",acceptanceSlaSeconds:60,requiresHumanReview:true,enabled:true},
  {id:"rule-003",code:"R003",name:"华中 Gelato 保修内机械异常（模拟）",priority:30,assetCategories:"Gelato制作设备",faultCategories:"机械运行异常",riskTags:"异常声音",responsibilityPartyId:"party-a",priorityLevel:"P2",acceptanceSlaSeconds:120,requiresHumanReview:false,enabled:true},
  {id:"rule-009",code:"R009",name:"一般低温温控异常（模拟）",priority:40,assetCategories:"低温储存设备,售卖温控设备",faultCategories:"温控异常",riskTags:"温度异常",responsibilityPartyId:"party-b",priorityLevel:"P1",acceptanceSlaSeconds:60,requiresHumanReview:false,enabled:true},
  {id:"rule-010",code:"R010",name:"人工复核兜底（模拟）",priority:99,assetCategories:"*",faultCategories:"不明确",riskTags:"*",responsibilityPartyId:"party-maint",priorityLevel:"待确认",acceptanceSlaSeconds:0,requiresHumanReview:true,enabled:true}
];

const BREAKPOINTS = Array.from({length:14},(_,i)=>({
  id:`T${i+1}`,
  label:["现场异常缺少统一入口","信息分散在多渠道","原始事实在转述中变化","专业字段难填写","关键信息缺失","反复无序追问","设备身份不清","责任边界不清","派单依赖经验","接单进度不可见","流程停滞无人发现","维修结果不结构化","维修完成等同关闭","履历和重复故障不可追溯"][i],
  state:[2,4,7,2,7,7,7,7,7,7,7,4,7,7].includes(i+1)?"solved":([1,4,9,12].includes(i+1)?"partial":"future")
}));

const ROLE_TASKS = [
  ["门店端","扫码/选择设备 · 自然语言报修 · 信息补充 · 进度查看 · 门店验收"],
  ["维修管理端","人工复核 · 责任确认 · 异常处理 · 超时监控 · 重新定责"],
  ["供应商端","接单 · 拒单 · 维修处理 · 结果提交"],
  ["运营管理端","设备台账 · 责任方配置 · 路由规则 · 运营看板 · 设备履历"]
];
const COLLAB_FLOW = ["故障事件","统一维修工单","当前责任方","当前状态","SLA","状态时间线"];
const ARCHITECTURE_JOURNEY = ["门店报修","故障事件","AI分析","规则路由","统一工单","供应商处理","门店验收","设备履历"];
const ARCHITECTURE_CAPABILITIES = {
  ai:["报修信息结构化","缺失字段识别","定向追问","故障分类建议","业务影响建议","置信度与证据"],
  rule:["设备与门店校验","保修、区域与供应商路由","重复故障识别"],
  system:["状态机","SLA计时与超时升级","通知","权限","审计日志"],
  human:["现场事实确认","低置信度人工复核","规则冲突处理","专业维修执行","供应商改派","门店验收"]
};
const DATA_OBJECTS = ["Store","Asset","ResponsibilityParty","RoutingRule","FaultEvent","WorkOrder","StateEvent","NotificationLog"];
const ARCHITECTURE_VALUES = ["报修信息结构化","责任判断可解释","三方状态同步","SLA异常可管理","门店验收闭环","设备维修履历沉淀"];

const RESPONSIBILITY = [
  {key:"AI",tag:"听懂与整理",owns:["理解自然语言与语音转写","提取故障现象和业务影响","识别缺失字段并定向追问","建议分类、优先级、置信度与证据"],not:["不虚构设备、供应商和保修","不做专业维修诊断","不决定最终责任方","不关闭工单"]},
  {key:"规则",tag:"确定责任与约束",owns:["检查必填字段","校验设备与门店","判断模拟保修","匹配责任方、区域与SLA","识别强制人工与重复故障"],not:["不替代现场事实","不替代维修诊断","冲突时不擅自选择"]},
  {key:"系统",tag:"状态、通知与留痕",owns:["保存原始报修","创建故障事件和统一工单","管理状态机与权限","计算SLA并超时升级","记录责任变化和设备履历"],not:["不绕过状态机","不把维修完成等同关闭","不覆盖原始信息"]},
  {key:"人工",tag:"专业判断与最终确认",owns:["确认现场事实和设备身份","处理低置信度和规则冲突","执行专业维修","处理拒单、改派与异常","完成门店验收"],not:["决策原因不能为空","不得绕过权限与留痕"]}
];

const PRODUCT_MODULES = [
  {id:"report",title:"智能报修",role:"门店人员",trigger:"现场发现设备异常",input:"门店、设备、自然语言、发生时间、生产/营业影响、风险标签",process:"保存原始内容；校验设备归属；创建故障事件；调用AI",ai:"结构化非专业描述，不生成维修动作",rule:"设备可暂不选；原始事实不得覆盖",output:"故障事件、AI分析任务",owner:"门店人员",next:"AI与系统",exception:"设备未知→待补充；高风险→人工",breaks:"T1、T3、T4",status:"Demo已实现"},
  {id:"analysis",title:"AI分析",role:"门店人员 / 维修管理",trigger:"故障事件创建或重新分析",input:"原始描述、影响选择、风险标签、设备台账",process:"摘要、现象、影响、缺失字段、置信度、证据、追问",ai:"输出与AIAnalysis Schema一致的建议",rule:"缺关键字段不建正式工单；低置信度/高风险人工",output:"结构化分析、版本历史",owner:"AI与系统",next:"门店补充或规则引擎",exception:"AI失败→重试后人工",breaks:"T3、T5、T6",status:"Demo已实现"},
  {id:"supplement",title:"信息补充",role:"门店人员",trigger:"AI识别关键字段缺失",input:"原始报修、缺失字段、门店设备列表",process:"定向追问；选择COLD-002；重新分析；保留v1/v2",ai:"基于补充字段生成新版本",rule:"补充前不创建正式工单",output:"AI v2、完整设备身份",owner:"门店人员",next:"规则引擎",exception:"设备不属于门店→阻止",breaks:"T5、T6、T7",status:"Demo已实现"},
  {id:"routing",title:"责任路由",role:"规则系统",trigger:"关键字段完整",input:"类别、型号、门店、区域、模拟保修、故障、风险、置信度",process:"按优先级匹配R003/R009/R010",ai:"只提供分类和置信度",rule:"确定责任方、P1/P2/P3和Demo SLA",output:"责任方、规则编号、路由理由",owner:"规则系统",next:"供应商或维修管理",exception:"冲突/无命中/低置信度→人工",breaks:"T7、T8、T9",status:"Demo已实现"},
  {id:"review",title:"人工复核",role:"维修管理人员",trigger:"低置信度、高风险、规则冲突",input:"原始事实、AI建议、规则结果、候选责任方",process:"填写最终分类、紧急度、责任方和决策原因",ai:"展示建议，不自动填人工原因",rule:"原因必填；确认前禁止派发",output:"人工最终决策和变更日志",owner:"维修管理人员",next:"最终责任方",exception:"缺少原因→明确错误",breaks:"T8、T9",status:"Demo已实现"},
  {id:"order",title:"统一工单",role:"三方共享",trigger:"信息完整并完成责任决策",input:"原始报修、AI、规则、人工、SLA",process:"管理唯一主记录、当前状态、责任与下一步",ai:"只占建议区",rule:"合法状态机和权限",output:"统一事实、时间线、维修与验收记录",owner:"当前责任方",next:"状态决定",exception:"非法操作阻止并提示",breaks:"T3、T8、T10、T13、T14",status:"Demo已实现"},
  {id:"supplier",title:"供应商协同",role:"供应商 / 工程师",trigger:"待接单工单分配给当前供应商",input:"工单、设备、故障摘要、模拟保修、SLA",process:"接单/拒单；开始处理；提交专业维修事实",ai:"不代替专业诊断",rule:"只能操作自己的工单；状态前置条件",output:"接单状态、维修结果、待验收",owner:"供应商",next:"门店",exception:"拒单→维修管理；错供应商→拒绝",breaks:"T10、T11、T12",status:"Demo已实现"},
  {id:"sla",title:"SLA异常管理",role:"系统 / 维修管理 / 运营",trigger:"工单派发开始计时",input:"紧急度、派发时间、当前责任方",process:"倒计时；即将超时；已超时；通知；改派",ai:"不介入计时与升级",rule:"Demo P1 60秒/P2 120秒/P3 300秒",output:"异常队列、通知、责任变更",owner:"维修管理人员",next:"新责任方",exception:"改派原因必填",breaks:"T10、T11",status:"Demo已实现"},
  {id:"repair",title:"维修结果",role:"维修人员",trigger:"工单处理中",input:"实际故障原因、维修动作、模拟配件",process:"保存专业维修事实并进入待验收",ai:"不填写实际原因",rule:"只有处理中才能提交",output:"维修记录、待验收通知",owner:"供应商",next:"门店",exception:"未接单/非处理中→阻止",breaks:"T12、T13",status:"Demo已实现"},
  {id:"acceptance",title:"门店验收",role:"门店人员",trigger:"供应商提交维修完成",input:"维修结果、现场试运行、验收意见",process:"通过→关闭；不通过→原工单返修",ai:"不决定验收",rule:"未验收不得关闭；不通过原因必填",output:"验收记录、关闭或返修",owner:"门店人员",next:"设备履历或原责任方",exception:"不创建无关联新工单",breaks:"T13、T14",status:"Demo已实现"},
  {id:"return",title:"返修",role:"原责任方 / 门店",trigger:"门店验收不通过",input:"原工单、不通过原因、原责任方",process:"返修次数+1；返回原责任方；再次维修和验收",ai:"不介入专业返修",rule:"保持同一工单关联",output:"完整返修链路",owner:"原责任方",next:"门店再次验收",exception:"第二次仍不通过可再次返修",breaks:"T13、T14",status:"Demo已实现"},
  {id:"history",title:"设备履历",role:"维修管理 / 运营",trigger:"工单持续沉淀与关闭",input:"工单、故障原因、维修动作、验收、返修",process:"按设备汇总历史；标识重复故障；形成流程指标",ai:"当前不生成经营结论",rule:"指标仅展示可计算能力",output:"设备履历和运营视图",owner:"运营管理员",next:"企业治理",exception:"真实基线待企业校准",breaks:"T14",status:"Demo已实现"}
];

const TOBE_NODES = [
  ["门店","选择设备并报修","report"],["AI","AI结构化","analysis"],["规则与系统","信息完整性检查","analysis"],
  ["门店","定向补充","supplement"],["规则与系统","设备和保修信息读取","routing"],["规则与系统","确定性责任路由","routing"],
  ["维修管理","低置信度或冲突转人工","review"],["规则与系统","创建统一工单","order"],["供应商/工程师","供应商接单","supplier"],
  ["供应商/工程师","维修处理","repair"],["门店","门店验收","acceptance"],["供应商/工程师","返修","return"],
  ["规则与系统","关闭","order"],["规则与系统","设备履历","history"]
];

const MECHANISM_CASE = {
  original:{title:"原始报修",body:[["门店","光谷店（模拟）"],["设备","GEL-001"],["原始描述","今天上午机器声音特别大，做出来的产品也不成型。"],["生产影响","中"],["营业影响","中"],["风险标签","异常声音"]]},
  ai:{title:"AI分析",body:[["标准化摘要","GEL-001；运行异响、产品成型异常；发生于今天上午；生产影响中。"],["故障现象","运行异响；制作质量异常"],["业务影响","生产中 / 营业中"],["优先级建议","P2"],["AI置信度","high"],["判断证据","包含异响关键词；包含成型/出品异常"],["缺失字段","无"]]},
  rule:{title:"确定性规则",body:[["设备ID","GEL-001"],["所属门店","光谷店（模拟）"],["设备类别","Gelato制作设备"],["模拟保修状态","保修内"],["服务区域","华中"],["默认供应商","设备供应商A（模拟）"],["命中规则","R003"],["推荐责任方","设备供应商A（模拟）"],["Demo SLA","P2 · 120秒"],["路由理由","保修内、华中、唯一绑定供应商A，覆盖机械与出品异常"]]},
  system:{title:"系统自动化",body:[["故障事件","FE-OFFLINE-001"],["统一工单","WO-20260719-OFF001"],["当前状态","待接单"],["当前责任方","设备供应商A（模拟）"],["SLA","P2 · 120秒"],["通知","新派单通知责任方"],["时间线","待判断 → 待接单"]]},
  human:{title:"人工处理",body:[["实际故障原因","Demo模拟：传动部件松动，由维修人员填写"],["维修动作","Demo模拟：完成安全检查与紧固"],["门店验收","试运行正常，出品恢复"],["工单状态","已关闭"],["设备历史","新增本次完整工单与验收记录"]]}
};

const TABLES = {
  Asset:{description:"设备唯一身份，关联门店、型号、模拟保修和默认责任方。",types:{id:"String",code:"String",name:"String",storeId:"Relation",category:"String",model:"String",location:"String",warrantyStatus:"Enum",operationalStatus:"Enum",defaultPartyId:"Relation"},rows:ASSETS},
  FaultEvent:{description:"永久保留门店原始报修与AI分析边界。",types:{id:"String",code:"String",storeId:"Relation",assetId:"Relation?",originalDescription:"Text",productionImpact:"Enum",businessImpact:"Enum",aiConfidence:"Enum",missingFields:"Json",requiresHumanReview:"Boolean",status:"Enum",createdAt:"DateTime"},rows:[
    {id:"fe-001",code:"FE-001",storeId:"store-001",assetId:"asset-gel-001",originalDescription:"今天上午机器声音特别大，做出来的产品也不成型。",productionImpact:"中",businessImpact:"中",aiConfidence:"high",missingFields:"[]",requiresHumanReview:false,status:"已生成工单",createdAt:"2026-07-19 10:00"},
    {id:"fe-002",code:"FE-002",storeId:"store-002",assetId:"",originalDescription:"售卖柜温度一直往上升，现在不知道具体是哪台。",productionImpact:"中",businessImpact:"不确定",aiConfidence:"medium",missingFields:'["设备编号"]',requiresHumanReview:false,status:"待补充",createdAt:"2026-07-19 10:05"},
    {id:"fe-003",code:"FE-003",storeId:"store-001",assetId:"asset-gel-002",originalDescription:"机器坏了，没反应。",productionImpact:"不确定",businessImpact:"不确定",aiConfidence:"low",missingFields:"[]",requiresHumanReview:true,status:"待人工确认",createdAt:"2026-07-19 10:10"}
  ]},
  NotificationLog:{description:"追踪派单、超时、返修和验收提醒。",types:{id:"String",workOrderId:"Relation",notificationType:"Enum",receiverRole:"Enum",receiverName:"String",message:"Text",sentAt:"DateTime",status:"Enum"},rows:[
    {id:"notice-001",workOrderId:"wo-001",notificationType:"新派单",receiverRole:"supplier",receiverName:"设备供应商A（模拟）",message:"WO-20260719-001 已派发，请在 Demo SLA 内接单。",sentAt:"2026-07-19 10:00",status:"已发送"},
    {id:"notice-002",workOrderId:"wo-004",notificationType:"超时升级",receiverRole:"manager",receiverName:"维修管理人员",message:"WO-20260719-004 已超过 Demo 接单 SLA，请处理异常。",sentAt:"2026-07-19 10:02",status:"已发送"}
  ]},
  ResponsibilityParty:{description:"保存内部责任方与模拟供应商服务范围。",types:{id:"String",code:"String",name:"String",type:"Enum",serviceCategories:"Json",serviceRegions:"Json",contactName:"String",status:"Enum"},rows:PARTIES},
  RoutingRule:{description:"责任判断结构化保存，规则编号与理由可追溯，不写在AI回答里。",types:{id:"String",code:"String",name:"String",priority:"Int",assetCategories:"Json",faultCategories:"Json",riskTags:"Json",responsibilityPartyId:"Relation",priorityLevel:"Enum",acceptanceSlaSeconds:"Int",requiresHumanReview:"Boolean",enabled:"Boolean"},rows:RULES},
  StateEvent:{description:"每次状态、责任和操作者变化都形成不可覆盖的日志。",types:{id:"String",workOrderId:"Relation",fromStatus:"Enum",toStatus:"Enum",actorRole:"Enum",actorName:"String",reason:"Text",timestamp:"DateTime"},rows:[
    {id:"state-001",workOrderId:"wo-001",fromStatus:"待判断",toStatus:"待接单",actorRole:"system",actorName:"本地规则引擎",reason:"命中R003，信息完整且唯一规则命中",timestamp:"2026-07-19 10:00"},
    {id:"state-002",workOrderId:"wo-004",fromStatus:"待接单",toStatus:"超时未接单",actorRole:"system",actorName:"SLA自动化",reason:"超过Demo接单截止时间，自动升级",timestamp:"2026-07-19 10:02"}
  ]},
  Store:{description:"门店组织主数据，为设备归属、区域与权限提供依据。",types:{id:"String",code:"String",name:"String",region:"String",type:"Enum",address:"String",managerName:"String",status:"Enum"},rows:STORES},
  WorkOrder:{description:"维修协同唯一主记录，连接AI、规则、责任方、维修和验收。",types:{id:"String",code:"String",faultEventId:"Relation",assetId:"Relation",finalFaultCategory:"String",finalPriority:"Enum",finalPartyId:"Relation",status:"Enum",slaStatus:"Enum",dispatchedAt:"DateTime",acceptedAt:"DateTime?",repairCompletedAt:"DateTime?",acceptanceResult:"Enum?",returnCount:"Int"},rows:[
    {id:"wo-001",code:"WO-20260719-001",faultEventId:"fe-001",assetId:"asset-gel-001",finalFaultCategory:"机械运行异常",finalPriority:"P2",finalPartyId:"party-a",status:"待接单",slaStatus:"计时中",dispatchedAt:"2026-07-19 10:00",acceptedAt:"",repairCompletedAt:"",acceptanceResult:"",returnCount:0},
    {id:"wo-003",code:"WO-20260719-003",faultEventId:"fe-003",assetId:"asset-gel-002",finalFaultCategory:"待确认",finalPriority:"待确认",finalPartyId:"",status:"待人工确认",slaStatus:"未开始",dispatchedAt:"",acceptedAt:"",repairCompletedAt:"",acceptanceResult:"",returnCount:0},
    {id:"wo-004",code:"WO-20260719-004",faultEventId:"fe-004",assetId:"asset-cold-001",finalFaultCategory:"温控异常",finalPriority:"P1",finalPartyId:"party-b",status:"超时未接单",slaStatus:"已超时",dispatchedAt:"2026-07-19 10:00",acceptedAt:"",repairCompletedAt:"",acceptanceResult:"",returnCount:0},
    {id:"wo-012",code:"WO-20260719-012",faultEventId:"fe-012",assetId:"asset-gel-003",finalFaultCategory:"不明确",finalPriority:"P2",finalPartyId:"party-a",status:"返修中",slaStatus:"已完成",dispatchedAt:"2026-07-19 09:00",acceptedAt:"2026-07-19 09:01",repairCompletedAt:"2026-07-19 09:10",acceptanceResult:"不通过",returnCount:1}
  ]}
};

const SCENARIOS = {
  normal:{title:"正常自动派单",input:"光谷店、GEL-001、异响与产品成型异常",rule:"R003 · 设备供应商A（模拟） · P2",proves:"正常链路可在无需维修管理判断时闭环。",notProves:"不证明真实维修效率、成本或一次修复率。",initial:{status:"待判断",role:"门店人员",party:"待人工定责",sla:"未开始",ai:"未分析",step:"门店填写报修",order:false},actions:["submit-normal","accept","start","complete","approve"]},
  missing:{title:"信息缺失补充",input:"江汉路店、未知设备、售卖柜温度升高",rule:"补充前不路由；补充COLD-002后R009 · P1",proves:"关键设备信息缺失时不会错误派单，v1/v2可追溯。",notProves:"不证明真实设备台账已经完整。",initial:{status:"待判断",role:"门店人员",party:"待人工定责",sla:"未开始",ai:"未分析",step:"提交未知设备报修",order:false},actions:["submit-missing","supplement","route-missing"]},
  low:{title:"低置信度人工复核",input:"光谷店、GEL-002、“机器坏了，没反应。”",rule:"R010 · 人工复核兜底",proves:"AI不确定时人工确认前不允许派发，修改有日志。",notProves:"不证明真实AI准确率。",initial:{status:"待判断",role:"门店人员",party:"待人工定责",sla:"未开始",ai:"未分析",step:"提交模糊报修",order:false},actions:["submit-low","manual-review"]},
  timeout:{title:"P1超时升级",input:"光谷店、COLD-001、P1待接单",rule:"R009 · 设备供应商B（模拟） · P1 60秒",proves:"系统可识别流程停滞、通知并保留改派前后责任。",notProves:"不证明真实SLA制度或改善比例。",initial:{status:"待接单",role:"供应商B",party:"设备供应商B（模拟）",sla:"59秒",ai:"high · 温控异常",step:"P1工单已派发",order:true},actions:["almost-timeout","timeout","redispatch"]},
  return:{title:"验收不通过返修",input:"维修方提交完成，但门店试运行仍异常",rule:"R003 · 原责任方返修 · 同一工单",proves:"维修完成不等于关闭，返修保持原工单连续性。",notProves:"不证明真实返修率或设备可靠性。",initial:{status:"待接单",role:"供应商A",party:"设备供应商A（模拟）",sla:"120秒",ai:"high · 机械运行异常",step:"工单已派发",order:true},actions:["accept","start","complete","reject","restart","complete-again","approve"]}
};

const FLOW_DATA_STEPS = [
  ["门店提交报修","FaultEvent","新增原始故障事件"],
  ["AI分析","FaultEvent","写入摘要、置信度和缺失字段"],
  ["规则命中","RoutingRule","高亮R003/R009/R010"],
  ["创建工单","WorkOrder","新增统一维修工单"],
  ["状态变化","StateEvent","新增状态与责任日志"],
  ["发送提醒","NotificationLog","新增派单/超时/验收通知"],
  ["验收关闭","WorkOrder","更新状态并关联Asset履历"]
];

const ONLINE_BASELINE_STYLE = {
  header:"顶部纯文字品牌、角色切换、DEMO MODE模拟标识",
  sidebar:"左侧显示当前模拟角色、角色导航与Demo SLA",
  content:"暖白画布、英文kicker、强中文标题、细边框、低圆角",
  order:"状态摘要 + 原始事实/AI建议/确定性规则/人工最终决策 + 时间线 + 当前操作"
};
