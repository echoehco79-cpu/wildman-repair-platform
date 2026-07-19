"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Expand,
  ExternalLink,
  FileSearch,
  Fullscreen,
  Grid2X2,
  History,
  Maximize2,
  MonitorPlay,
  Pause,
  Play,
  RefreshCcw,
  ShieldAlert,
  Store,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  businessChain,
  architectureJourney,
  architectureValues,
  capabilityGroups,
  chapters,
  collaborationFlow,
  dataLayer,
  productModules,
  responsibilityColumns,
  roleTasks,
  scenarioDefinitions,
  type EvidenceKind,
  type ProductModule,
} from "@/components/showcase/showcase-data";
import {
  LiveProductFrame,
  MechanismCase,
} from "@/components/showcase/live-product";
import {
  ShowcaseSandboxProvider,
  type ScenarioId,
  useShowcaseSandbox,
} from "@/components/showcase/showcase-sandbox";

const chapterFileNames = [
  "01-business-context.png",
  "02-business-impact.png",
  "03-as-is-boundary.png",
  "04-breakpoints.png",
  "05-root-causes.png",
  "06-to-be.png",
  "07-solution-architecture.png",
  "08-responsibility-boundary.png",
  "09-product-features.png",
  "10-demo-validation.png",
  "11-value-roadmap.png",
  "12-team-summary.png",
];

export default function ShowcaseApp() {
  return (
    <ShowcaseSandboxProvider>
      <ShowcaseExperience />
    </ShowcaseSandboxProvider>
  );
}

