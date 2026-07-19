"use client";

import {
  AlertTriangle,
  Bot,
  Box,
  CheckCircle2,
  Clock3,
  FileSearch,
  Laptop,
  Maximize2,
  PackageCheck,
  RefreshCcw,
  Route,
  Send,
  ShieldAlert,
  Store,
  Smartphone,
  UserCog,
  Users,
  Wrench,
  XCircle,
  ZoomOut,
} from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import type { ReportInput } from "@/lib/types";
import {
  showcaseAssets,
  showcaseParties,
  showcaseStores,
  useShowcaseSandbox,
} from "@/components/showcase/showcase-sandbox";
import { liveViews } from "@/components/showcase/showcase-data";

const statusTone: Record<string, string> = {
  待判断: "blue",
  待补充: "amber",
  待人工确认: "purple",
  待接单: "blue",
  超时未接单: "red",
  处理中: "green",
  待验收: "amber",
  返修中: "red",
  已关闭: "gray",
  已取消: "gray",
};

function Tag({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

function DemoTag() {
  return <span className="demo-tag">Demo 模拟</span>;
}

function partyName(id: string | null | undefined) {
  return showcaseParties.find((party) => party.id === id)?.name ?? "待人工定责";
}

function assetName(id: string | null | undefined) {
  const asset = showcaseAssets.find((item) => item.id === id);
  return asset ? `${asset.code} · ${asset.category}` : "设备待确认";
}

export function LiveProductFrame({
  view,
  onViewChange,
  compact = false,
}: {
  view: string;
  onViewChange?: (view: string) => void;
  compact?: boolean;
}) {
  const { state, reset } = useShowcaseSandbox();
  const frameRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<"desktop" | "laptop" | "mobile">(
    "desktop",
  );
  const [zoomed, setZoomed] = useState(false);
  const current = liveViews.find((item) => item.id === view) ?? liveViews[4];
  return (
    <div
      ref={frameRef}
      className={`live-product-frame ${compact ? "is-compact" : ""}`}
    >
      <div className="live-frame-bar">
        <div className="live-frame-title">
          <span className="live-frame-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <strong>{current.title}</strong>
          <DemoTag />
        </div>
        <div className="live-frame-meta">
          <span>Showcase Sandbox · 不写入 SQLite</span>
          <div className="live-frame-viewports" aria-label="预览视口">
            <button
              type="button"
              className={preview === "desktop" ? "active" : ""}
              onClick={() => setPreview("desktop")}
              title="1440px桌面预览"
            >
              1440
            </button>
            <button
              type="button"
              className={preview === "laptop" ? "active" : ""}
              onClick={() => setPreview("laptop")}
              title="1024px笔记本预览"
            >
              <Laptop />
              1024
            </button>
            <button
              type="button"
              className={preview === "mobile" ? "active" : ""}
              onClick={() => setPreview("mobile")}
              title="390px移动预览"
            >
              <Smartphone />
              390
            </button>
          </div>
          <button
            type="button"
            className={zoomed ? "active" : ""}
            onClick={() => setZoomed(!zoomed)}
            title="切换缩放"
          >
            <ZoomOut />
            缩放
          </button>
          <button
            type="button"
            onClick={() => void frameRef.current?.requestFullscreen()}
            title="产品窗口全屏"
          >
            <Maximize2 />
            全屏
          </button>
          <button type="button" onClick={reset}>
            <RefreshCcw />
            重置
          </button>
        </div>
      </div>
      {onViewChange && (
        <div className="live-view-tabs" role="tablist" aria-label="产品页面">
          {liveViews.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={view === item.id}
                className={view === item.id ? "active" : ""}
                key={item.id}
                onClick={() => onViewChange(item.id)}
              >
                <Icon />
                {item.title}
              </button>
            );
          })}
        </div>
      )}
      <div className="live-product-viewport" data-preview={preview}>
        <div className={`live-preview-canvas ${zoomed ? "is-zoomed" : ""}`}>
          <div className="live-simulation-notice">
            当前窗口复用真实字段、AI Schema、路由、状态机与权限校验；数据仅存在于本页。
          </div>
          {state.error && (
            <div className="live-error" role="alert">
              <AlertTriangle />
              {state.error}
            </div>
          )}
          <LiveView view={view} />
        </div>
      </div>
    </div>
  );
}

function LiveView({ view }: { view: string }) {
  if (view === "report") return <ReportView />;
  if (view === "analysis") return <AnalysisView />;
  if (view === "supplement") return <SupplementView />;
  if (view === "review") return <ReviewView />;
  if (view === "supplier") return <SupplierView />;
  if (view === "sla") return <SlaView />;
  if (view === "repair") return <RepairView />;
  if (view === "acceptance") return <AcceptanceView />;
  if (view === "history") return <HistoryView />;
  return <OrderView />;
}

