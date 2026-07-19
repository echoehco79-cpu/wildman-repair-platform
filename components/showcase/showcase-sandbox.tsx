"use client";

import type {
  Asset,
  ResponsibilityParty,
  RoutingRule,
  Store,
} from "@prisma/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { LocalDeterministicAIProvider } from "@/lib/ai";
import { toJson } from "@/lib/json";
import { routeWorkOrder } from "@/lib/routing";
import { calculateAcceptanceDeadline, getSlaStatus } from "@/lib/sla";
import {
  assertCanClose,
  assertRole,
  assertSupplierAssignment,
  assertTransition,
} from "@/lib/state-machine";
import {
  ReportInputSchema,
  type AIAnalysis,
  type OrderStatus,
  type ReportInput,
  type Role,
  type RouteDecision,
} from "@/lib/types";

export type ScenarioId = "normal" | "missing" | "low" | "timeout" | "return";

export type SandboxTimelineEvent = {
  id: string;
  fromStatus: string;
  toStatus: string;
  actorRole: string;
  actorName: string;
  reason: string;
  timestamp: string;
};

export type SandboxOrder = {
  code: string;
  status: OrderStatus;
  finalFaultCategory: string;
  finalPriority: string;
  recommendedPartyId: string | null;
  finalPartyId: string | null;
  routeExplanation: string;
  routeTrace: string[];
  manuallyReviewed: boolean;
  manualReviewReason: string;
  slaStatus: string;
  dispatchedAt: string | null;
  acceptanceDeadline: string | null;
  acceptedAt: string | null;
  repairStartedAt: string | null;
  repairCause: string;
  repairAction: string;
  partsUsed: string;
  acceptanceResult: string;
  acceptanceComment: string;
  returnCount: number;
  repeatedFault: boolean;
};

export type SandboxState = {
  scenario: ScenarioId;
  input: ReportInput;
  analysis: AIAnalysis | null;
  analysisHistory: { version: number; createdAt: string; analysis: AIAnalysis }[];
  route: RouteDecision | null;
  order: SandboxOrder | null;
  assetId: string | null;
  role: Role;
  currentStep: number;
  timeline: SandboxTimelineEvent[];
  notifications: string[];
  error: string;
  busy: boolean;
  autoPlaying: boolean;
};

const nowIso = () => new Date().toISOString();

export const showcaseStores: Store[] = [
  {
    id: "store-001",
    code: "STORE-001",
    name: "光谷店（模拟）",
    region: "华中",
    type: "直营",
    address: "武汉市洪山区示范地址（模拟）",
    managerName: "张店长（模拟）",
    phone: "138****0001",
    status: "营业中",
    isDemo: true,
  },
  {
    id: "store-002",
    code: "STORE-002",
    name: "江汉路店（模拟）",
    region: "华中",
    type: "加盟",
    address: "武汉市江汉区示范地址（模拟）",
    managerName: "李店长（模拟）",
    phone: "138****0002",
    status: "营业中",
    isDemo: true,
  },
];

export const showcaseParties: ResponsibilityParty[] = [
  {
    id: "party-a",
    code: "SUP-A",
    name: "设备供应商A（模拟）",
    type: "设备供应商",
    serviceCategories: toJson(["Gelato制作设备"]),
    serviceRegions: toJson(["华中"]),
    contactName: "周工程师（模拟）",
    contactPhone: "139****1001",
    status: "有效",
    isDemo: true,
  },
  {
    id: "party-b",
    code: "SUP-B",
    name: "设备供应商B（模拟）",
    type: "设备供应商",
    serviceCategories: toJson(["低温储存设备", "售卖温控设备"]),
    serviceRegions: toJson(["华中", "华东"]),
    contactName: "陈工程师（模拟）",
    contactPhone: "139****1002",
    status: "有效",
    isDemo: true,
  },
  {
    id: "party-maint",
    code: "INT-M",
    name: "内部维修组（模拟）",
    type: "内部维修",
    serviceCategories: toJson(["操作/清洁问题", "一般设备"]),
    serviceRegions: toJson(["*"]),
    contactName: "维修值班（模拟）",
    contactPhone: "400-000-1004",
    status: "有效",
    isDemo: true,
  },
];