function ShowcaseExperience() {
  const railRef = useRef<HTMLDivElement>(null);
  const seededSandbox = useRef(false);
  const { submitReport } = useShowcaseSandbox();
  const [current, setCurrent] = useState(0);
  const [overview, setOverview] = useState(false);
  const [lightbox, setLightbox] = useState<{
    src: string;
    alt: string;
    caption: string;
    maskLogo?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (seededSandbox.current) return;
    seededSandbox.current = true;
    void submitReport();
  }, [submitReport]);

  const goTo = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const clamped = Math.max(0, Math.min(chapters.length - 1, index));
    const rail = railRef.current;
    const target = rail?.querySelector<HTMLElement>(
      `[data-chapter-index="${clamped}"]`,
    );
    if (!target || !rail) return;
    setOverview(false);
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    if (mobile) {
      target.scrollIntoView({ behavior, block: "start" });
    } else {
      rail.scrollTo({ left: target.offsetLeft, behavior });
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const stored = window.sessionStorage.getItem("showcase-chapter");
    const requested = chapters.findIndex(
      (chapter) => chapter.id === hash || chapter.number === hash,
    );
    const fallback = stored
      ? chapters.findIndex((chapter) => chapter.id === stored)
      : 0;
    const index = requested >= 0 ? requested : Math.max(0, fallback);
    window.requestAnimationFrame(() => goTo(index, "auto"));
  }, [goTo]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number(
          (visible.target as HTMLElement).dataset.chapterIndex ?? 0,
        );
        const chapter = chapters[index];
        setCurrent(index);
        window.sessionStorage.setItem("showcase-chapter", chapter.id);
        window.history.replaceState(null, "", `#${chapter.id}`);
      },
      { root: rail, threshold: [0.55, 0.72] },
    );
    rail
      .querySelectorAll("[data-chapter-index]")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (lightbox && event.key === "Escape") {
        setLightbox(null);
        return;
      }
      if (overview && event.key === "Escape") {
        setOverview(false);
        window.requestAnimationFrame(() => goTo(current, "auto"));
        return;
      }
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        goTo(current + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goTo(current - 1);
      }
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(chapters.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo, lightbox, overview]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let wheelLock = false;
    const onWheel = (event: WheelEvent) => {
      if (window.matchMedia("(max-width: 760px)").matches || overview) return;
      const target = event.target as HTMLElement;
      const scrollable = target.closest<HTMLElement>(".live-product-viewport");
      if (scrollable && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        const canDown =
          event.deltaY > 0 &&
          scrollable.scrollTop + scrollable.clientHeight <
            scrollable.scrollHeight - 2;
        const canUp = event.deltaY < 0 && scrollable.scrollTop > 2;
        if (canDown || canUp) return;
      }
      if (Math.abs(event.deltaY) < 12 && Math.abs(event.deltaX) < 12) return;
      event.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      goTo(current + (delta > 0 ? 1 : -1));
      window.setTimeout(() => {
        wheelLock = false;
      }, 520);
    };
    rail.addEventListener("wheel", onWheel, { passive: false });
    return () => rail.removeEventListener("wheel", onWheel);
  }, [current, goTo, overview]);

  const copyCurrent = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${chapters[current].id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  };

  return (
    <div className={`showcase ${overview ? "overview-open" : ""}`}>
      <header className="showcase-topbar">
        <Link href="/showcase" className="showcase-brand" aria-label="展示看板首页">
          <strong>野人先生</strong>
          <span>AI 设备维修协同中枢 · 方案展示看板</span>
        </Link>
        <nav className="chapter-nav" aria-label="章节导航">
          {chapters.map((chapter, index) => (
            <button
              type="button"
              aria-label={`第${chapter.number}章 ${chapter.title}`}
              aria-current={current === index ? "page" : undefined}
              className={current === index ? "active" : ""}
              key={chapter.id}
              onClick={() => goTo(index)}
            >
              {chapter.number}
            </button>
          ))}
        </nav>
        <div className="showcase-actions">
          <button type="button" onClick={copyCurrent} title="复制当前章节链接">
            {copied ? <Check /> : <Copy />}
            <span>{copied ? "已复制" : "复制链接"}</span>
          </button>
          <button
            type="button"
            className={overview ? "active" : ""}
            onClick={() => setOverview(!overview)}
            title="总览模式"
          >
            <Grid2X2 />
            <span>总览</span>
          </button>
          <button type="button" onClick={toggleFullscreen} title="全屏模式">
            <Fullscreen />
            <span>全屏</span>
          </button>
        </div>
      </header>

      <div className="showcase-progress" aria-hidden="true">
        <i style={{ width: `${((current + 1) / chapters.length) * 100}%` }} />
      </div>

      <main className="showcase-rail" ref={railRef}>
        {chapters.map((chapter, index) => (
          <ChapterFrame
            chapter={chapter}
            index={index}
            key={chapter.id}
            onImage={setLightbox}
          >
            <ChapterContent index={index} onImage={setLightbox} />
          </ChapterFrame>
        ))}
      </main>

      <footer className="showcase-footer">
        <div className="footer-chapter">
          <span>{chapters[current].number}</span>
          <strong>{chapters[current].title}</strong>
        </div>
        <div className="footer-controls">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
          >
            <ChevronLeft />
            上一页
          </button>
          <span>
            {String(current + 1).padStart(2, "0")} / {chapters.length}
          </span>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === chapters.length - 1}
          >
            下一页
            <ChevronRight />
          </button>
        </div>
        <Link href="/demo" className="demo-link">
          <Play />
          进入系统Demo
        </Link>
      </footer>

      {overview && (
        <OverviewGrid
          current={current}
          onClose={() => {
            setOverview(false);
            window.requestAnimationFrame(() => goTo(current, "auto"));
          }}
          onSelect={goTo}
        />
      )}

      {lightbox && (
        <ImageLightbox image={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

function ChapterFrame({
  chapter,
  index,
  children,
}: {
  chapter: (typeof chapters)[number];
  index: number;
  children: ReactNode;
  onImage: (image: {
    src: string;
    alt: string;
    caption: string;
  }) => void;
}) {
  return (
    <section
      className={`showcase-chapter chapter-${chapter.number}`}
      id={chapter.id}
      data-chapter-index={index}
      aria-labelledby={`title-${chapter.id}`}
    >
      <div className="chapter-canvas">
        <div className="chapter-marker">
          <span>{chapter.act}</span>
          <small>{chapter.source}</small>
        </div>
        {children}
      </div>
    </section>
  );
}

function ChapterHeader({
  number,
  title,
  kicker,
  evidence,
}: {
  number: string;
  title: string;
  kicker: string;
  evidence: EvidenceKind | EvidenceKind[];
}) {
  const badges = Array.isArray(evidence) ? evidence : [evidence];
  const chapter = chapters.find((item) => item.number === number)!;
  return (
    <div className="chapter-header">
      <div>
        <span className="chapter-kicker">
          {number} · {kicker}
        </span>
        <h1 id={`title-${chapter.id}`}>{title}</h1>
      </div>
      <div className="evidence-row">
        {badges.map((item) => (
          <EvidenceBadge kind={item} key={item} />
        ))}
      </div>
    </div>
  );
}

function EvidenceBadge({ kind }: { kind: EvidenceKind }) {
  const tone = {
    已确认事实: "confirmed",
    合理推断: "inference",
    行业参照: "reference",
    待企业验证: "verify",
    Demo模拟验证: "demo",
  }[kind];
  return <span className={`evidence-badge ${tone}`}>{kind}</span>;
}

function ChapterContent({
  index,
  onImage,
}: {
  index: number;
  onImage: (image: {
    src: string;
    alt: string;
    caption: string;
    maskLogo?: boolean;
  }) => void;
}) {
  if (index === 0) return <Chapter01 />;
  if (index === 1) return <Chapter02 />;
  if (index === 2) return <Chapter03 onImage={onImage} />;
  if (index === 3) return <Chapter04 />;
  if (index === 4) return <Chapter05 />;
  if (index === 5) return <Chapter06 onImage={onImage} />;
  if (index === 6) return <Chapter07 />;
  if (index === 7) return <Chapter08 />;
  if (index === 8) return <Chapter09 onImage={onImage} />;
  if (index === 9) return <Chapter10 />;
  if (index === 10) return <Chapter11 />;
  return <Chapter12 />;
}

function Chapter01() {
  return (
    <>
      <ChapterHeader
        number="01"
        kicker="BUSINESS CONTEXT"
        title="门店不是销售终点，还是现制链路的最后生产节点"
        evidence={["已确认事实", "合理推断"]}
      />
      <div className="context-layout">
        <div className="context-thesis">
          <span className="thesis-index">命题理解</span>
          <p>
            设备异常需要被转化为一条清楚、可流转、可追责、可验收的协同链路。
          </p>
          <div className="role-orbit">
            <div className="orbit-center">
              <Wrench />
              <strong>统一维修工单</strong>
              <small>唯一协同主记录</small>
            </div>
            <div className="orbit-role store-role">
              <Store />
              门店
            </div>
            <div className="orbit-role manager-role">
              <UserCog />
              维修管理
            </div>
            <div className="orbit-role supplier-role">
              <Users />
              责任方
            </div>
          </div>
        </div>
        <div className="business-chain">
          <span className="chain-label">从供应链到门店兑现</span>
          {businessChain.map((item, index) => (
            <div className={`chain-node ${item.tone}`} key={item.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
              {index < businessChain.length - 1 && <ArrowRight />}
            </div>
          ))}
          <p>
            设备处在制作与出品之间。维修协同不是孤立的后台事务，而是保障门店制作能力的经营基础设施。
          </p>
        </div>
      </div>
    </>
  );
}

function Chapter02() {
  const impacts = [
    ["生产", "制作能力受限", "合理推断"],
    ["营业", "可售品项与服务节奏受影响", "待企业验证"],
    ["温控", "原料或成品状态需要确认", "合理推断"],
    ["食安", "高风险情形必须进入人工", "行业参照"],
  ];
  return (
    <>
      <ChapterHeader
        number="02"
        kicker="BUSINESS IMPACT"
        title="设备异常会沿着经营链逐级放大"
        evidence={["合理推断", "待企业验证"]}
      />
      <div className="impact-layout">
        <div className="impact-chain" aria-label="经营影响链">
          {[
            ["设备异常", "现场事实"],
            ["制作能力", "产能与稳定性"],
            ["产品出品", "品质与速度"],
            ["门店营业", "服务与销售"],
            ["品牌承诺", "顾客感知"],
          ].map(([title, note], index) => (
            <div className={index === 0 ? "active" : ""} key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <small>{note}</small>
              {index < 4 && <ArrowRight />}
            </div>
          ))}
        </div>
        <div className="impact-matrix">
          <div className="matrix-intro">
            <span>判断重点</span>
            <h2>先判断业务影响，再判断如何流转</h2>
            <p>
              真实发生频率、损失金额和改善空间目前没有企业数据，均不得外推。
            </p>
          </div>
          <div className="matrix-lines">
            {impacts.map(([title, detail, evidence], index) => (
              <div key={title}>
                <span className="matrix-number">0{index + 1}</span>
                <strong>{title}</strong>
                <p>{detail}</p>
                <EvidenceBadge kind={evidence as EvidenceKind} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Chapter03({
  onImage,
}: {
  onImage: (image: {
    src: string;
    alt: string;
    caption: string;
    maskLogo?: boolean;
  }) => void;
}) {
  return (
    <>
      <ChapterHeader
        number="03"
        kicker="AS-IS & RESEARCH BOUNDARY"
        title="As-Is 是研究假设，不是企业事实"
        evidence={["合理推断", "待企业验证"]}
      />
      <div className="as-is-layout">
        <ImageFigure
          src="/showcase/as-is-flow.png"
          alt="设备维修协同现状流程假设图，从发起报修到关闭归档"
          caption="AS-IS流程主体 · 假设版，待企业校准"
          maskLogo
          onOpen={onImage}
        />
        <aside className="research-boundary">
          <div className="as-is-warning">
            <AlertTriangle />
            <div>
              <strong>假设版，待企业校准</strong>
              <span>未把公开信息无法支持的流程写成现状。</span>
            </div>
          </div>
          {[
            ["已确认事实", "品牌业务链与赛题协同目标"],
            ["合理推断", "多角色维修协同可能存在等待与转派"],
            ["行业参照", "统一工单、SLA、状态事件与验收闭环"],
            ["待企业验证", "真实渠道、组织、供应商、时长与规则"],
          ].map(([label, text]) => (
            <div className="boundary-line" key={label}>
              <EvidenceBadge kind={label as EvidenceKind} />
              <p>{text}</p>
            </div>
          ))}
          <p className="boundary-source">
            来源：DeepResearch 的 As-Is 假设、T1—T8 等待区间与研究限制。
          </p>
        </aside>
      </div>
    </>
  );
}

function Chapter04() {
  const focus = new Set([3, 5, 6, 7, 8, 10, 13, 14]);
  const map = [
    ["发现", "入口缺乏统一"],
    ["判断", "自处理边界不清"],
    ["报修", "信息易失真"],
    ["登记", "多渠道重复"],
    ["补充", "追问无序"],
    ["台账", "设备身份不稳"],
    ["定责", "依赖个人经验"],
    ["规则", "理由不可解释"],
    ["内修", "处理状态分散"],
    ["转派", "责任反复"],
    ["接单", "反馈不可见"],
    ["维修", "结果不结构化"],
    ["验收", "完成不等于解决"],
    ["关闭", "履历与返修断裂"],
  ];
  return (
    <>
      <ChapterHeader
        number="04"
        kicker="COLLABORATION BREAKPOINTS"
        title="真正的断点不只在报修入口，而在责任与状态交接"
        evidence={["合理推断", "Demo模拟验证"]}
      />
      <div className="breakpoint-layout">
        <div className="breakpoint-track">
          <div className="track-line" aria-hidden="true" />
          {map.map(([title, issue], index) => {
            const number = index + 1;
            return (
              <div
                className={`breakpoint ${focus.has(number) ? "focus" : ""}`}
                key={title}
              >
                <span>T{number}</span>
                <i />
                <strong>{title}</strong>
                <small>{issue}</small>
              </div>
            );
          })}
        </div>
        <div className="breakpoint-correspondence">
          {[
            ["T3 / T5 / T6", "AI结构化 + 缺失字段 + 设备匹配", "已解决"],
            ["T7 / T8 / T10", "规则路由 + 人工复核 + 责任留痕", "已解决"],
            ["T13 / T14", "门店验收 + 原工单返修 + 设备履历", "已解决"],
            ["预约、真实通知、企业SLA", "当前仅有方向或Demo机制", "部分解决"],
          ].map(([range, mechanism, status]) => (
            <div key={range}>
              <span>{range}</span>
              <strong>{mechanism}</strong>
              <EvidenceBadge
                kind={status === "已解决" ? "Demo模拟验证" : "待企业验证"}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Chapter05() {
  const causes = [
    ["信息", "原始事实、摘要与补充混在一起"],
    ["主数据", "设备身份、保修与供应商无法稳定关联"],
    ["规则", "定责与SLA依赖个人经验"],
    ["协同", "角色看到的状态与下一步不一致"],
    ["闭环", "维修完成、验收、返修与履历断裂"],
  ];
  return (
    <>
      <ChapterHeader
        number="05"
        kicker="ROOT CAUSE TREE"
        title="表面是沟通慢，根因是缺少统一事实与统一责任状态"
        evidence="合理推断"
      />
      <div className="cause-layout">
        <div className="cause-tree">
          <div className="cause-trunk">
            <span>表层问题</span>
            <strong>维修协同反复、等待与不可追溯</strong>
          </div>
          <div className="cause-branches">
            {causes.map(([title, detail], index) => (
              <div key={title}>
                <span>0{index + 1}</span>
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
          <div className="cause-conclusion">
            <AlertTriangle />
            <strong>普通工单或单一AI工具不足</strong>
            <p>
              需要把信息理解、确定性规则、状态机、权限与人工判断放进同一协同系统。
            </p>
          </div>
        </div>
        <aside className="unity-list">
          <span>系统必须建立</span>
          {[
            "统一事实",
            "统一规则",
            "统一责任状态",
            "统一闭环记录",
          ].map((item, index) => (
            <div key={item}>
              <span>0{index + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}

function Chapter06({
  onImage,
}: {
  onImage: (image: {
    src: string;
    alt: string;
    caption: string;
    maskLogo?: boolean;
  }) => void;
}) {
  const [preview, setPreview] = useState("report");
  const nodes = [
    ["report", "门店报修", "门店"],
    ["analysis", "AI分析", "AI"],
    ["order", "责任路由", "规则"],
    ["review", "人工复核", "维修管理"],
    ["supplier", "供应商接单", "供应商"],
    ["repair", "维修结果", "供应商"],
    ["acceptance", "门店验收", "门店"],
    ["history", "设备履历", "系统"],
  ];
  return (
    <>
      <ChapterHeader
        number="06"
        kicker="TO-BE · FLOW TO PRODUCT"
        title="每个关键流程节点，都有真实系统页面承载"
        evidence={["合理推断", "Demo模拟验证"]}
      />
      <div className="to-be-live-layout">
        <div className="flow-linkage">
          <div className="swimlane-labels">
            {["门店", "AI", "规则系统", "维修管理", "供应商"].map((lane) => (
              <span key={lane}>{lane}</span>
            ))}
          </div>
          <div className="flow-node-track">
            {nodes.map(([id, label, role], index) => (
              <button
                type="button"
                key={id}
                className={preview === id ? "active" : ""}
                onClick={() => setPreview(id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{label}</strong>
                <small>{role}</small>
                {index < nodes.length - 1 && <ArrowRight />}
              </button>
            ))}
          </div>
          <div className="flow-paths">
            <span className="main-path">主流程：信息完整 → 自动或人工定责 → 维修 → 验收</span>
            <span className="exception-path">
              异常：待补充 / 低置信度 / 规则冲突 / 超时
            </span>
            <span className="return-path">
              返修：验收不通过 → 原工单回原责任方
            </span>
          </div>
          <div className="to-be-bottom">
            <div className="to-be-delta">
              <strong>As-Is → To-Be</strong>
              <span>多渠道转述 → 原始事实保留</span>
              <span>经验定责 → 规则编号与理由</span>
              <span>电话追问 → 状态与SLA</span>
              <span>维修完成 → 门店验收闭环</span>
            </div>
            <button
              type="button"
              className="to-be-source"
              aria-label="放大查看To-Be目标流程方向图"
              onClick={() =>
                onImage({
                  src: "/showcase/to-be-flow.png",
                  alt: "AI驱动的一体化设备维修协同To-Be目标流程方向图",
                  caption: "To-Be目标流程方向图 · 规则与组织待企业校准",
                  maskLogo: true,
                })
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/showcase/to-be-flow.png" alt="" />
              <span className="source-logo-mask">流程研究图</span>
              <i>
                <Expand />
                查看To-Be方向图
              </i>
            </button>
          </div>
        </div>
        <LiveProductFrame view={preview} compact />
      </div>
      <div className="chapter-footnote">
        To-Be 为方向版，真实组织、规则、SLA与主数据仍需企业校准。
      </div>
    </>
  );
}

function Chapter07() {
  const aiGroup = capabilityGroups.find((group) => group.tone === "ai")!;
  const ruleGroup = capabilityGroups.find((group) => group.tone === "rule")!;
  const systemGroup = capabilityGroups.find((group) => group.tone === "system")!;
  const humanGroup = capabilityGroups.find((group) => group.tone === "human")!;

  return (
    <>
      <ChapterHeader
        number="07"
        kicker="SOLUTION ARCHITECTURE"
        title="一个中枢统一事实、责任、状态与时钟，四端围绕同一工单协同"
        evidence={["已确认事实", "Demo模拟验证", "待企业验证"]}
      />
      <div className="architecture-map" aria-label="野人先生AI设备维修协同系统架构">
        <div className="architecture-main">
          <section className="architecture-access" aria-labelledby="architecture-access-title">
            <div className="architecture-section-flag">
              <span>01</span>
              <strong id="architecture-access-title">角色接入</strong>
            </div>
            <div className="architecture-role-strip">
              {roleTasks.map((item) => (
                <article key={item.role}>
                  <strong>{item.role}</strong>
                  <p>{item.tasks.map((task) => <em key={task}>{task}</em>)}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="architecture-working">
            <div className="architecture-journey" aria-label="维修协同主路径">
              {architectureJourney.map((item, index) => (
                <span key={item}>
                  {item}
                  {index < architectureJourney.length - 1 && <ArrowRight />}
                </span>
              ))}
            </div>

            <div className="architecture-working-body">
              <svg className="architecture-connectors" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <marker id="architecture-arrow-sage" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" />
                  </marker>
                  <marker id="architecture-arrow-wood" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" />
                  </marker>
                </defs>
                <path className="sage" d="M225 118 H352" markerEnd="url(#architecture-arrow-sage)" />
                <path className="sage" d="M790 118 H652" markerEnd="url(#architecture-arrow-sage)" />
                <path className="wood" d="M500 214 V268" markerEnd="url(#architecture-arrow-wood)" />
                <path className="risk" d="M810 210 C770 250 680 250 620 267" />
              </svg>

              <article className="architecture-support architecture-ai">
                <header><span>03</span><strong>{aiGroup.title}</strong></header>
                <ul>{aiGroup.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>

              <section className="architecture-hub" aria-labelledby="architecture-hub-title">
                <div className="architecture-hub-heading">
                  <span>02 · 协同主记录</span>
                  <h2 id="architecture-hub-title">AI设备维修协同中枢</h2>
                  <p>以故障事件保留原始事实，以统一维修工单承载门店、维修管理与供应商的全流程协同。</p>
                </div>
                <div className="architecture-hub-chain">
                  <div className="event">
                    <span>原始事实</span>
                    <strong>{collaborationFlow[0]}</strong>
                    <code>FaultEvent</code>
                  </div>
                  <ArrowRight />
                  <div className="order">
                    <ClipboardCheck />
                    <span>唯一协同主记录</span>
                    <strong>{collaborationFlow[1]}</strong>
                    <code>WorkOrder</code>
                  </div>
                </div>
                <div className="architecture-hub-facts">
                  {collaborationFlow.slice(2).map((item, index) => (
                    <span className={index === 3 ? "timeline" : ""} key={item}>{item}<i /></span>
                  ))}
                </div>
              </section>

              <div className="architecture-right-support">
                <article className="architecture-support architecture-rule">
                  <header><span>03A</span><strong>{ruleGroup.title}</strong></header>
                  <ul>{ruleGroup.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </article>
                <article className="architecture-support architecture-system">
                  <header><span>03B</span><strong>{systemGroup.title}</strong></header>
                  <ul>{systemGroup.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </article>
              </div>

              <article className="architecture-human">
                <header><span>03C</span><strong>{humanGroup.title}</strong></header>
                <ul>{humanGroup.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            </div>
          </div>

          <section className="architecture-data" aria-labelledby="architecture-data-title">
            <div className="architecture-section-flag">
              <span>04</span>
              <strong id="architecture-data-title">统一数据底座</strong>
            </div>
            <div className="architecture-data-network">
              <svg viewBox="0 0 1000 112" preserveAspectRatio="none" aria-hidden="true">
                <path d="M105 28 H895 M105 84 H895 M367 28 V84 M895 28 V84" />
                <path className="data-accent" d="M632 28 C632 66 760 84 895 84" />
              </svg>
              {dataLayer.map((item, index) => <span className={`data-node-${index}`} key={item}>{item}</span>)}
            </div>
          </section>
        </div>

        <aside className="architecture-value-rail" aria-labelledby="architecture-values-title">
          <header>
            <span>05</span>
            <strong id="architecture-values-title">价值输出</strong>
          </header>
          <ol>
            {architectureValues.map((item, index) => (
              <li key={item}><span>0{index + 1}</span><strong>{item}</strong></li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}

function Chapter08() {
  return (
    <>
      <ChapterHeader
        number="08"
        kicker="RESPONSIBILITY BOUNDARY"
        title="不是把AI放进每一步，而是让四种机制各负其责"
        evidence="Demo模拟验证"
      />
      <div className="boundary-layout">
        <div className="responsibility-grid">
          {responsibilityColumns.map((column) => (
            <div className={`responsibility-column ${column.key}`} key={column.key}>
              <div>
                <span>{column.title}</span>
                <strong>{column.tagline}</strong>
              </div>
              <ul>
                {column.owns.map((item) => (
                  <li key={item}>
                    <Check />
                    {item}
                  </li>
                ))}
              </ul>
              <p>
                <X />
                {column.not.join("；")}
              </p>
            </div>
          ))}
        </div>
        <MechanismCase />
        <div className="safety-boundary">
          <ShieldAlert />
          <strong>安全边界</strong>
          <span>不虚构设备、型号、供应商和保修</span>
          <span>不输出拆机、接电或制冷剂操作</span>
          <span>低置信度、高风险与规则冲突必须转人工</span>
          <span>专业维修由维修人员负责，关闭由门店验收决定</span>
        </div>
      </div>
    </>
  );
}

function Chapter09({
  onImage,
}: {
  onImage: (image: {
    src: string;
    alt: string;
    caption: string;
    maskLogo?: boolean;
  }) => void;
}) {
  const [view, setView] = useState("order");
  const [moduleId, setModuleId] = useState("routing");
  const [drawer, setDrawer] = useState(false);
  const currentModule =
    productModules.find((item) => item.id === moduleId) ?? productModules[0];
  const selectModule = (item: ProductModule) => {
    setModuleId(item.id);
    setView(item.id === "history" ? "history" : item.id);
    setDrawer(true);
  };
  return (
    <>
      <ChapterHeader
        number="09"
        kicker="LIVE PRODUCT EXPERIENCE"
        title="统一工单连接七个模块、四类决策与完整闭环"
        evidence="Demo模拟验证"
      />
      <div className="product-center">
        <aside className="product-journey">
          <span className="journey-title">端到端产品链路</span>
          {productModules.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                className={moduleId === item.id ? "active" : ""}
                onClick={() => selectModule(item)}
                key={item.id}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.value}</small>
                </div>
              </button>
            );
          })}
          <div className="journey-spine">
            <strong>唯一主记录</strong>
            <span>统一维修工单</span>
          </div>
        </aside>
        <div className="product-live-stage">
          <LiveProductFrame view={view} onViewChange={setView} />
        </div>
        <aside className={`module-detail ${drawer ? "open" : ""}`}>
          <div className="module-detail-head">
            <div>
              <span>MODULE DETAIL</span>
              <h2>{currentModule.title}</h2>
            </div>
            <button type="button" onClick={() => setDrawer(false)}>
              <X />
            </button>
          </div>
          <ModuleDetail module={currentModule} />
          <button
            type="button"
            className="screenshot-proof"
            onClick={() =>
              onImage({
                src: currentModule.screenshot,
                alt: `${currentModule.title}的真实Demo截图`,
                caption: `${currentModule.title} · 当前Demo真实截图`,
              })
            }
          >
            <Maximize2 />
            查看对应真实截图
          </button>
        </aside>
      </div>
      <div className="product-center-footer">
        <span>点击左侧模块查看角色、输入、处理、输出、异常和Demo证据</span>
        <button
          type="button"
          onClick={() =>
            onImage({
              src: "/showcase/order-timeline.png",
              alt: "真实Demo工单状态时间线截图",
              caption: "状态与责任变更时间线 · Demo模拟验证",
            })
          }
        >
          <History />
          时间线证据
        </button>
        <button
          type="button"
          onClick={() =>
            onImage({
              src: "/showcase/operations-dashboard.png",
              alt: "真实Demo运营看板截图",
              caption: "运营看板 · 当前指标均为Demo模拟数据",
            })
          }
        >
          <MonitorPlay />
          运营看板证据
        </button>
        <button type="button" onClick={() => setDrawer(true)}>
          <FileSearch />
          展开当前模块说明
        </button>
        <Link href="/demo">
          <ExternalLink />
          进入完整Demo
        </Link>
      </div>
    </>
  );
}

function ModuleDetail({ module }: { module: ProductModule }) {
  const rows = [
    ["使用角色", module.role],
    ["触发条件", module.trigger],
    ["输入", module.input.join(" · ")],
    ["系统动作", module.process.join(" → ")],
    ["业务规则", module.rules.join("；")],
    ["AI介入", module.ai],
    ["输出", module.output.join(" · ")],
    ["下一责任人", module.next],
    ["异常情况", module.exceptions.join("；")],
    ["解决断点", module.breaks.join("；")],
    ["对应Demo", module.scenario],
  ];
  return (
    <div className="module-detail-rows">
      <TagStatus status={module.status} />
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </div>
  );
}

function TagStatus({ status }: { status: ProductModule["status"] }) {
  return <span className="module-status">{status}</span>;
}

function Chapter10() {
  const {
    state,
    loadScenario,
    advance,
    previous,
    reset,
    setAutoPlaying,
    liveSlaStatus,
  } = useShowcaseSandbox();
  const current =
    scenarioDefinitions.find((item) => item.id === state.scenario) ??
    scenarioDefinitions[0];
  const order = state.order;
  return (
    <>
      <ChapterHeader
        number="10"
        kicker="INTERACTIVE VALIDATION"
        title="五条业务链路验证了机制可运行，也明确没有证明什么"
        evidence="Demo模拟验证"
      />
      <div className="validation-layout">
        <aside className="scenario-selector">
          <span>五条人工业务链路</span>
          {scenarioDefinitions.map((scenario, index) => (
            <button
              type="button"
              key={scenario.id}
              className={state.scenario === scenario.id ? "active" : ""}
              onClick={() => loadScenario(scenario.id as ScenarioId)}
            >
              <span>0{index + 1}</span>
              <strong>{scenario.title}</strong>
              <small>{scenario.mechanism}</small>
            </button>
          ))}
        </aside>
        <div className="scenario-validator">
          <div className="validator-head">
            <div>
              <span className="eyebrow">SCENARIO INPUT</span>
              <h2>{current.title}</h2>
              <p>{current.input}</p>
            </div>
            <div className="validator-controls">
              <button type="button" onClick={previous}>
                <ArrowLeft />
                上一步
              </button>
              <button type="button" onClick={() => void advance()}>
                下一步
                <ArrowRight />
              </button>
              <button
                type="button"
                className={state.autoPlaying ? "active" : ""}
                onClick={() => setAutoPlaying(!state.autoPlaying)}
              >
                {state.autoPlaying ? <Pause /> : <Play />}
                {state.autoPlaying ? "暂停" : "自动演示"}
              </button>
              <button type="button" onClick={reset}>
                <RefreshCcw />
                重置
              </button>
            </div>
          </div>
          <div className="validator-state">
            <div>
              <small>当前步骤</small>
              <strong>{state.currentStep + 1}</strong>
            </div>
            <div>
              <small>当前角色</small>
              <strong>
                {
                  { store: "门店", manager: "维修管理", supplier: "供应商", admin: "运营" }[
                    state.role
                  ]
                }
              </strong>
            </div>
            <div>
              <small>当前系统状态</small>
              <strong>{order?.status ?? (state.analysis ? "待补充" : "未提交")}</strong>
            </div>
            <div>
              <small>AI输出</small>
              <strong>
                {state.analysis
                  ? `${state.analysis.faultCategorySuggestion} · ${state.analysis.confidence}`
                  : "待运行"}
              </strong>
            </div>
            <div>
              <small>规则结果</small>
              <strong>{order?.routeTrace[0]?.split(" · ")[0] ?? "待判断"}</strong>
            </div>
            <div>
              <small>当前责任方</small>
              <strong>
                {showcasePartyName(order?.finalPartyId)}
              </strong>
            </div>
            <div>
              <small>SLA</small>
              <strong>{order ? `${order.finalPriority} · ${liveSlaStatus}` : "未开始"}</strong>
            </div>
          </div>
          <div className="validator-mechanism">
            <span>输入</span>
            <p>{current.input}</p>
            <ArrowRight />
            <span>机制</span>
            <p>{current.mechanism}</p>
            <ArrowRight />
            <span>当前结果</span>
            <p>{order ? `${order.status} · ${showcasePartyName(order.finalPartyId)}` : "等待操作"}</p>
          </div>
          <div className="validator-timeline">
            {state.timeline.length ? (
              state.timeline.slice(-5).map((event) => (
                <div key={event.id}>
                  <i />
                  <span>{event.toStatus}</span>
                  <p>{event.reason}</p>
                </div>
              ))
            ) : (
              <p>点击“下一步”或“自动演示”，状态机将记录每次合法转换。</p>
            )}
          </div>
          <div className="validator-proof">
            <div className="proves">
              <CheckCircle2 />
              <span>
                <small>证明了什么</small>
                <strong>{current.proves}</strong>
              </span>
            </div>
            <div className="not-proves">
              <ShieldAlert />
              <span>
                <small>没有证明什么</small>
                <strong>{current.notProves}</strong>
              </span>
            </div>
          </div>
        </div>
        <aside className="quality-proof">
          <span>质量验证</span>
          {[
            ["26 / 26", "自动化测试"],
            ["5 / 5", "人工业务链路"],
            ["12", "原系统演示截图"],
            ["PASS", "lint / typecheck"],
            ["PASS", "production build"],
            ["390px", "关键移动页面"],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
          <p>
            证明产品机制、状态机、权限与正常/异常链路可运行；不证明真实经营收益。
          </p>
          <Link href="/demo">
            <Play />
            进入完整Demo
          </Link>
        </aside>
      </div>
    </>
  );
}

function showcasePartyName(id: string | null | undefined) {
  return (
    {
      "party-a": "设备供应商A（模拟）",
      "party-b": "设备供应商B（模拟）",
      "party-maint": "内部维修组（模拟）",
    }[id ?? ""] ?? "待人工定责"
  );
}

function Chapter11() {
  const metricGroups = [
    ["信息质量", ["关键字段完整率", "补充信息率", "低置信度率"]],
    ["协同效率", ["一次定责成功率", "接单等待时长", "超时数量"]],
    ["闭环质量", ["闭环率", "验收一次通过率", "返修与重复故障"]],
  ];
  const stages = [
    ["01", "Demo验证", "产品机制与技术链路"],
    ["02", "小范围试点", "采集真实流程与主数据"],
    ["03", "规则校准", "责任、SLA与异常阈值"],
    ["04", "区域推广", "权限、通知与运营机制"],
    ["05", "数据扩展", "IoT与预测性维护仅作后续"],
  ];
  return (
    <>
      <ChapterHeader
        number="11"
        kicker="VALUE & ROADMAP"
        title="先建立可测量的协同事实，再讨论真实改善"
        evidence={["待企业验证", "行业参照"]}
      />
      <div className="value-layout">
        <div className="metric-system">
          <span className="section-label">价值指标体系</span>
          <h2>不预填未经验证的改善比例</h2>
          {metricGroups.map(([group, metrics], index) => (
            <div className="metric-tier" key={group as string}>
              <span>0{index + 1}</span>
              <strong>{group as string}</strong>
              <div>
                {(metrics as string[]).map((metric) => (
                  <i key={metric}>{metric}</i>
                ))}
              </div>
            </div>
          ))}
          <p>
            指标定义来自需求与研究；当前看板仅证明系统可以计算，真实基线与目标待企业数据校准。
          </p>
        </div>
        <div className="roadmap">
          <span className="section-label">未来落地路径</span>
          <div className="roadmap-line" aria-hidden="true" />
          {stages.map(([number, title, detail], index) => (
            <div className={`roadmap-stage stage-${index + 1}`} key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
          ))}
          <div className="roadmap-boundary">
            <AlertTriangle />
            <span>
              采购、备件、费用、IoT 与预测性维护不属于当前 Demo 已实现范围。
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function Chapter12() {
  const capabilities = [
    "行业研究",
    "流程诊断",
    "根因分析",
    "To-Be设计",
    "产品设计",
    "数据建模",
    "AI与规则设计",
    "Demo开发",
    "测试验证",
    "方案呈现",
  ];
  return (
    <>
      <ChapterHeader
        number="12"
        kicker="TEAM & CONCLUSION"
        title="从研究假设到可运行Demo，交付的是一条完整论证链"
        evidence={["已确认事实", "待企业验证"]}
      />
      <div className="summary-layout">
        <div className="delivery-capabilities">
          <span className="section-label">已完成交付能力</span>
          <div className="capability-ribbon">
            {capabilities.map((item, index) => (
              <div key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          <div className="team-placeholder">
            <Users />
            <div>
              <strong>团队成员、职责与过往经历：待补充</strong>
              <span>现有材料未提供姓名与履历，不在展示页中编造。</span>
            </div>
          </div>
        </div>
        <div className="final-equation">
          <span>最终结论</span>
          {[
            ["AI", "解决信息理解"],
            ["规则", "解决责任判断"],
            ["统一工单", "解决三方协同"],
            ["SLA", "解决流程停滞"],
            ["门店验收 + 设备履历", "形成维修闭环"],
          ].map(([mechanism, outcome], index) => (
            <div key={mechanism}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{mechanism}</strong>
              <ArrowRight />
              <p>{outcome}</p>
            </div>
          ))}
          <div className="summary-actions">
            <a
              href="/showcase/showcase-content-source.md"
              target="_blank"
              rel="noreferrer"
            >
              <FileSearch />
              查看完整研究来源
            </a>
            <Link href="/demo">
              <Play />
              进入系统Demo
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function ImageFigure({
  src,
  alt,
  caption,
  maskLogo = false,
  onOpen,
}: {
  src: string;
  alt: string;
  caption: string;
  maskLogo?: boolean;
  onOpen: (image: {
    src: string;
    alt: string;
    caption: string;
    maskLogo?: boolean;
  }) => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className={`image-figure ${maskLogo ? "mask-source-logo" : ""}`}>
      <button
        type="button"
        onClick={() => onOpen({ src, alt, caption, maskLogo })}
        aria-label={`放大查看：${caption}`}
      >
        {failed ? (
          <span className="image-fallback">
            <AlertTriangle />
            图片加载失败：{alt}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} onError={() => setFailed(true)} />
        )}
        {maskLogo && <span className="source-logo-mask">流程研究图</span>}
        <span className="image-zoom">
          <Expand />
          点击放大
        </span>
      </button>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function ImageLightbox({
  image,
  onClose,
}: {
  image: {
    src: string;
    alt: string;
    caption: string;
    maskLogo?: boolean;
  };
  onClose: () => void;
}) {
  return (
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.caption}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="lightbox-close" onClick={onClose}>
        <X />
        关闭
      </button>
      <figure className={image.maskLogo ? "mask-source-logo" : ""}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.alt} />
        {image.maskLogo && <span className="source-logo-mask">流程研究图</span>}
        <figcaption>{image.caption}</figcaption>
      </figure>
    </div>
  );
}

function OverviewGrid({
  current,
  onClose,
  onSelect,
}: {
  current: number;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="overview-grid" role="dialog" aria-modal="true" aria-label="章节总览">
      <div className="overview-head">
        <div>
          <span>SHOWCASE OVERVIEW</span>
          <h2>12章节总览</h2>
        </div>
        <button type="button" onClick={onClose}>
          <X />
          返回当前章节
        </button>
      </div>
      <div className="overview-items">
        {chapters.map((chapter, index) => (
          <button
            type="button"
            key={chapter.id}
            className={current === index ? "active" : ""}
            onClick={() => onSelect(index)}
          >
            <div className="overview-preview">
              <span>{chapter.number}</span>
              <small>{chapter.act}</small>
              <strong>{chapter.title}</strong>
              <i>{chapterFileNames[index]}</i>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
