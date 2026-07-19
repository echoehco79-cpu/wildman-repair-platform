const ALLOWED_TRANSITIONS = {
  "待判断":["待补充","待人工确认","待接单"],
  "待补充":["待人工确认","待接单"],
  "待人工确认":["待接单","已取消"],
  "待接单":["处理中","超时未接单","待人工确认","已取消"],
  "超时未接单":["待人工确认","待接单","已取消"],
  "处理中":["待验收","已取消"],
  "待验收":["已关闭","返修中"],
  "返修中":["处理中","已取消"],
  "已关闭":[],"已取消":[]
};
const ROLE_PERMISSIONS = {
  "submit-normal":["门店人员"],"submit-missing":["门店人员"],"submit-low":["门店人员"],
  supplement:["门店人员"],"route-missing":["系统"],"manual-review":["维修管理人员"],
  accept:["供应商A","供应商B"],rejectSupplier:["供应商A","供应商B"],start:["供应商A","供应商B"],complete:["供应商A","供应商B"],
  "complete-again":["供应商A","供应商B"],"almost-timeout":["系统"],timeout:["系统"],redispatch:["维修管理人员"],
  approve:["门店人员"],reject:["门店人员"],restart:["供应商A","供应商B"]
};
const PRIORITY_SECONDS = {P1:60,P2:120,P3:300};
const pad = n => String(n).padStart(2,"0");
const fixedTime = index => `2026-07-19 10:${pad(index)}:00`;
const clone = value => JSON.parse(JSON.stringify(value));
const partyById = id => PARTIES.find(x=>x.id===id)?.name || "待人工定责";
const assetById = id => ASSETS.find(x=>x.id===id) || null;
const storeById = id => STORES.find(x=>x.id===id) || null;

function defaultReport(){return {storeId:"store-001",assetId:"asset-gel-001",description:"今天上午机器声音特别大，做出来的产品也不成型。",occurredAt:"今天上午",productionImpact:"中",businessImpact:"中",riskTag:"异常声音"};}
function makeSandbox(){
  return {
    report:defaultReport(),analysis:null,analysisHistory:[],route:null,
    order:null,currentRole:"门店人员",activeModule:"order",viewport:"desktop",error:"",notice:"",
    scenarioId:"normal",scenarioIndex:0,scenarioState:clone(SCENARIOS.normal.initial),scenarioHistory:[clone(SCENARIOS.normal.initial)],autoTimer:null,
    backend:{table:"Asset",tableSearch:"",recordSearch:"",visibleColumns:{},detail:null,scenario:"normal",flowIndex:0,toolMenu:"",relationView:false}
  };
}
let Sandbox = makeSandbox();

function analyzeReport(report){
  const text = report.description || "";
  const missing = report.assetId ? [] : ["设备编号"];
  let category="不明确",priority="待确认",confidence="low",phenomena=["故障描述不明确"],evidence=["原始描述信息不足"],risk=[report.riskTag||"无明显风险"];
  if (/异响|声音|成型|不成型/.test(text)){category="机械运行异常";priority="P2";confidence="high";phenomena=["运行异响","制作质量异常"];evidence=["原始描述包含异响关键词","原始描述包含成型/出品异常"];}
  if (/温度|升温|制冷|售卖柜/.test(text)){category="温控异常";priority="P1";confidence=report.assetId?"high":"medium";phenomena=["温度升高或制冷异常"];evidence=["原始描述包含温度/制冷关键词"];risk=["温度异常"];}
  if (/冒烟|漏电|焦味/.test(text)){category="电气/供电异常";priority="P1";confidence="high";phenomena=["高风险电气异常"];evidence=["原始描述包含冒烟/漏电/焦味关键词"];risk=["冒烟/焦味"];}
  if (/坏了|没反应/.test(text) && text.length<15){category="不明确";priority="待确认";confidence="low";phenomena=["设备无响应，但信息不足"];evidence=["描述仅包含泛化故障词"]}
  const asset=assetById(report.assetId);
  return {summary:`${asset?.code||"设备待确认"}；${phenomena.join("、")}；发生于${report.occurredAt||"时间待确认"}；生产影响${report.productionImpact||"不确定"}。`,phenomena,businessImpact:`生产 ${report.productionImpact||"不确定"} / 营业 ${report.businessImpact||"不确定"}`,riskTags:risk,missingFields:missing,faultCategory:category,priority,confidence,evidence,questions:missing.length?["请选择具体故障设备或补充设备编号。"]:[],requiresHumanReview:confidence==="low"||risk.some(x=>/冒烟|漏电|食品安全/.test(x))};
}