export const showcaseAssets: Asset[] = [
  {
    id: "asset-gel-001",
    code: "GEL-001",
    name: "光谷后场 Gelato 制作设备 1 号（模拟）",
    storeId: "store-001",
    category: "Gelato制作设备",
    model: "DEMO-G01",
    location: "后场制作区",
    defaultPartyId: "party-a",
    warrantyStatus: "保修内",
    warrantyEndDate: new Date("2027-12-31"),
    operationalStatus: "正常",
    isDemo: true,
  },
  {
    id: "asset-gel-002",
    code: "GEL-002",
    name: "光谷后场 Gelato 制作设备 2 号（模拟）",
    storeId: "store-001",
    category: "Gelato制作设备",
    model: "DEMO-G02",
    location: "后场制作区",
    defaultPartyId: "party-a",
    warrantyStatus: "保修外",
    warrantyEndDate: new Date("2025-12-31"),
    operationalStatus: "异常运行",
    isDemo: true,
  },
  {
    id: "asset-cold-001",
    code: "COLD-001",
    name: "光谷低温储存设备（模拟）",
    storeId: "store-001",
    category: "低温储存设备",
    model: "DEMO-C01",
    location: "后场冷藏区",
    defaultPartyId: "party-b",
    warrantyStatus: "保修内",
    warrantyEndDate: new Date("2027-10-31"),
    operationalStatus: "正常",
    isDemo: true,
  },
  {
    id: "asset-cold-002",
    code: "COLD-002",
    name: "江汉路售卖温控设备（模拟）",
    storeId: "store-002",
    category: "售卖温控设备",
    model: "DEMO-C02",
    location: "前场售卖区",
    defaultPartyId: "party-b",
    warrantyStatus: "保修内",
    warrantyEndDate: new Date("2028-01-31"),
    operationalStatus: "异常运行",
    isDemo: true,
  },
];

const rule = (
  value: Omit<RoutingRule, "isDemo">,
): RoutingRule & { responsibilityParty: ResponsibilityParty | null } => ({
  ...value,
  isDemo: true,
  responsibilityParty:
    showcaseParties.find((party) => party.id === value.responsibilityPartyId) ?? null,
});

export const showcaseRules = [
  rule({
    id: "rule-001",
    code: "R001",
    name: "人身与电气安全硬规则（模拟）",
    enabled: true,
    priority: 10,
    assetCategories: toJson(["*"]),
    faultCategories: toJson(["电气/供电异常"]),
    riskTags: toJson(["冒烟/焦味", "漏电", "人员安全"]),
    warrantyCondition: "*",
    regions: toJson(["*"]),
    responsibilityPartyId: "party-maint",
    priorityLevel: "P1",
    acceptanceSlaSeconds: 60,
    requiresHumanReview: true,
    notifyOps: true,
    explanation: "命中冒烟、漏电或焦味等高风险词，必须人工复核并通知运营。",
  }),
  rule({
    id: "rule-002",
    code: "R002",
    name: "低温与食安风险规则（模拟）",
    enabled: true,
    priority: 10,
    assetCategories: toJson(["低温储存设备", "售卖温控设备"]),
    faultCategories: toJson(["温控异常"]),
    riskTags: toJson(["食品安全"]),
    warrantyCondition: "*",
    regions: toJson(["*"]),
    responsibilityPartyId: "party-b",
    priorityLevel: "P1",
    acceptanceSlaSeconds: 60,
    requiresHumanReview: true,
    notifyOps: true,
    explanation: "低温设备涉及食品安全风险，建议供应商B并强制人工复核。",
  }),
  rule({
    id: "rule-003",
    code: "R003",
    name: "华中 Gelato 保修内机械异常（模拟）",
    enabled: true,
    priority: 20,
    assetCategories: toJson(["Gelato制作设备"]),
    faultCategories: toJson(["机械运行异常", "制作质量异常", "无法启动"]),
    riskTags: toJson([]),
    warrantyCondition: "保修内",
    regions: toJson(["华中"]),
    responsibilityPartyId: "party-a",
    priorityLevel: "P2",
    acceptanceSlaSeconds: 120,
    requiresHumanReview: false,
    notifyOps: false,
    explanation:
      "设备保修内、唯一绑定供应商A，规则覆盖 Gelato 制作设备机械或出品异常。",
  }),
  rule({
    id: "rule-005",
    code: "R005",
    name: "Gelato 保修外一般故障（模拟）",
    enabled: true,
    priority: 30,
    assetCategories: toJson(["Gelato制作设备"]),
    faultCategories: toJson(["机械运行异常", "无法启动", "制作质量异常"]),
    riskTags: toJson([]),
    warrantyCondition: "保修外",
    regions: toJson(["*"]),
    responsibilityPartyId: "party-maint",
    priorityLevel: "P2",
    acceptanceSlaSeconds: 120,
    requiresHumanReview: false,
    notifyOps: false,
    explanation: "设备已过模拟保修期，先由内部维修组受理。",
  }),
  rule({
    id: "rule-009",
    code: "R009",
    name: "一般低温温控异常（模拟）",
    enabled: true,
    priority: 20,
    assetCategories: toJson(["低温储存设备", "售卖温控设备"]),
    faultCategories: toJson(["温控异常"]),
    riskTags: toJson([]),
    warrantyCondition: "*",
    regions: toJson(["*"]),
    responsibilityPartyId: "party-b",
    priorityLevel: "P1",
    acceptanceSlaSeconds: 60,
    requiresHumanReview: false,
    notifyOps: true,
    explanation: "低温或售卖温控设备异常由供应商B覆盖。",
  }),
  rule({
    id: "rule-010",
    code: "R010",
    name: "人工复核兜底（模拟）",
    enabled: true,
    priority: 99,
    assetCategories: toJson(["*"]),
    faultCategories: toJson(["*"]),
    riskTags: toJson([]),
    warrantyCondition: "*",
    regions: toJson(["*"]),
    responsibilityPartyId: "party-maint",
    priorityLevel: "待确认",
    acceptanceSlaSeconds: 0,
    requiresHumanReview: true,
    notifyOps: false,
    explanation: "没有更具体规则时进入人工复核。",
  }),
];