function ReportView() {
  const { state, assets, stores, updateInput, submitReport } =
    useShowcaseSandbox();
  const availableAssets = assets.filter(
    (asset) => asset.storeId === state.input.storeId,
  );
  const selected = assets.find((asset) => asset.id === state.input.assetId);
  const update = <K extends keyof ReportInput>(
    key: K,
    value: ReportInput[K],
  ) => updateInput({ [key]: value } as Partial<ReportInput>);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void submitReport();
  };
  return (
    <div className="live-page">
      <div className="page-header live-page-header">
        <div>
          <span className="eyebrow">STORE · SMART REPORT</span>
          <h1>发起设备报修</h1>
          <p>请描述现场真实情况。系统会整理信息，但不会覆盖原始报修内容。</p>
        </div>
        <DemoTag />
      </div>
      <form className="report-layout live-report-layout" onSubmit={submit}>
        <div className="form-card">
          <div className="section-title">
            <span>1</span>
            <div>
              <h2>确认门店与设备</h2>
              <p>设备可暂选“待确认”，系统会进入补充流程。</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>报修门店 *</span>
              <select
                value={state.input.storeId}
                onChange={(event) => {
                  update("storeId", event.target.value);
                  update("assetId", null);
                }}
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>故障设备</span>
              <select
                value={state.input.assetId ?? ""}
                onChange={(event) =>
                  update("assetId", event.target.value || null)
                }
              >
                <option value="">设备待确认</option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.code} · {asset.category}（模拟）
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selected && (
            <div className="asset-inline">
              <Box />
              <div>
                <strong>
                  {selected.code} · {selected.name}
                </strong>
                <span>
                  {selected.location} · {selected.warrantyStatus} ·{" "}
                  {partyName(selected.defaultPartyId)}
                </span>
              </div>
              <DemoTag />
            </div>
          )}
          <div className="section-title">
            <span>2</span>
            <div>
              <h2>描述故障现象</h2>
              <p>写清看到什么、何时开始、影响什么，不填写猜测原因。</p>
            </div>
          </div>
          <label>
            <span>原始故障描述 *</span>
            <textarea
              rows={4}
              value={state.input.originalDescription}
              onChange={(event) =>
                update("originalDescription", event.target.value)
              }
            />
          </label>
          <div className="form-grid three">
            <label>
              <span>发生时间 *</span>
              <select
                value={state.input.occurredAtText}
                onChange={(event) =>
                  update("occurredAtText", event.target.value)
                }
              >
                {["刚刚", "今天上午", "今天下午", "昨天", "不确定"].map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              <span>生产影响 *</span>
              <select
                value={state.input.productionImpact}
                onChange={(event) =>
                  update(
                    "productionImpact",
                    event.target.value as ReportInput["productionImpact"],
                  )
                }
              >
                {["高", "中", "低", "无", "不确定"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              <span>营业影响 *</span>
              <select
                value={state.input.businessImpact}
                onChange={(event) =>
                  update(
                    "businessImpact",
                    event.target.value as ReportInput["businessImpact"],
                  )
                }
              >
                {["高", "中", "低", "无", "不确定"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span>联系人 *</span>
            <input
              value={state.input.reporterName}
              onChange={(event) => update("reporterName", event.target.value)}
            />
          </label>
          <div className="safe-inline">
            <ShieldAlert />
            <span>
              如出现冒烟、漏电或焦味，请停止自行操作并等待专业人员；系统不会生成危险维修步骤。
            </span>
          </div>
          <div className="form-actions">
            <button className="btn primary large" disabled={state.busy}>
              <Send />
              提交报修并运行本地 AI
            </button>
          </div>
        </div>
        <aside className="ai-preview">
          <div className="ai-icon">
            <Bot />
          </div>
          <span className="eyebrow">AI WORKSPACE</span>
          <h3>提交后将自动完成</h3>
          {[
            "结构化故障摘要",
            "关键信息完整性检查",
            "故障类别与紧急度建议",
            "确定性路由规则匹配",
            "低置信度与高风险转人工",
          ].map((item) => (
            <div key={item}>
              <CheckCircle2 />
              {item}
            </div>
          ))}
        </aside>
      </form>
    </div>
  );
}

function AnalysisView() {
  const { state, submitReport } = useShowcaseSandbox();
  const analysis = state.analysis;
  return (
    <div className="live-page">
      <div className="page-header live-page-header">
        <div>
          <span className="eyebrow">AI SUGGESTION · TRACEABLE</span>
          <h1>AI 分析建议</h1>
          <p>原始事实、模型建议和版本历史分开保存。</p>
        </div>
        {analysis && (
          <Tag tone={analysis.confidence === "low" ? "red" : "purple"}>
            {analysis.confidence} 置信度
          </Tag>
        )}
      </div>
      {!analysis ? (
        <div className="empty live-empty">
          <Bot />
          <h3>尚未运行分析</h3>
          <p>先提交当前固定场景，查看真实 AI Schema 输出。</p>
          <button className="btn primary" onClick={() => void submitReport()}>
            <Bot />
            运行本地确定性 AI
          </button>
        </div>
      ) : (
        <div className="decision-grid live-decision-grid">
          <section className="decision-card raw">
            <div className="decision-head">
              <span>01</span>
              <div>
                <small>ORIGINAL FACT</small>
                <h2>门店原始报修</h2>
              </div>
            </div>
            <blockquote>{state.input.originalDescription.split("；补充：")[0]}</blockquote>
            <dl>
              <div>
                <dt>设备</dt>
                <dd>{assetName(state.assetId)}</dd>
              </div>
              <div>
                <dt>生产 / 营业影响</dt>
                <dd>
                  {state.input.productionImpact} / {state.input.businessImpact}
                </dd>
              </div>
            </dl>
          </section>
          <section className="decision-card ai">
            <div className="decision-head">
              <span>02</span>
              <div>
                <small>AI SUGGESTION</small>
                <h2>结构化建议</h2>
              </div>
            </div>
            <p className="ai-summary">{analysis.standardSummary}</p>
            <dl>
              <div>
                <dt>故障类别建议</dt>
                <dd>{analysis.faultCategorySuggestion}</dd>
              </div>
              <div>
                <dt>症状</dt>
                <dd>{analysis.symptoms.join("、")}</dd>
              </div>
              <div>
                <dt>业务影响</dt>
                <dd>
                  生产 {analysis.productionImpact} / 营业{" "}
                  {analysis.businessImpact}
                </dd>
              </div>
              <div>
                <dt>判断证据</dt>
                <dd>{analysis.evidence.join("；")}</dd>
              </div>
            </dl>
          </section>
          <section className="decision-card rule">
            <div className="decision-head">
              <span>03</span>
              <div>
                <small>COMPLETENESS</small>
                <h2>信息完整性</h2>
              </div>
            </div>
            <dl>
              <div>
                <dt>缺失字段</dt>
                <dd>{analysis.missingFields.join("、") || "无"}</dd>
              </div>
              <div>
                <dt>定向追问</dt>
                <dd>{analysis.followUpQuestions.join("；") || "无需追问"}</dd>
              </div>
              <div>
                <dt>是否转人工</dt>
                <dd>{analysis.requiresHumanReview ? "是" : "否"}</dd>
              </div>
            </dl>
          </section>
          <section className="decision-card human">
            <div className="decision-head">
              <span>04</span>
              <div>
                <small>VERSION HISTORY</small>
                <h2>AI v1 / v2</h2>
              </div>
            </div>
            <div className="live-version-list">
              {state.analysisHistory.map((item) => (
                <div key={item.version}>
                  <strong>v{item.version}</strong>
                  <span>{item.analysis.standardSummary}</span>
                  <small>
                    {item.analysis.faultCategorySuggestion} ·{" "}
                    {item.analysis.confidence}
                  </small>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SupplementView() {
  const { state, submitReport, supplementDevice } = useShowcaseSandbox();
  return (
    <div className="live-page">
      <div className="page-header live-page-header">
        <div>
          <span className="eyebrow">STORE · SUPPLEMENT</span>
          <h1>待补充信息</h1>
          <p>只补充影响识别和派单的关键字段；原始报修内容永久保留。</p>
        </div>
      </div>
      {!state.analysis ? (
        <div className="empty live-empty">
          <FileSearch />
          <h3>先载入信息缺失场景</h3>
          <p>提交后系统会识别缺失的设备编号。</p>
          <button className="btn primary" onClick={() => void submitReport()}>
            提交当前报修
          </button>
        </div>
      ) : (
        <article className="supplement-card">
          <div className="supplement-main">
            <div className="tag-row">
              <Tag tone={state.order ? "green" : "amber"}>
                {state.order ? "已补充" : "待补充"}
              </Tag>
              <span className="eyebrow">FE-002</span>
            </div>
            <h2>{state.input.originalDescription.split("；补充：")[0]}</h2>
            <div className="compare-mini">
              <div>
                <small>AI 已识别</small>
                <strong>{state.analysis.faultCategorySuggestion}</strong>
              </div>
              <div>
                <small>缺失字段</small>
                <strong>
                  {state.analysis.missingFields.join("、") || "已补全"}
                </strong>
              </div>
            </div>
            {state.analysis.followUpQuestions.map((question) => (
              <p className="question" key={question}>
                <Bot />
                {question}
              </p>
            ))}
            <div className="live-version-strip">
              {state.analysisHistory.map((item) => (
                <Tag key={item.version} tone="purple">
                  AI v{item.version} · {item.analysis.confidence}
                </Tag>
              ))}
            </div>
          </div>
          <div className="supplement-action">
            <label>
              <span>选择本门店设备</span>
              <select
                value={state.assetId ?? ""}
                aria-readonly="true"
                onChange={() => undefined}
              >
                <option value="">请选择</option>
                <option value="asset-cold-002">
                  COLD-002 · 江汉路售卖温控设备（模拟）
                </option>
              </select>
            </label>
            <button
              className="btn primary"
              disabled={Boolean(state.order)}
              onClick={() => void supplementDevice()}
            >
              <RefreshCcw />
              补充 COLD-002 并重新分析
            </button>
          </div>
        </article>
      )}
    </div>
  );
}

function ReviewView() {
  const { state, submitReport, manualReview } = useShowcaseSandbox();
  const [reason, setReason] = useState(
    "原始描述过于模糊，人工核对设备身份与影响后确认由内部维修组处理。",
  );
  const [partyId, setPartyId] = useState("party-maint");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    manualReview(reason, partyId);
  };
  if (!state.order) {
    return (
      <div className="empty live-empty">
        <UserCog />
        <h3>尚无待复核工单</h3>
        <p>提交低置信度场景后，系统会阻止自动派单。</p>
        <button className="btn primary" onClick={() => void submitReport()}>
          生成低置信度分析
        </button>
      </div>
    );
  }
  return (
    <div className="live-page">
      <div className="page-header live-page-header">
        <div>
          <span className="eyebrow">MAINTENANCE · REVIEW</span>
          <h1>人工复核与最终决策</h1>
          <p>原始事实、AI建议与规则结果同时可见；原因必填。</p>
        </div>
        <Tag tone={statusTone[state.order.status]}>{state.order.status}</Tag>
      </div>
      <div className="review-layout">
        <OrderDecisionCore />
        <form className="panel action-form decision-form" onSubmit={submit}>
          <h2>人工最终决策</h2>
          <label>
            <span>最终故障类别 *</span>
            <input value="无法启动" readOnly />
          </label>
          <label>
            <span>最终紧急度 *</span>
            <select value="P2" aria-readonly="true" onChange={() => undefined}>
              <option>P2</option>
            </select>
          </label>
          <label>
            <span>最终责任方 *</span>
            <select
              value={partyId}
              onChange={(event) => setPartyId(event.target.value)}
            >
              {showcaseParties.map((party) => (
                <option value={party.id} key={party.id}>
                  {party.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>人工决策原因 *</span>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <button
            className="btn primary"
            disabled={state.order.status !== "待人工确认"}
          >
            <UserCog />
            确认人工决策并派发
          </button>
        </form>
      </div>
    </div>
  );
}

function OrderDecisionCore() {
  const { state } = useShowcaseSandbox();
  if (!state.order || !state.analysis) return null;
  const order = state.order;
  return (
    <div className="decision-grid live-decision-grid">
      <section className="decision-card raw">
        <div className="decision-head">
          <span>01</span>
          <div>
            <small>ORIGINAL FACT</small>
            <h2>门店原始报修</h2>
          </div>
        </div>
        <blockquote>{state.input.originalDescription.split("；补充：")[0]}</blockquote>
        <dl>
          <div>
            <dt>发生时间</dt>
            <dd>{state.input.occurredAtText}</dd>
          </div>
          <div>
            <dt>设备</dt>
            <dd>{assetName(state.assetId)}</dd>
          </div>
        </dl>
      </section>
      <section className="decision-card ai">
        <div className="decision-head">
          <span>02</span>
          <div>
            <small>AI SUGGESTION</small>
            <h2>AI 分析建议</h2>
          </div>
          <Tag tone={state.analysis.confidence === "low" ? "red" : "purple"}>
            {state.analysis.confidence}
          </Tag>
        </div>
        <p className="ai-summary">{state.analysis.standardSummary}</p>
        <dl>
          <div>
            <dt>分类建议</dt>
            <dd>{state.analysis.faultCategorySuggestion}</dd>
          </div>
          <div>
            <dt>证据</dt>
            <dd>{state.analysis.evidence.join("；")}</dd>
          </div>
        </dl>
      </section>
      <section className="decision-card rule">
        <div className="decision-head">
          <span>03</span>
          <div>
            <small>DETERMINISTIC RULE</small>
            <h2>确定性规则</h2>
          </div>
          <Tag tone="green">规则</Tag>
        </div>
        <p className="route-result">
          <Route />
          {order.routeExplanation}
        </p>
        <dl>
          <div>
            <dt>命中依据</dt>
            <dd>{order.routeTrace.join("；") || "R010 · 人工复核兜底"}</dd>
          </div>
          <div>
            <dt>推荐责任方</dt>
            <dd>{partyName(order.recommendedPartyId)}</dd>
          </div>
        </dl>
      </section>
      <section className="decision-card human">
        <div className="decision-head">
          <span>04</span>
          <div>
            <small>HUMAN FINAL DECISION</small>
            <h2>人工最终决策</h2>
          </div>
          <Tag tone={order.manuallyReviewed ? "amber" : "gray"}>
            {order.manuallyReviewed ? "已人工确认" : "尚未修改"}
          </Tag>
        </div>
        <dl>
          <div>
            <dt>最终责任方</dt>
            <dd>{partyName(order.finalPartyId)}</dd>
          </div>
          <div>
            <dt>最终分类 / 等级</dt>
            <dd>
              {order.finalFaultCategory} / {order.finalPriority}
            </dd>
          </div>
          <div>
            <dt>决策原因</dt>
            <dd>{order.manualReviewReason || "当前沿用规则结果"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function OrderView() {
  const { state, submitReport, liveSlaStatus } = useShowcaseSandbox();
  const order = state.order;
  if (!order) {
    return (
      <div className="empty live-empty">
        <ClipboardCheckIcon />
        <h3>统一工单尚未创建</h3>
        <p>提交场景后，系统只在信息完整时创建正式工单。</p>
        <button className="btn primary" onClick={() => void submitReport()}>
          提交当前报修
        </button>
      </div>
    );
  }
  const nextStep = getNextStep(order.status, order.finalPartyId);
  return (
    <div className="live-page">
      <div className="order-title live-order-title">
        <div className="title-line">
          <div>
            <span className="eyebrow">
              {order.code} · <DemoTag />
            </span>
            <h1>{state.analysis?.standardSummary}</h1>
          </div>
          <div className="tag-row">
            <Tag tone={order.finalPriority === "P1" ? "red" : "amber"}>
              {order.finalPriority}
            </Tag>
            <Tag tone={statusTone[order.status]}>{order.status}</Tag>
            {order.returnCount > 0 && (
              <Tag tone="red">返修 {order.returnCount} 次</Tag>
            )}
          </div>
        </div>
        <div className="detail-strip">
          <span>
            <Store />
            {showcaseStores.find((store) => store.id === state.input.storeId)
              ?.name ?? "模拟门店"}
          </span>
          <span>
            <Box />
            {assetName(state.assetId)}
          </span>
          <span>
            <Users />
            {partyName(order.finalPartyId)}
          </span>
          <span>
            <Clock3 />
            {liveSlaStatus}
          </span>
        </div>
      </div>
      <section
        className={`status-summary ${["超时未接单", "返修中"].includes(order.status) ? "risk" : ""}`}
      >
        <div>
          <small>当前状态</small>
          <strong>{order.status}</strong>
        </div>
        <div>
          <small>当前责任方</small>
          <strong>{partyName(order.finalPartyId)}</strong>
        </div>
        <div>
          <small>下一步由谁做什么</small>
          <strong>{nextStep}</strong>
        </div>
        <div>
          <small>SLA 状态</small>
          <strong>{order.slaStatus}</strong>
        </div>
      </section>
      <OrderDecisionCore />
      <Timeline />
    </div>
  );
}

function SupplierView() {
  const { state, submitReport, acceptOrder, startRepair, completeRepair } =
    useShowcaseSandbox();
  const order = state.order;
  if (!order) {
    return (
      <div className="empty live-empty">
        <Wrench />
        <h3>暂无分配任务</h3>
        <p>先提交报修并完成路由。</p>
        <button className="btn primary" onClick={() => void submitReport()}>
          创建工单
        </button>
      </div>
    );
  }
  return (
    <div className="live-page">
      <div className="page-header live-page-header">
        <div>
          <span className="eyebrow">SUPPLIER · TASK CENTER</span>
          <h1>我的维修任务</h1>
          <p>只显示当前责任方可以操作的工单。</p>
        </div>
        <Tag tone={statusTone[order.status]}>{order.status}</Tag>
      </div>
      <article className="order-card">
        <div className="order-head">
          <div>
            <span className="eyebrow">{order.code}</span>
            <h3>{state.analysis?.standardSummary}</h3>
          </div>
          <div className="tag-row">
            <Tag tone={order.finalPriority === "P1" ? "red" : "amber"}>
              {order.finalPriority}
            </Tag>
            <Tag tone={statusTone[order.status]}>{order.status}</Tag>
          </div>
        </div>
        <div className="order-meta">
          <span>
            <Store />
            {showcaseStores.find((store) => store.id === state.input.storeId)
              ?.name ?? "模拟门店"}
          </span>
          <span>
            <Box />
            {assetName(state.assetId)}
          </span>
          <span>
            <Users />
            {partyName(order.finalPartyId)}
          </span>
        </div>
      </article>
      <section className="panel live-action-panel">
        <h2>当前操作</h2>
        {order.status === "待接单" && (
          <button className="btn primary" onClick={acceptOrder}>
            <CheckCircle2 />
            接单并进入处理
          </button>
        )}
        {order.status === "处理中" && !order.repairStartedAt && (
          <button className="btn primary" onClick={startRepair}>
            <Wrench />
            开始处理
          </button>
        )}
        {order.status === "处理中" && order.repairStartedAt && (
          <div className="action-form">
            <label>
              <span>实际故障原因 *</span>
              <textarea
                rows={2}
                defaultValue="Demo 模拟故障原因，由维修人员填写"
              />
            </label>
            <label>
              <span>维修动作 *</span>
              <textarea
                rows={2}
                defaultValue="完成模拟检查与维修，未包含危险操作指引"
              />
            </label>
            <label>
              <span>使用配件</span>
              <input defaultValue="无" />
            </label>
            <button className="btn primary" onClick={completeRepair}>
              <PackageCheck />
              提交维修结果
            </button>
          </div>
        )}
        {!["待接单", "处理中"].includes(order.status) && (
          <div className="current-state">
            <CheckCircle2 />
            <div>
              <strong>当前无需供应商操作</strong>
              <span>下一责任方：{getNextStep(order.status, order.finalPartyId)}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function RepairView() {
  return <SupplierView />;
}

function SlaView() {
  const {
    state,
    submitReport,
    simulateAlmostTimeout,
    simulateTimeout,
    redispatch,
    liveSlaStatus,
  } = useShowcaseSandbox();
  const [reason, setReason] = useState(
    "原责任方超时未接单，改派内部维修组。",
  );
  const order = state.order;
  if (!order) {
    return (
      <div className="empty live-empty">
        <Clock3 />
        <h3>尚无SLA计时工单</h3>
        <button className="btn primary" onClick={() => void submitReport()}>
          创建P1待接单工单
        </button>
      </div>
    );
  }
  return (
    <div className="live-page">
      <div className="page-header live-page-header">
        <div>
          <span className="eyebrow">MANAGER · SLA EXCEPTION</span>
          <h1>P1超时与重新定责</h1>
          <p>Demo SLA：P1 60秒，正式落地需按企业规则配置。</p>
        </div>
        <Tag tone={liveSlaStatus === "已超时" ? "red" : "amber"}>
          {liveSlaStatus}
        </Tag>
      </div>
      <section className="status-summary risk">
        <div>
          <small>当前状态</small>
          <strong>{order.status}</strong>
        </div>
        <div>
          <small>当前责任方</small>
          <strong>{partyName(order.finalPartyId)}</strong>
        </div>
        <div>
          <small>Demo接单SLA</small>
          <strong>P1 · 60秒</strong>
        </div>
        <div>
          <small>通知日志</small>
          <strong>{state.notifications.length} 条</strong>
        </div>
      </section>
      <div className="control-grid live-control-grid">
        <section>
          <Clock3 />
          <h2>模拟时间状态</h2>
          <button
            className="btn secondary"
            disabled={order.status !== "待接单"}
            onClick={simulateAlmostTimeout}
          >
            模拟即将超时
          </button>
          <button
            className="btn danger"
            disabled={order.status !== "待接单"}
            onClick={simulateTimeout}
          >
            模拟已经超时
          </button>
        </section>
        <section>
          <RefreshCcw />
          <h2>重新定责并派发</h2>
          <label>
            <span>新责任方 *</span>
            <select
              value="party-maint"
              aria-readonly="true"
              onChange={() => undefined}
            >
              <option value="party-maint">内部维修组（模拟）</option>
            </select>
          </label>
          <label>
            <span>重新定责原因 *</span>
            <textarea
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <button
            className="btn primary"
            disabled={order.status !== "超时未接单"}
            onClick={() => redispatch(reason)}
          >
            重新定责并派发
          </button>
        </section>
      </div>
      <Timeline />
    </div>
  );
}

function AcceptanceView() {
  const {
    state,
    submitReport,
    advance,
    rejectAcceptance,
    approveAcceptance,
    restartRepair,
  } = useShowcaseSandbox();
  const [reason, setReason] = useState(
    "设备可运行，但试运行后出品仍不稳定。",
  );
  const order = state.order;
  if (!order) {
    return (
      <div className="empty live-empty">
        <CheckCircle2 />
        <h3>尚无待验收工单</h3>
        <button className="btn primary" onClick={() => void submitReport()}>
          创建返修场景工单
        </button>
      </div>
    );
  }
  return (
    <div className="live-page">
      <div className="page-header live-page-header">
        <div>
          <span className="eyebrow">STORE · ACCEPTANCE</span>
          <h1>门店验收与返修闭环</h1>
          <p>供应商提交完成不等于工单自动关闭。</p>
        </div>
        <Tag tone={statusTone[order.status]}>{order.status}</Tag>
      </div>
      {order.status !== "待验收" &&
        order.status !== "返修中" &&
        order.status !== "已关闭" && (
          <div className="live-prep">
            <span>当前状态：{order.status}</span>
            <button className="btn primary" onClick={() => void advance()}>
              推进到下一合法状态
            </button>
          </div>
        )}
      {order.status === "待验收" && (
        <div className="review-layout">
          <section className="panel repair-summary">
            <strong>维修方提交结果</strong>
            <span>原因：{order.repairCause || "Demo 模拟故障原因"}</span>
            <span>动作：{order.repairAction || "完成模拟维修"}</span>
            <span>配件：{order.partsUsed || "无"}</span>
          </section>
          <section className="panel action-form">
            <label>
              <span>设备可正常启动 *</span>
              <select defaultValue="是">
                <option>是</option>
                <option>否</option>
              </select>
            </label>
            <label>
              <span>是否仍有异响或错误码 *</span>
              <select defaultValue="否">
                <option>否</option>
                <option>是</option>
              </select>
            </label>
            <label>
              <span>是否满足生产要求 *</span>
              <select defaultValue="是">
                <option>是</option>
                <option>否</option>
              </select>
            </label>
            <button className="btn primary" onClick={approveAcceptance}>
              <CheckCircle2 />
              验收通过并关闭
            </button>
            <label>
              <span>验收不通过原因 *</span>
              <textarea
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <button
              className="btn danger"
              onClick={() => rejectAcceptance(reason)}
            >
              <XCircle />
              验收不通过，进入返修
            </button>
          </section>
        </div>
      )}
      {order.status === "返修中" && (
        <div className="panel live-return-panel">
          <RefreshCcw />
          <div>
            <strong>原工单已进入返修</strong>
            <span>
              返修 {order.returnCount} 次 · 返回 {partyName(order.finalPartyId)}
            </span>
          </div>
          <button className="btn primary" onClick={restartRepair}>
            原责任方接受返修
          </button>
        </div>
      )}
      {order.status === "已关闭" && (
        <div className="current-state">
          <CheckCircle2 />
          <div>
            <strong>门店验收通过，工单已关闭</strong>
            <span>完整维修事实已进入设备履历。</span>
          </div>
        </div>
      )}
      <Timeline />
    </div>
  );
}

function HistoryView() {
  const { state } = useShowcaseSandbox();
  const order = state.order;
  return (
    <div className="live-page">
      <div className="page-header live-page-header">
        <div>
          <span className="eyebrow">ASSET · REPAIR HISTORY</span>
          <h1>{assetName(state.assetId)}</h1>
          <p>设备基础信息与维修历史均为 Demo 模拟数据。</p>
        </div>
        <Tag tone="green">履历可追溯</Tag>
      </div>
      <div className="asset-profile">
        <div>
          <small>所属门店</small>
          <strong>
            {showcaseStores.find((store) => store.id === state.input.storeId)
              ?.name ?? "模拟门店"}
          </strong>
        </div>
        <div>
          <small>设备类别 / 型号</small>
          <strong>
            {showcaseAssets.find((asset) => asset.id === state.assetId)?.category ??
              "待确认"}{" "}
            ·{" "}
            {showcaseAssets.find((asset) => asset.id === state.assetId)?.model ??
              "待确认"}
          </strong>
        </div>
        <div>
          <small>默认责任方</small>
          <strong>
            {partyName(
              showcaseAssets.find((asset) => asset.id === state.assetId)
                ?.defaultPartyId,
            )}
          </strong>
        </div>
        <div>
          <small>返修次数</small>
          <strong>{order?.returnCount ?? 0}</strong>
        </div>
      </div>
      <div className="kpi-grid live-history-kpis">
        {[
          ["历史工单", order ? 1 : 0, "同一设备关联工单"],
          ["已关闭", order?.status === "已关闭" ? 1 : 0, "均经过门店验收"],
          ["返修次数", order?.returnCount ?? 0, "验收不通过产生"],
          ["重复故障", order?.repeatedFault ? 1 : 0, "Demo 30天窗口"],
        ].map(([label, value, note]) => (
          <div className="kpi" key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <Timeline />
    </div>
  );
}

function Timeline() {
  const { state } = useShowcaseSandbox();
  return (
    <section className="panel timeline live-timeline">
      <div className="panel-head">
        <div>
          <span className="eyebrow">AUDIT TRAIL</span>
          <h2>状态时间线</h2>
        </div>
        <Tag tone="blue">{state.timeline.length} 条日志</Tag>
      </div>
      {state.timeline.length ? (
        state.timeline.map((event, index) => (
          <div className="timeline-item" key={event.id}>
            <span
              className={`timeline-dot ${index === state.timeline.length - 1 ? "current" : ""}`}
            />
            <div>
              <div>
                <Tag tone={statusTone[event.toStatus]}>{event.toStatus}</Tag>
                <time>
                  {new Date(event.timestamp).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </time>
              </div>
              <strong>{event.reason}</strong>
              <p>
                {event.actorName} · {event.actorRole}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="muted">提交报修后，所有状态和责任变化将进入时间线。</p>
      )}
    </section>
  );
}

function getNextStep(status: string, partyId: string | null) {
  return (
    {
      待人工确认: "维修管理：核对AI建议与规则结果",
      待接单: `${partyName(partyId)}：确认接单`,
      超时未接单: "维修管理：重新定责并派发",
      处理中: `${partyName(partyId)}：提交维修结果`,
      待验收: "门店：现场试运行并验收",
      返修中: `${partyName(partyId)}：接受返修`,
      已关闭: "已完成：写入设备履历",
    }[status] ?? "系统：等待下一合法状态"
  );
}

function ClipboardCheckIcon() {
  return <CheckCircle2 />;
}

export function MechanismCase() {
  const { state, submitReport } = useShowcaseSandbox();
  const [active, setActive] = useState("input");
  const steps = useMemo(
    () => [
      {
        id: "input",
        label: "原始输入",
        value: "门店现场事实",
      },
      { id: "ai", label: "AI", value: "理解与整理" },
      { id: "rule", label: "规则", value: "R003 · P2" },
      { id: "system", label: "系统", value: "工单与状态" },
      { id: "human", label: "人工", value: "维修与验收" },
    ],
    [],
  );
  const analysis = state.analysis;
  const order = state.order;
  return (
    <div className="mechanism-case">
      <div className="mechanism-steps">
        {steps.map((step, index) => (
          <button
            type="button"
            className={active === step.id ? "active" : ""}
            onClick={() => setActive(step.id)}
            key={step.id}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.label}</strong>
            <small>{step.value}</small>
          </button>
        ))}
      </div>
      <div className="mechanism-output">
        {!analysis && (
          <div className="mechanism-run">
            <p>运行同一条固定报修，查看四种机制依次产出的真实字段。</p>
            <button className="btn primary" onClick={() => void submitReport()}>
              <Bot />
              运行联动案例
            </button>
          </div>
        )}
        {active === "input" && (
          <div>
            <span className="eyebrow">ORIGINAL INPUT</span>
            <blockquote>
              “今天上午机器声音特别大，做出来的产品也不成型。”
            </blockquote>
            <dl>
              <div>
                <dt>门店 / 设备</dt>
                <dd>光谷店（模拟） / GEL-001（模拟）</dd>
              </div>
              <div>
                <dt>边界</dt>
                <dd>原始内容永久保留，不被AI摘要覆盖。</dd>
              </div>
            </dl>
          </div>
        )}
        {active === "ai" && (
          <div>
            <span className="eyebrow">AI SUGGESTION</span>
            <h3>{analysis?.standardSummary ?? "请先运行联动案例"}</h3>
            <dl>
              <div>
                <dt>故障现象</dt>
                <dd>{analysis?.symptoms.join("、") ?? "—"}</dd>
              </div>
              <div>
                <dt>业务影响</dt>
                <dd>
                  生产 {analysis?.productionImpact ?? "—"} / 营业{" "}
                  {analysis?.businessImpact ?? "—"}
                </dd>
              </div>
              <div>
                <dt>置信度 / 证据</dt>
                <dd>
                  {analysis?.confidence ?? "—"} ·{" "}
                  {analysis?.evidence.join("；") ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        )}
        {active === "rule" && (
          <div>
            <span className="eyebrow">DETERMINISTIC RULE</span>
            <h3>R003 · 华中 Gelato 保修内机械异常</h3>
            <dl>
              <div>
                <dt>设备 / 保修 / 区域</dt>
                <dd>GEL-001 / 保修内 / 华中（均为Demo模拟）</dd>
              </div>
              <div>
                <dt>责任方 / SLA</dt>
                <dd>{partyName(order?.recommendedPartyId)} / P2 120秒</dd>
              </div>
              <div>
                <dt>路由理由</dt>
                <dd>{order?.routeExplanation ?? "请先运行联动案例"}</dd>
              </div>
            </dl>
          </div>
        )}
        {active === "system" && (
          <div>
            <span className="eyebrow">SYSTEM RECORD</span>
            <h3>{order?.code ?? "故障事件待生成"}</h3>
            <dl>
              <div>
                <dt>状态 / 当前责任方</dt>
                <dd>
                  {order?.status ?? "—"} / {partyName(order?.finalPartyId)}
                </dd>
              </div>
              <div>
                <dt>通知 / 时间线</dt>
                <dd>
                  {state.notifications.length} 条 / {state.timeline.length} 条
                </dd>
              </div>
              <div>
                <dt>系统职责</dt>
                <dd>创建工单、计算SLA、通知、状态与责任留痕。</dd>
              </div>
            </dl>
          </div>
        )}
        {active === "human" && (
          <div>
            <span className="eyebrow">HUMAN DECISION</span>
            <h3>专业维修事实与门店最终验收</h3>
            <dl>
              <div>
                <dt>维修人员</dt>
                <dd>确认实际故障原因并提交真实维修动作。</dd>
              </div>
              <div>
                <dt>门店</dt>
                <dd>试运行并决定验收通过或原工单返修。</dd>
              </div>
              <div>
                <dt>关键边界</dt>
                <dd>供应商提交完成 ≠ 工单自动关闭。</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