function routeReport(report,analysis){
  if (analysis.missingFields.length) return null;
  const asset=assetById(report.assetId);
  if (!asset) return null;
  if (analysis.confidence==="low") return {rule:"R010",partyId:"party-maint",priority:"待确认",sla:0,requiresHumanReview:true,reason:"AI低置信度，命中人工复核兜底规则。"};
  if (analysis.faultCategory==="机械运行异常"&&asset.code==="GEL-001") return {rule:"R003",partyId:"party-a",priority:"P2",sla:120,requiresHumanReview:false,reason:"设备保修内、华中区域、唯一绑定供应商A，规则覆盖机械与出品异常。"};
  if (analysis.faultCategory==="温控异常") return {rule:"R009",partyId:"party-b",priority:"P1",sla:60,requiresHumanReview:false,reason:"低温/售卖温控设备异常，按设备、区域和默认责任方匹配供应商B。"};
  return {rule:"R010",partyId:"party-maint",priority:"待确认",sla:0,requiresHumanReview:true,reason:"没有唯一确定性规则命中，转人工复核。"};
}

function createOrder(report,analysis,route,status){
  return {id:"wo-offline-001",code:"WO-20260719-OFF001",status,priority:route?.priority||"待确认",partyId:status==="待人工确认"?null:route?.partyId||null,originalPartyId:route?.partyId||null,routeRule:route?.rule||"R010",routeReason:route?.reason||"待人工复核",faultCategory:analysis.faultCategory,dispatchedAt:status==="待接单"?fixedTime(0):"",slaSeconds:route?.sla||0,slaStatus:status==="待接单"?"计时中":"未开始",repairCause:"",repairAction:"",partsUsed:"",acceptanceResult:"",acceptanceComment:"",returnCount:0,repeatedFault:false,manualDecision:null,timeline:[{from:"待判断",to:status,actor:"本地规则引擎 · system",reason:status==="待人工确认"?"低置信度/高风险/规则异常进入人工":"信息完整且唯一规则命中",time:fixedTime(0)}]};
}

function changeOrderStatus(next,actor,reason){
  const order=Sandbox.order;if(!order) throw new Error("当前没有正式工单。");
  if(!(ALLOWED_TRANSITIONS[order.status]||[]).includes(next)) throw new Error(`${order.status} 不能直接切换到 ${next}。`);
  const prev=order.status;order.status=next;order.timeline.push({from:prev,to:next,actor,reason,time:fixedTime(order.timeline.length)});
  if(next!=="待接单") order.slaStatus="已停止";
}

function ensureRole(action,role){
  const allowed=ROLE_PERMISSIONS[action]||[];
  if(!allowed.includes(role)) throw new Error(`${role}无权执行当前操作。`);
}

function submitCurrentReport(){
  ensureRole("submit-normal",Sandbox.currentRole);
  const r=Sandbox.report;if(!r.storeId||!r.description.trim()) throw new Error("门店和故障描述为必填项。");
  if(r.assetId&&assetById(r.assetId)?.storeId!==r.storeId) throw new Error("所选设备不属于当前门店。");
  const analysis=analyzeReport(r);Sandbox.analysis=analysis;Sandbox.analysisHistory=[{version:1,analysis:clone(analysis)}];Sandbox.route=routeReport(r,analysis);
  if(analysis.missingFields.length){Sandbox.order=null;Sandbox.notice="关键信息缺失，暂不创建正式工单。";Sandbox.activeModule="supplement";return;}
  const status=analysis.requiresHumanReview||Sandbox.route?.requiresHumanReview?"待人工确认":"待接单";
  Sandbox.order=createOrder(r,analysis,Sandbox.route,status);Sandbox.activeModule=status==="待人工确认"?"review":"order";Sandbox.notice=status==="待接单"?"已自动创建待接单工单。":"已进入维修管理待人工确认。";
}