const scenarioInputs: Record<ScenarioId, ReportInput> = {
  normal: {
    storeId: "store-001",
    assetId: "asset-gel-001",
    originalDescription:
      "今天上午开始机器运行时有明显异响，做出来的产品不太成型，已经影响正常出品。",
    occurredAtText: "今天上午",
    productionImpact: "中",
    businessImpact: "中",
    userRiskTags: ["异常声音"],
    reporterName: "张店长（模拟）",
    attachmentUrls: [],
  },
  missing: {
    storeId: "store-002",
    assetId: null,
    originalDescription: "售卖柜温度一直往上升，现在不知道具体是哪台。",
    occurredAtText: "刚刚",
    productionImpact: "不确定",
    businessImpact: "中",
    userRiskTags: ["温度异常"],
    reporterName: "李店长（模拟）",
    attachmentUrls: [],
  },
  low: {
    storeId: "store-001",
    assetId: "asset-gel-002",
    originalDescription: "机器坏了，没反应。",
    occurredAtText: "刚刚",
    productionImpact: "不确定",
    businessImpact: "不确定",
    userRiskTags: ["不确定"],
    reporterName: "张店长（模拟）",
    attachmentUrls: [],
  },
  timeout: {
    storeId: "store-001",
    assetId: "asset-cold-001",
    originalDescription: "低温设备温度快速升高，已经影响生产，请尽快处理。",
    occurredAtText: "10分钟前",
    productionImpact: "高",
    businessImpact: "高",
    userRiskTags: ["温度异常"],
    reporterName: "张店长（模拟）",
    attachmentUrls: [],
  },
  return: {
    storeId: "store-001",
    assetId: "asset-gel-001",
    originalDescription:
      "今天上午开始机器运行时有明显异响，做出来的产品不太成型，已经影响正常出品。",
    occurredAtText: "今天上午",
    productionImpact: "中",
    businessImpact: "中",
    userRiskTags: ["异常声音"],
    reporterName: "张店长（模拟）",
    attachmentUrls: [],
  },
};

function initialState(scenario: ScenarioId): SandboxState {
  return {
    scenario,
    input: structuredClone(scenarioInputs[scenario]),
    analysis: null,
    analysisHistory: [],
    route: null,
    order: null,
    assetId: scenarioInputs[scenario].assetId ?? null,
    role: "store",
    currentStep: 0,
    timeline: [],
    notifications: [],
    error: "",
    busy: false,
    autoPlaying: false,
  };
}

type StateAction =
  | { type: "RESET"; scenario: ScenarioId }
  | { type: "PATCH"; patch: Partial<SandboxState> }
  | { type: "INPUT"; patch: Partial<ReportInput> };

function reducer(state: SandboxState, action: StateAction): SandboxState {
  if (action.type === "RESET") return initialState(action.scenario);
  if (action.type === "INPUT") {
    return {
      ...state,
      input: { ...state.input, ...action.patch },
      assetId:
        Object.prototype.hasOwnProperty.call(action.patch, "assetId")
          ? action.patch.assetId ?? null
          : state.assetId,
      error: "",
    };
  }
  return { ...state, ...action.patch };
}

function partyName(id: string | null) {
  return showcaseParties.find((party) => party.id === id)?.name ?? "待人工定责";
}