function supplementDevice(){
  ensureRole("supplement",Sandbox.currentRole);
  if(!Sandbox.analysis?.missingFields.length) throw new Error("当前报修不存在待补充字段。");
  Sandbox.report.assetId="asset-cold-002";
  const v2=analyzeReport(Sandbox.report);Sandbox.analysis=v2;Sandbox.analysisHistory.push({version:2,analysis:clone(v2)});Sandbox.route=routeReport(Sandbox.report,v2);Sandbox.order=createOrder(Sandbox.report,v2,Sandbox.route,"待接单");Sandbox.notice="补充COLD-002后已生成AI v2并完成R009路由。";
}

function manualReview(values){
  ensureRole("manual-review",Sandbox.currentRole);
  if(!Sandbox.order||Sandbox.order.status!=="待人工确认") throw new Error("只有待人工确认工单可以复核。");
  if(!values.reason?.trim()) throw new Error("人工决策原因必须填写。");
  Sandbox.order.manualDecision={faultCategory:values.faultCategory||"一般设备异常",priority:values.priority||"P2",partyId:values.partyId||"party-maint",reason:values.reason.trim()};
  Sandbox.order.faultCategory=Sandbox.order.manualDecision.faultCategory;Sandbox.order.priority=Sandbox.order.manualDecision.priority;Sandbox.order.partyId=Sandbox.order.manualDecision.partyId;
  changeOrderStatus("待接单","维修管理人员 · manager",`人工确认：${values.reason.trim()}；责任方改为${partyById(Sandbox.order.partyId)}`);Sandbox.order.slaSeconds=PRIORITY_SECONDS[Sandbox.order.priority]||120;Sandbox.order.slaStatus="计时中";Sandbox.notice="人工最终决策已留痕并派发。";
}

function supplierAction(action,values={}){
  const order=Sandbox.order;if(!order) throw new Error("当前没有正式工单。");
  const role=Sandbox.currentRole;ensureRole(action,role);
  const expected=role==="供应商A"?"party-a":role==="供应商B"?"party-b":null;
  if(expected!==order.partyId) throw new Error(`${role}不能操作分配给${partyById(order.partyId)}的工单。`);
  if(action==="accept"){if(order.status!=="待接单") throw new Error("只有待接单工单才能接单。");changeOrderStatus("处理中",`${role} · supplier`,"责任方接单并开始处理");}
  if(action==="start"){if(order.status!=="处理中") throw new Error("只有处理中工单可以更新维修进度。");order.timeline.push({from:"处理中",to:"处理中",actor:`${role} · supplier`,reason:"开始现场处理",time:fixedTime(order.timeline.length)});}
  if(action==="complete"||action==="complete-again"){
    if(order.status!=="处理中") throw new Error("只有处理中工单才能提交维修结果。");
    if(!values.cause?.trim()||!values.repair?.trim()) throw new Error("实际故障原因和维修动作必须填写。");
    order.repairCause=values.cause.trim();order.repairAction=values.repair.trim();order.partsUsed=values.parts?.trim()||"无";changeOrderStatus("待验收",`${role} · supplier`,"提交维修结果，等待门店验收");
  }
}

function rejectSupplier(reason){
  if(!Sandbox.order||Sandbox.order.status!=="待接单") throw new Error("只有待接单工单可以拒单。");
  if(!reason?.trim()) throw new Error("拒单原因必须填写。");
  const role=Sandbox.currentRole;ensureRole("rejectSupplier",role);const expected=role==="供应商A"?"party-a":role==="供应商B"?"party-b":null;
  if(expected!==Sandbox.order.partyId) throw new Error(`${role}不能操作其他责任方工单。`);
  changeOrderStatus("待人工确认",`${role} · supplier`,`拒单：${reason.trim()}`);Sandbox.notice="拒单已返回维修管理异常队列。";
}

function simulateSla(kind){
  if(!Sandbox.order||!(Sandbox.order.status==="待接单"||Sandbox.order.status==="超时未接单")) throw new Error("只有待接单或超时工单可以模拟SLA。");
  if(kind==="almost"){Sandbox.order.slaStatus="即将超时";Sandbox.order.timeline.push({from:"待接单",to:"待接单",actor:"SLA自动化 · system",reason:"进入即将超时提醒窗口",time:fixedTime(Sandbox.order.timeline.length)});}
  if(kind==="timeout"&&Sandbox.order.status==="待接单"){changeOrderStatus("超时未接单","SLA自动化 · system","超过Demo接单截止时间，自动升级");Sandbox.order.slaStatus="已超时";Sandbox.notice="已生成维修管理与运营超时通知。";}
}

function redispatch(values){
  ensureRole("redispatch",Sandbox.currentRole);
  if(!Sandbox.order||Sandbox.order.status!=="超时未接单") throw new Error("只有已超时工单可以重新定责。");
  if(!values.reason?.trim()) throw new Error("重新定责原因必须填写。");
  const old=Sandbox.order.partyId;changeOrderStatus("待人工确认","维修管理人员 · manager","进入重新定责");Sandbox.order.partyId=values.partyId||"party-maint";changeOrderStatus("待接单","维修管理人员 · manager",`原责任方${partyById(old)}；新责任方${partyById(Sandbox.order.partyId)}；原因：${values.reason.trim()}`);Sandbox.order.slaStatus="计时中";Sandbox.notice="原责任方、新责任方和改派原因已留痕。";
}

function acceptOrder(passed,comment){
  ensureRole(passed?"approve":"reject",Sandbox.currentRole);
  const order=Sandbox.order;if(!order||order.status!=="待验收") throw new Error("只有待验收工单可以执行验收。");
  if(!passed&&!comment?.trim()) throw new Error("验收不通过原因必须填写。");
  if(passed){order.acceptanceResult="通过";order.acceptanceComment=comment||"现场试运行正常";changeOrderStatus("已关闭","门店人员 · store","门店验收通过，工单关闭");}
  else{order.acceptanceResult="不通过";order.acceptanceComment=comment.trim();order.returnCount+=1;changeOrderStatus("返修中","门店人员 · store",`验收不通过：${comment.trim()}；返回原责任方`);}
}

function restartRepair(){
  if(!Sandbox.order||Sandbox.order.status!=="返修中") throw new Error("只有返修中工单可以再次维修。");
  changeOrderStatus("处理中",`${Sandbox.currentRole} · supplier`,"原责任方开始返修");
}

function loadScenario(id){
  const timer=Sandbox.autoTimer;if(timer) clearInterval(timer);
  const backend=Sandbox.backend;Sandbox=makeSandbox();Sandbox.backend=backend;Sandbox.scenarioId=id;Sandbox.scenarioIndex=0;Sandbox.scenarioState=clone(SCENARIOS[id].initial);Sandbox.scenarioHistory=[clone(Sandbox.scenarioState)];Sandbox.activeModule="order";
  if(id==="normal"){Sandbox.report=defaultReport();submitCurrentReport();}
  if(id==="missing"){Sandbox.report={storeId:"store-002",assetId:"",description:"售卖柜温度一直往上升，现在不知道具体是哪台。",occurredAt:"现在",productionImpact:"中",businessImpact:"不确定",riskTag:"温度异常"};}
  if(id==="low"){Sandbox.report={storeId:"store-001",assetId:"asset-gel-002",description:"机器坏了，没反应。",occurredAt:"刚刚",productionImpact:"不确定",businessImpact:"不确定",riskTag:"无明显风险"};}
  if(id==="timeout"){Sandbox.report={storeId:"store-001",assetId:"asset-cold-001",description:"低温设备温度持续升高。",occurredAt:"刚刚",productionImpact:"高",businessImpact:"高",riskTag:"温度异常"};Sandbox.analysis=analyzeReport(Sandbox.report);Sandbox.route=routeReport(Sandbox.report,Sandbox.analysis);Sandbox.order=createOrder(Sandbox.report,Sandbox.analysis,Sandbox.route,"待接单");}
  if(id==="return"){Sandbox.report=defaultReport();Sandbox.analysis=analyzeReport(Sandbox.report);Sandbox.route=routeReport(Sandbox.report,Sandbox.analysis);Sandbox.order=createOrder(Sandbox.report,Sandbox.analysis,Sandbox.route,"待接单");}
}