function makeEvent(
  fromStatus: string,
  toStatus: string,
  actorRole: string,
  actorName: string,
  reason: string,
): SandboxTimelineEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fromStatus,
    toStatus,
    actorRole,
    actorName,
    reason,
    timestamp: nowIso(),
  };
}

type SandboxApi = {
  state: SandboxState;
  stores: Store[];
  assets: Asset[];
  parties: ResponsibilityParty[];
  updateInput: (patch: Partial<ReportInput>) => void;
  loadScenario: (scenario: ScenarioId) => void;
  submitReport: () => Promise<void>;
  supplementDevice: () => Promise<void>;
  manualReview: (reason?: string, partyId?: string) => void;
  acceptOrder: () => void;
  startRepair: () => void;
  completeRepair: () => void;
  simulateAlmostTimeout: () => void;
  simulateTimeout: () => void;
  redispatch: (reason?: string, partyId?: string) => void;
  rejectAcceptance: (reason?: string) => void;
  approveAcceptance: () => void;
  restartRepair: () => void;
  reset: () => void;
  advance: () => Promise<void>;
  previous: () => void;
  setAutoPlaying: (value: boolean) => void;
  liveSlaStatus: string;
};

const SandboxContext = createContext<SandboxApi | null>(null);

export function ShowcaseSandboxProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState("normal"));

  const withError = useCallback((action: () => void) => {
    try {
      action();
    } catch (error) {
      dispatch({
        type: "PATCH",
        patch: {
          error: error instanceof Error ? error.message : "沙盒操作失败",
          autoPlaying: false,
        },
      });
    }
  }, []);

  const loadScenario = useCallback((scenario: ScenarioId) => {
    dispatch({ type: "RESET", scenario });
  }, []);

  const updateInput = useCallback((patch: Partial<ReportInput>) => {
    dispatch({ type: "INPUT", patch });
  }, []);

  const submitReport = useCallback(async () => {
    dispatch({ type: "PATCH", patch: { busy: true, error: "" } });
    try {
      const input = ReportInputSchema.parse(state.input);
      const asset =
        showcaseAssets.find((item) => item.id === (input.assetId ?? null)) ?? null;
      const store = showcaseStores.find((item) => item.id === input.storeId);
      if (!store) throw new Error("未识别报修门店。");
      const analysis = await new LocalDeterministicAIProvider().analyze(input, asset);
      const version = {
        version: state.analysisHistory.length + 1,
        createdAt: nowIso(),
        analysis,
      };
      // `order-003` is a frozen Demo seed: it intentionally enters manual
      // review on low confidence even though its form selections also carry
      // an uncertain business-impact value. Preserve that accepted seed
      // scenario here; all other reports follow the live completeness gate.
      if (analysis.missingFields.length && state.scenario !== "low") {
        dispatch({
          type: "PATCH",
          patch: {
            analysis,
            analysisHistory: [...state.analysisHistory, version],
            route: null,
            order: null,
            role: "store",
            currentStep: 1,
            busy: false,
            notifications: ["门店收到定向补充问题"],
          },
        });
        return;
      }
      const route = routeWorkOrder({
        ai: analysis,
        asset,
        store,
        rules: showcaseRules,
      });
      const status: OrderStatus = route.requiresHumanReview
        ? "待人工确认"
        : "待接单";
      const selectedPriority =
        route.selected?.priorityLevel &&
        route.selected.priorityLevel !== "待确认"
          ? route.selected.priorityLevel
          : analysis.prioritySuggestion;
      const dispatchedAt = status === "待接单" ? new Date() : null;
      const deadline = dispatchedAt
        ? calculateAcceptanceDeadline(
            dispatchedAt,
            selectedPriority,
            route.selected?.acceptanceSlaSeconds,
          )
        : null;
      const routeTrace =
        analysis.confidence === "low"
          ? ["R010 · AI置信度低，禁止自动派单"]
          : route.matchedRules.map(
              (item) => `${item.ruleCode} · ${item.explanation}`,
            );
      const order: SandboxOrder = {
        code:
          state.scenario === "normal"
            ? "WO-20260719-001"
            : state.scenario === "low"
              ? "WO-20260719-003"
              : state.scenario === "timeout"
                ? "WO-20260719-004"
                : state.scenario === "return"
                  ? "WO-20260719-007"
                  : "WO-SHOWCASE-002",
        status,
        finalFaultCategory: analysis.faultCategorySuggestion,
        finalPriority: selectedPriority,
        recommendedPartyId: route.selected?.partyId ?? null,
        finalPartyId: route.requiresHumanReview
          ? null
          : route.selected?.partyId ?? null,
        routeExplanation:
          analysis.confidence === "low"
            ? "AI 置信度低，命中人工复核兜底规则 R010，系统禁止自动派单。"
            : route.reason,
        routeTrace,
        manuallyReviewed: false,
        manualReviewReason: "",
        slaStatus: status === "待接单" ? "计时中" : "未开始",
        dispatchedAt: dispatchedAt?.toISOString() ?? null,
        acceptanceDeadline: deadline?.toISOString() ?? null,
        acceptedAt: null,
        repairStartedAt: null,
        repairCause: "",
        repairAction: "",
        partsUsed: "",
        acceptanceResult: "",
        acceptanceComment: "",
        returnCount: 0,
        repeatedFault: false,
      };
      const event = makeEvent(
        "待判断",
        status,
        "system",
        "本地 AI + 规则引擎",
        order.routeExplanation,
      );
      dispatch({
        type: "PATCH",
        patch: {
          analysis,
          analysisHistory: [...state.analysisHistory, version],
          route,
          order,
          role: status === "待人工确认" ? "manager" : "supplier",
          currentStep: 1,
          busy: false,
          timeline: [...state.timeline, event],
          notifications:
            status === "待接单"
              ? [`已通知 ${partyName(order.finalPartyId)} 接单`]
              : ["已通知维修管理人员人工复核"],
        },
      });
    } catch (error) {
      dispatch({
        type: "PATCH",
        patch: {
          busy: false,
          error: error instanceof Error ? error.message : "报修分析失败",
        },
      });
    }
  }, [state]);

  const supplementDevice = useCallback(async () => {
    dispatch({ type: "PATCH", patch: { busy: true, error: "" } });
    try {
      assertRole("store", ["store"], "补充信息");
      const asset = showcaseAssets.find(
        (item) => item.id === "asset-cold-002",
      );
      const store = showcaseStores.find(
        (item) => item.id === state.input.storeId,
      );
      if (!asset || !store) throw new Error("补充设备不可用。");
      if (asset.storeId !== store.id) throw new Error("所选设备不属于报修门店。");
      const nextInput: ReportInput = {
        ...state.input,
        assetId: asset.id,
        originalDescription: `${state.input.originalDescription}；补充：已确认设备编号为 COLD-002，请重新分析。`,
      };
      const analysis = await new LocalDeterministicAIProvider().analyze(
        nextInput,
        asset,
      );
      const route = routeWorkOrder({
        ai: analysis,
        asset,
        store,
        rules: showcaseRules,
      });
      const dispatchedAt = new Date();
      const priority = route.selected?.priorityLevel ?? analysis.prioritySuggestion;
      const deadline = calculateAcceptanceDeadline(
        dispatchedAt,
        priority,
        route.selected?.acceptanceSlaSeconds,
      );
      const order: SandboxOrder = {
        code: "WO-SHOWCASE-002",
        status: route.requiresHumanReview ? "待人工确认" : "待接单",
        finalFaultCategory: analysis.faultCategorySuggestion,
        finalPriority: priority,
        recommendedPartyId: route.selected?.partyId ?? null,
        finalPartyId: route.requiresHumanReview
          ? null
          : route.selected?.partyId ?? null,
        routeExplanation: route.reason,
        routeTrace: route.matchedRules.map(
          (item) => `${item.ruleCode} · ${item.explanation}`,
        ),
        manuallyReviewed: false,
        manualReviewReason: "",
        slaStatus: route.requiresHumanReview ? "未开始" : "计时中",
        dispatchedAt: route.requiresHumanReview
          ? null
          : dispatchedAt.toISOString(),
        acceptanceDeadline: route.requiresHumanReview
          ? null
          : deadline?.toISOString() ?? null,
        acceptedAt: null,
        repairStartedAt: null,
        repairCause: "",
        repairAction: "",
        partsUsed: "",
        acceptanceResult: "",
        acceptanceComment: "",
        returnCount: 0,
        repeatedFault: false,
      };
      dispatch({
        type: "PATCH",
        patch: {
          input: nextInput,
          assetId: asset.id,
          analysis,
          analysisHistory: [
            ...state.analysisHistory,
            {
              version: state.analysisHistory.length + 1,
              createdAt: nowIso(),
              analysis,
            },
          ],
          route,
          order,
          role: order.status === "待接单" ? "supplier" : "manager",
          currentStep: 2,
          busy: false,
          timeline: [
            ...state.timeline,
            makeEvent(
              "待补充",
              order.status,
              "system",
              "本地 AI + 规则引擎",
              `补充 COLD-002 后生成 AI v2；${route.reason}`,
            ),
          ],
          notifications: [
            ...state.notifications,
            `已通知 ${partyName(order.finalPartyId)} 接单`,
          ],
        },
      });
    } catch (error) {
      dispatch({
        type: "PATCH",
        patch: {
          busy: false,
          error: error instanceof Error ? error.message : "补充失败",
        },
      });
    }
  }, [state]);

  const manualReview = useCallback(
    (reason = "现场信息不足，人工核对设备与影响后确认派发。", partyId = "party-maint") =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        assertRole("manager", ["manager", "admin"], "人工确认并派发");
        if (!reason.trim()) throw new Error("人工决策原因不能为空。");
        assertTransition(state.order.status, "待接单");
        const now = new Date();
        const deadline = calculateAcceptanceDeadline(now, "P2");
        const oldParty = partyName(state.order.finalPartyId);
        const nextParty = partyName(partyId);
        const next = {
          ...state.order,
          status: "待接单" as const,
          finalFaultCategory:
            state.order.finalFaultCategory === "不确定"
              ? "无法启动"
              : state.order.finalFaultCategory,
          finalPriority: "P2",
          finalPartyId: partyId,
          manuallyReviewed: true,
          manualReviewReason: reason,
          dispatchedAt: now.toISOString(),
          acceptanceDeadline: deadline?.toISOString() ?? null,
          slaStatus: "计时中",
        };
        dispatch({
          type: "PATCH",
          patch: {
            order: next,
            role: "supplier",
            currentStep: state.currentStep + 1,
            timeline: [
              ...state.timeline,
              makeEvent(
                state.order.status,
                "待接单",
                "manager",
                "维修管理人员（Demo）",
                `人工决策：责任方 ${oldParty} → ${nextParty}；原因：${reason}`,
              ),
            ],
            notifications: [...state.notifications, `已通知 ${nextParty} 接单`],
            error: "",
          },
        });
      }),
    [state, withError],
  );

  const acceptOrder = useCallback(
    () =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        assertRole("supplier", ["supplier"], "接单");
        assertSupplierAssignment(
          state.order.finalPartyId ?? undefined,
          state.order.finalPartyId,
        );
        assertTransition(state.order.status, "处理中");
        dispatch({
          type: "PATCH",
          patch: {
            order: {
              ...state.order,
              status: "处理中",
              slaStatus: "已完成",
              acceptedAt: nowIso(),
            },
            role: "supplier",
            currentStep: state.currentStep + 1,
            timeline: [
              ...state.timeline,
              makeEvent(
                state.order.status,
                "处理中",
                "supplier",
                partyName(state.order.finalPartyId),
                "责任方接受工单并进入处理。",
              ),
            ],
            error: "",
          },
        });
      }),
    [state, withError],
  );

  const startRepair = useCallback(
    () =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        assertRole("supplier", ["supplier"], "开始处理");
        assertSupplierAssignment(
          state.order.finalPartyId ?? undefined,
          state.order.finalPartyId,
        );
        if (state.order.status !== "处理中")
          throw new Error("只有处理中的工单可以开始维修。");
        dispatch({
          type: "PATCH",
          patch: {
            order: { ...state.order, repairStartedAt: nowIso() },
            currentStep: state.currentStep + 1,
            timeline: [
              ...state.timeline,
              makeEvent(
                "处理中",
                "处理中",
                "supplier",
                partyName(state.order.finalPartyId),
                "工程师开始处理。",
              ),
            ],
            error: "",
          },
        });
      }),
    [state, withError],
  );

  const completeRepair = useCallback(
    () =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        assertRole("supplier", ["supplier"], "提交维修完成");
        assertSupplierAssignment(
          state.order.finalPartyId ?? undefined,
          state.order.finalPartyId,
        );
        assertTransition(state.order.status, "待验收");
        dispatch({
          type: "PATCH",
          patch: {
            order: {
              ...state.order,
              status: "待验收",
              repairCause: "Demo 模拟故障原因，由维修人员填写",
              repairAction: "完成模拟检查与维修，未包含危险操作指引",
              partsUsed: "无",
            },
            role: "store",
            currentStep: state.currentStep + 1,
            timeline: [
              ...state.timeline,
              makeEvent(
                state.order.status,
                "待验收",
                "supplier",
                partyName(state.order.finalPartyId),
                "维修结果已提交，等待门店验收。",
              ),
            ],
            notifications: [...state.notifications, "已通知报修门店验收"],
            error: "",
          },
        });
      }),
    [state, withError],
  );

  const simulateAlmostTimeout = useCallback(
    () =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        if (state.order.status !== "待接单")
          throw new Error("只有待接单工单可模拟SLA。");
        dispatch({
          type: "PATCH",
          patch: {
            order: {
              ...state.order,
              acceptanceDeadline: new Date(Date.now() + 20_000).toISOString(),
              slaStatus: "即将超时",
            },
            currentStep: state.currentStep + 1,
            error: "",
          },
        });
      }),
    [state, withError],
  );

  const simulateTimeout = useCallback(
    () =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        assertTransition(state.order.status, "超时未接单");
        dispatch({
          type: "PATCH",
          patch: {
            order: {
              ...state.order,
              status: "超时未接单",
              acceptanceDeadline: new Date(Date.now() - 30_000).toISOString(),
              slaStatus: "已超时",
            },
            role: "manager",
            currentStep: state.currentStep + 1,
            timeline: [
              ...state.timeline,
              makeEvent(
                state.order.status,
                "超时未接单",
                "system",
                "SLA 自动化",
                "超过 Demo 接单截止时间，自动升级。",
              ),
            ],
            notifications: [
              ...state.notifications,
              "维修管理人员：超时升级",
              "运营管理员：P1超时升级",
            ],
            error: "",
          },
        });
      }),
    [state, withError],
  );

  const redispatch = useCallback(
    (reason = "原责任方超时未接单，改派内部维修组。", partyId = "party-maint") =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        assertRole("manager", ["manager", "admin"], "重新定责并派发");
        if (state.order.status !== "超时未接单")
          throw new Error("只有超时工单可在此重新派发。");
        if (!reason.trim()) throw new Error("重新派发必须填写原因。");
        assertTransition("超时未接单", "待人工确认");
        assertTransition("待人工确认", "待接单");
        const oldParty = partyName(state.order.finalPartyId);
        const nextParty = partyName(partyId);
        const now = new Date();
        const deadline = calculateAcceptanceDeadline(
          now,
          state.order.finalPriority,
        );
        dispatch({
          type: "PATCH",
          patch: {
            order: {
              ...state.order,
              status: "待接单",
              finalPartyId: partyId,
              manuallyReviewed: true,
              manualReviewReason: reason,
              dispatchedAt: now.toISOString(),
              acceptanceDeadline: deadline?.toISOString() ?? null,
              acceptedAt: null,
              slaStatus: "计时中",
            },
            role: "supplier",
            currentStep: state.currentStep + 1,
            timeline: [
              ...state.timeline,
              makeEvent(
                "超时未接单",
                "待人工确认",
                "manager",
                "维修管理人员（Demo）",
                "超时工单进入人工复核。",
              ),
              makeEvent(
                "待人工确认",
                "待接单",
                "manager",
                "维修管理人员（Demo）",
                `重新定责：${oldParty} → ${nextParty}；原因：${reason}`,
              ),
            ],
            notifications: [...state.notifications, `已重新通知 ${nextParty}`],
            error: "",
          },
        });
      }),
    [state, withError],
  );

  const rejectAcceptance = useCallback(
    (reason = "设备可运行，但试运行后出品仍不稳定。") =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        assertRole("store", ["store"], "验收不通过");
        if (!reason.trim()) throw new Error("验收不通过必须填写原因。");
        assertTransition(state.order.status, "返修中");
        dispatch({
          type: "PATCH",
          patch: {
            order: {
              ...state.order,
              status: "返修中",
              acceptanceResult: "不通过",
              acceptanceComment: reason,
              returnCount: state.order.returnCount + 1,
            },
            role: "supplier",
            currentStep: state.currentStep + 1,
            timeline: [
              ...state.timeline,
              makeEvent(
                state.order.status,
                "返修中",
                "store",
                "门店人员（Demo）",
                `验收不通过：${reason}`,
              ),
            ],
            notifications: [
              ...state.notifications,
              `已通知原责任方 ${partyName(state.order.finalPartyId)} 返修`,
            ],
            error: "",
          },
        });
      }),
    [state, withError],
  );

  const restartRepair = useCallback(
    () =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        assertRole("supplier", ["supplier"], "接受返修");
        assertSupplierAssignment(
          state.order.finalPartyId ?? undefined,
          state.order.finalPartyId,
        );
        assertTransition(state.order.status, "处理中");
        dispatch({
          type: "PATCH",
          patch: {
            order: {
              ...state.order,
              status: "处理中",
              repairStartedAt: nowIso(),
              repairCause: "",
              repairAction: "",
              acceptanceResult: "",
            },
            role: "supplier",
            currentStep: state.currentStep + 1,
            timeline: [
              ...state.timeline,
              makeEvent(
                state.order.status,
                "处理中",
                "supplier",
                partyName(state.order.finalPartyId),
                "责任方接受返修并重新处理。",
              ),
            ],
            error: "",
          },
        });
      }),
    [state, withError],
  );

  const approveAcceptance = useCallback(
    () =>
      withError(() => {
        if (!state.order) throw new Error("尚未创建工单。");
        assertRole("store", ["store"], "验收通过");
        assertTransition(state.order.status, "已关闭");
        assertCanClose(state.order.status, "通过");
        dispatch({
          type: "PATCH",
          patch: {
            order: {
              ...state.order,
              status: "已关闭",
              acceptanceResult: "通过",
              acceptanceComment: "门店模拟验收通过",
              slaStatus: "已完成",
            },
            role: "store",
            currentStep: state.currentStep + 1,
            timeline: [
              ...state.timeline,
              makeEvent(
                state.order.status,
                "已关闭",
                "store",
                "门店人员（Demo）",
                "门店验收通过，工单关闭并写入设备履历。",
              ),
            ],
            error: "",
            autoPlaying: false,
          },
        });
      }),
    [state, withError],
  );

  const reset = useCallback(
    () => dispatch({ type: "RESET", scenario: state.scenario }),
    [state.scenario],
  );

  const previous = useCallback(() => {
    const scenario = state.scenario;
    dispatch({ type: "RESET", scenario });
  }, [state.scenario]);

  const advance = useCallback(async () => {
    if (!state.analysis) return submitReport();
    if (!state.order) {
      if (state.scenario === "missing") return supplementDevice();
      return;
    }
    if (state.order.status === "待人工确认") return manualReview();
    if (state.order.status === "待接单") {
      if (state.scenario === "timeout") {
        if (state.order.slaStatus !== "即将超时") return simulateAlmostTimeout();
        return simulateTimeout();
      }
      return acceptOrder();
    }
    if (state.order.status === "超时未接单") return redispatch();
    if (state.order.status === "处理中") {
      if (!state.order.repairStartedAt) return startRepair();
      return completeRepair();
    }
    if (state.order.status === "待验收") {
      if (state.scenario === "return" && state.order.returnCount === 0)
        return rejectAcceptance();
      return approveAcceptance();
    }
    if (state.order.status === "返修中") return restartRepair();
  }, [
    state,
    submitReport,
    supplementDevice,
    manualReview,
    simulateAlmostTimeout,
    simulateTimeout,
    acceptOrder,
    redispatch,
    startRepair,
    completeRepair,
    rejectAcceptance,
    approveAcceptance,
    restartRepair,
  ]);

  useEffect(() => {
    if (!state.autoPlaying) return;
    if (state.order?.status === "已关闭") return;
    const timer = window.setTimeout(() => {
      void advance();
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [state.autoPlaying, state.currentStep, state.order?.status, advance]);

  const liveSlaStatus = useMemo(() => {
    if (!state.order) return "未开始";
    if (state.order.slaStatus === "即将超时") return "即将超时";
    return getSlaStatus(
      state.order.acceptanceDeadline
        ? new Date(state.order.acceptanceDeadline)
        : null,
      state.order.acceptedAt ? new Date(state.order.acceptedAt) : null,
    );
  }, [state.order]);

  const value = useMemo<SandboxApi>(
    () => ({
      state,
      stores: showcaseStores,
      assets: showcaseAssets,
      parties: showcaseParties,
      updateInput,
      loadScenario,
      submitReport,
      supplementDevice,
      manualReview,
      acceptOrder,
      startRepair,
      completeRepair,
      simulateAlmostTimeout,
      simulateTimeout,
      redispatch,
      rejectAcceptance,
      approveAcceptance,
      restartRepair,
      reset,
      advance,
      previous,
      setAutoPlaying: (value) =>
        dispatch({ type: "PATCH", patch: { autoPlaying: value } }),
      liveSlaStatus,
    }),
    [
      state,
      updateInput,
      loadScenario,
      submitReport,
      supplementDevice,
      manualReview,
      acceptOrder,
      startRepair,
      completeRepair,
      simulateAlmostTimeout,
      simulateTimeout,
      redispatch,
      rejectAcceptance,
      approveAcceptance,
      restartRepair,
      reset,
      advance,
      previous,
      liveSlaStatus,
    ],
  );

  return (
    <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>
  );
}

export function useShowcaseSandbox() {
  const value = useContext(SandboxContext);
  if (!value)
    throw new Error("useShowcaseSandbox 必须在 ShowcaseSandboxProvider 内使用。");
  return value;
}