function scenarioApplyAction(action){
  const s=Sandbox.scenarioState;const id=Sandbox.scenarioId;
  if(action==="submit-normal"){Object.assign(s,{status:"待接单",role:"供应商A",party:"设备供应商A（模拟）",sla:"P2 · 120秒",ai:"high · 机械运行异常",step:"R003自动创建统一工单",order:true,rule:"R003"});}
  if(action==="submit-missing"){Sandbox.report={storeId:"store-002",assetId:"",description:"售卖柜温度一直往上升，现在不知道具体是哪台。",occurredAt:"现在",productionImpact:"中",businessImpact:"不确定",riskTag:"温度异常"};submitCurrentReport();Object.assign(s,{status:"待补充",role:"门店人员",party:"待人工定责",sla:"未开始",ai:"medium · 温控异常 · 缺设备编号",step:"定向追问，不创建正式工单",order:false,rule:"未路由"});}
  if(action==="supplement"){supplementDevice();Object.assign(s,{status:"待判断",role:"系统",party:"待人工定责",sla:"未开始",ai:"AI v2 · high · 温控异常",step:"补充COLD-002并重新分析",order:false,rule:"待路由"});}
  if(action==="route-missing"){Object.assign(s,{status:"待接单",role:"供应商B",party:"设备供应商B（模拟）",sla:"P1 · 60秒",ai:"AI v2 · high · 温控异常",step:"R009创建统一工单",order:true,rule:"R009"});}
  if(action==="submit-low"){Sandbox.report={storeId:"store-001",assetId:"asset-gel-002",description:"机器坏了，没反应。",occurredAt:"刚刚",productionImpact:"不确定",businessImpact:"不确定",riskTag:"无明显风险"};submitCurrentReport();Object.assign(s,{status:"待人工确认",role:"维修管理人员",party:"待人工定责",sla:"未开始",ai:"low · 故障描述不明确",step:"R010阻止自动派单",order:true,rule:"R010"});}
  if(action==="manual-review"){Sandbox.currentRole="维修管理人员";manualReview({faultCategory:"一般设备异常",priority:"P2",partyId:"party-maint",reason:"现场信息不足，先由内部维修组人工确认"});Object.assign(s,{status:"待接单",role:"内部维修组",party:"内部维修组（模拟）",sla:"P2 · 120秒",step:"人工填写原因后派发",order:true,rule:"R010 + 人工决策"});}
  if(action==="almost-timeout"){simulateSla("almost");Object.assign(s,{status:"待接单",role:"供应商B",sla:"即将超时 · 8秒",step:"SLA进入预警",rule:"R009"});}
  if(action==="timeout"){simulateSla("timeout");Object.assign(s,{status:"超时未接单",role:"维修管理人员",sla:"已超时",step:"生成异常通知",rule:"R009"});}
  if(action==="redispatch"){Sandbox.currentRole="维修管理人员";redispatch({partyId:"party-maint",reason:"原责任方超时未接单，改派内部维修组"});Object.assign(s,{status:"待接单",role:"内部维修组",party:"内部维修组（模拟）",sla:"P1 · 60秒",step:"重新定责并派发",rule:"R009 + 人工改派"});}
  if(action==="accept"){Sandbox.currentRole=Sandbox.order?.partyId==="party-b"?"供应商B":"供应商A";supplierAction("accept");Object.assign(s,{status:"处理中",role:Sandbox.currentRole,party:partyById(Sandbox.order.partyId),sla:"已停止",step:"责任方接单",order:true});}
  if(action==="start"){Sandbox.currentRole=Sandbox.order?.partyId==="party-b"?"供应商B":"供应商A";supplierAction("start");Object.assign(s,{status:"处理中",role:Sandbox.currentRole,step:"开始维修处理"});}
  if(action==="complete"||action==="complete-again"){Sandbox.currentRole=Sandbox.order?.partyId==="party-b"?"供应商B":"供应商A";supplierAction(action,{cause:"Demo模拟故障原因，由维修人员填写",repair:"完成模拟检查与维修，未包含危险操作指引",parts:"无"});Object.assign(s,{status:"待验收",role:"门店人员",step:action==="complete"?"提交维修结果":"第二次提交维修结果"});}
  if(action==="reject"){Sandbox.currentRole="门店人员";acceptOrder(false,"试运行后仍有异响，暂不满足生产要求");Object.assign(s,{status:"返修中",role:"供应商A",step:"验收不通过，原工单返修"});}
  if(action==="restart"){Sandbox.currentRole="供应商A";restartRepair();Object.assign(s,{status:"处理中",role:"供应商A",step:"原责任方再次维修"});}
  if(action==="approve"){Sandbox.currentRole="门店人员";acceptOrder(true,"现场试运行正常，满足生产要求");Object.assign(s,{status:"已关闭",role:"门店人员",sla:"已完成",step:"门店验收通过并关闭"});}
  s.lastAction=action;s.dataChange=scenarioDataChange(action);return s;
}

function scenarioDataChange(action){
  const map={"submit-normal":"FaultEvent新增；RoutingRule R003命中；WorkOrder新增；StateEvent新增","submit-missing":"FaultEvent新增并写入缺失字段；未创建WorkOrder",supplement:"FaultEvent更新设备并保留AI v1/v2","route-missing":"RoutingRule R009命中；WorkOrder新增；NotificationLog新增","submit-low":"FaultEvent写入low；RoutingRule R010命中；WorkOrder状态待人工确认","manual-review":"WorkOrder更新最终责任；StateEvent记录人工前后值",accept:"StateEvent新增接单状态",start:"StateEvent记录开始处理",complete:"WorkOrder写入维修结果；StateEvent新增待验收","complete-again":"WorkOrder更新第二次维修结果；StateEvent新增待验收","almost-timeout":"StateEvent记录即将超时提醒","timeout":"WorkOrder更新超时；StateEvent与NotificationLog新增","redispatch":"WorkOrder更新责任方；StateEvent保留原/新责任方","reject":"WorkOrder返修次数+1；StateEvent新增返修中","restart":"StateEvent新增再次处理","approve":"WorkOrder更新已关闭；StateEvent新增；Asset履历关联"};return map[action]||"无数据变化";
}

function scenarioNext(){
  const def=SCENARIOS[Sandbox.scenarioId];if(Sandbox.scenarioIndex>=def.actions.length) return false;
  const action=def.actions[Sandbox.scenarioIndex];scenarioApplyAction(action);Sandbox.scenarioIndex+=1;Sandbox.scenarioHistory.push(clone(Sandbox.scenarioState));return true;
}
function scenarioPrev(){
  const target=Math.max(0,Sandbox.scenarioIndex-1);const id=Sandbox.scenarioId;loadScenario(id);for(let i=0;i<target;i++)scenarioNext();
}
function resetAllSandbox(){const backend=Sandbox.backend;if(Sandbox.autoTimer)clearInterval(Sandbox.autoTimer);Sandbox=makeSandbox();Sandbox.backend=backend;loadScenario("normal");}
