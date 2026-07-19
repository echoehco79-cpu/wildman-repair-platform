import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const standalone = path.join(root, "dist/野人先生_AI设备维修协同方案看板_Standalone.html");
const tmpDir = path.join(root, "tmp/pdfs");
const outputDir = path.join(root, "output/pdf");
const rawPdf = path.join(tmpDir, "wildman-showcase-raw.pdf");
const pageMapPath = path.join(tmpDir, "wildman-showcase-page-map.json");
const finalPdf = path.join(outputDir, "野人先生_AI设备维修协同方案看板.pdf");
const python = "/Users/gaodaqiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browserLaunchOptions = fs.existsSync(systemChrome) ? { headless: true, executablePath: systemChrome } : { headless: true };

if (!fs.existsSync(standalone)) {
  throw new Error(`Standalone HTML 不存在：${standalone}`);
}

fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

const browser = await chromium.launch(browserLaunchOptions);
const context = await browser.newContext({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 1,
  offline: true,
  locale: "zh-CN"
});
const page = await context.newPage();
await page.goto(pathToFileURL(standalone).href, { waitUntil: "load" });
await page.waitForSelector("#scenario-main .scenario-grid");

const sourceCss = (await page.locator("style").allTextContents()).join("\n");
const chapters = await page.evaluate(() => CHAPTERS.map(item => [...item]));
const chapterCanvas = await page.locator(".chapter-canvas").evaluateAll(nodes => nodes.map(node => node.outerHTML));
const asIsImage = await page.locator(".flow-image img").first().getAttribute("src");
const toBeImage = await page.locator(".tobe-flow-image img").first().getAttribute("src");
const modules = await page.evaluate(() => PRODUCT_MODULES.map(item => ({ ...item })));
const tobeNodes = await page.evaluate(() => TOBE_NODES.map(item => [...item]));
const mechanismCase = await page.evaluate(() => JSON.parse(JSON.stringify(MECHANISM_CASE)));
const tableData = await page.evaluate(() => JSON.parse(JSON.stringify(TABLES)));
const scenarioData = await page.evaluate(() => JSON.parse(JSON.stringify(SCENARIOS)));

async function gotoChapter(index) {
  await page.locator(`#chapter-nav [data-goto="${index}"]`).click();
  await page.waitForTimeout(30);
}

async function loadScenario(id, steps = 0) {
  await gotoChapter(9);
  await page.locator(`[data-scenario="${id}"]`).click();
  for (let i = 0; i < steps; i += 1) {
    await page.locator('[data-scenario-action="next"]').click();
  }
}

const moduleSetup = {
  report: ["normal", 0, "门店人员"],
  analysis: ["normal", 0, "门店人员"],
  supplement: ["missing", 1, "门店人员"],
  routing: ["normal", 0, "维修管理人员"],
  review: ["low", 1, "维修管理人员"],
  order: ["normal", 0, "维修管理人员"],
  supplier: ["normal", 0, "供应商A"],
  sla: ["timeout", 2, "维修管理人员"],
  repair: ["normal", 3, "供应商A"],
  acceptance: ["normal", 4, "门店人员"],
  return: ["return", 4, "供应商A"],
  history: ["return", 7, "运营管理员"]
};

const moduleSnapshots = [];
for (const module of modules) {
  const [scenario, steps, role] = moduleSetup[module.id];
  await loadScenario(scenario, steps);
  await gotoChapter(8);
  await page.locator('[data-product-tab="frontend"]').click();
  await page.locator("#role-switch").selectOption({ label: role });
  await page.locator(`[data-module="${module.id}"]`).click();
  await page.waitForTimeout(40);
  moduleSnapshots.push({
    ...module,
    system: await page.locator("#product-frame").innerHTML(),
    detail: await page.locator("#module-detail").innerHTML()
  });
}

const scenarioSnapshots = [];
for (const [id, definition] of Object.entries(scenarioData)) {
  await loadScenario(id, definition.actions.length);
  scenarioSnapshots.push({
    id,
    ...definition,
    rendered: await page.locator("#scenario-main").innerHTML()
  });
}

await browser.close();

const navHtml = chapters.map((chapter, index) =>
  `<a href="#pdf-chapter-${chapter[0]}" aria-label="跳转到第${chapter[0]}章" title="${esc(chapter[2])}">${chapter[0]}</a>`
).join("");

const moduleLinks = modules.map((module, index) =>
  `<a href="#pdf-module-${module.id}"><span>${String(index + 1).padStart(2, "0")}</span><b>${esc(module.title)}</b><small>${esc(module.role)}</small></a>`
).join("");

const tableNames = Object.keys(tableData);
const tableLinks = tableNames.map(name => `<a href="#pdf-table-${name}">${esc(name)}</a>`).join("");
const scenarioLinks = scenarioSnapshots.map((scenario, index) =>
  `<a href="#pdf-scenario-${scenario.id}"><span>${String(index + 1).padStart(2, "0")}</span><b>${esc(scenario.title)}</b><small>${esc(scenario.input)}</small></a>`
).join("");

const pages = [];
const addPage = pageData => pages.push(pageData);

addPage({
  id: "pdf-cover", label: "封面", outlineTitle: "封面", key: "cover",
  className: "pdf-cover",
  body: `<div class="cover-mark">野人先生 · AI设备维修协同方案</div><div class="cover-main"><p>比赛方案展示 · 横版PDF复刻版</p><h1>AI设备维修<br>协同中枢</h1><blockquote>AI解决信息理解；规则解决责任判断；统一工单解决三方协同；SLA解决流程停滞；门店验收和设备履历形成闭环。</blockquote><div class="cover-actions"><a href="#pdf-overview">打开章节总览</a><a href="#pdf-chapter-09">查看核心产品</a></div></div><aside class="cover-note"><b>PDF中的功能复现方式</b><span>点击目录、章节号、模块、数据表与场景进行页内跳转</span><span>流程图提供独立放大页</span><span>产品交互转为“输入 → 系统处理 → 结果 → 下一责任人”的展开页</span><span>书签栏可快速定位章节与附录</span></aside><p class="demo-disclaimer">当前材料中的门店、设备、供应商、SLA和工单数据均为Demo模拟，仅用于产品机制与技术链路验证，不代表野人先生现行制度或运营情况。</p>`
});

addPage({
  id: "pdf-overview", label: "章节总览", outlineTitle: "章节总览", key: "overview",
  className: "pdf-overview-page",
  body: `<header class="pdf-section-title"><p>DOCUMENT MAP</p><h1>章节总览</h1><span>点击任一章节进入对应页面</span></header><div class="pdf-overview-grid">${chapters.map(ch => `<a href="#pdf-chapter-${ch[0]}"><b>${ch[0]}</b><span>${esc(ch[2])}</span></a>`).join("")}</div><div class="pdf-interaction-legend"><b>PDF 等效交互</b><span>章节导航与书签 → 代替网页翻页</span><span>独立流程图页 → 代替图片灯箱</span><span>模块/表/场景专页 → 代替Tab、下拉与动态切换</span></div>`
});

for (let i = 0; i < chapters.length; i += 1) {
  const [number, slug, title] = chapters[i];
  if (["09", "10", "11", "12"].includes(number)) continue;
  const extraLink = number === "03"
    ? `<a class="pdf-jump-chip" href="#pdf-as-is-zoom">查看 As-Is 流程图放大页 ↗</a>`
    : number === "06"
      ? `<a class="pdf-jump-chip" href="#pdf-to-be-zoom">查看 To-Be 流程图放大页 ↗</a>`
      : number === "08"
        ? `<a class="pdf-jump-chip" href="#pdf-mechanism-trace">展开五段机制处理链 ↗</a>`
        : "";
  addPage({
    id: `pdf-chapter-${number}`, label: `${number} ${title}`, outlineTitle: `${number} ${title}`,
    key: `chapter-${number}`, className: `pdf-main pdf-${slug}`,
    body: `${extraLink}${chapterCanvas[i]}`
  });
  if (number === "03") {
    addPage({
      id: "pdf-as-is-zoom", label: "03A As-Is流程图放大", outlineTitle: "03A As-Is流程图放大",
      parent: "chapter-03", className: "pdf-flow-zoom",
      body: `<header class="pdf-section-title"><p>03A · AS-IS FLOW</p><h1>As-Is现状流程（假设版）</h1><span>假设版，待企业校准</span></header><figure><img src="${asIsImage}" alt="As-Is现状流程放大图"><figcaption>本页替代网页中的图片放大功能。可在PDF阅读器内继续缩放查看节点与泳道。</figcaption></figure>`
    });
  }
  if (number === "06") {
    addPage({
      id: "pdf-to-be-zoom", label: "06A To-Be流程图放大", outlineTitle: "06A To-Be流程图放大",
      parent: "chapter-06", className: "pdf-flow-zoom",
      body: `<header class="pdf-section-title"><p>06A · TO-BE FLOW</p><h1>To-Be目标流程（方向版）</h1><span>目标流程仍需企业规则校准</span></header><figure><img src="${toBeImage}" alt="To-Be目标流程放大图"><figcaption>本页替代网页中的图片灯箱；五泳道、主流程与异常路径保持原图业务含义。</figcaption></figure>`
    });
    addPage({
      id: "pdf-to-be-node-map", label: "06B 流程—产品承载索引", outlineTitle: "06B 流程—产品承载索引",
      parent: "chapter-06", className: "pdf-node-map",
      body: `<header class="pdf-section-title"><p>06B · FLOW TO PRODUCT</p><h1>每个关键流程节点，由哪个产品模块承载</h1><span>点击模块名称查看对应产品页面</span></header><div class="pdf-node-grid">${tobeNodes.map((node, index) => {
        const module = modules.find(item => item.id === node[2]);
        return `<article><span>${String(index + 1).padStart(2, "0")} · ${esc(node[0])}</span><h2>${esc(node[1])}</h2><dl><dt>系统处理</dt><dd>${esc(module.process)}</dd><dt>形成输出</dt><dd>${esc(module.output)}</dd><dt>下一责任人</dt><dd>${esc(module.next)}</dd></dl><a href="#pdf-module-${module.id}">${esc(module.title)} ↗</a></article>`;
      }).join("")}</div>`
    });
  }
  if (number === "08") {
    addPage({
      id: "pdf-mechanism-trace", label: "08A 五段机制联动", outlineTitle: "08A 五段机制联动",
      parent: "chapter-08", className: "pdf-mechanism-trace",
      body: `<header class="pdf-section-title"><p>08A · MECHANISM TRACE</p><h1>同一条报修如何经过 AI、规则、系统与人工</h1><span>固定案例：光谷店（模拟） · GEL-001</span></header><div class="pdf-mechanism-chain">${Object.entries(mechanismCase).map(([key, item], index) => `<article class="${key}"><header><span>${String(index + 1).padStart(2, "0")}</span><h2>${esc(item.title)}</h2></header><dl>${item.body.map(row => `<dt>${esc(row[0])}</dt><dd>${esc(row[1])}</dd>`).join("")}</dl></article>`).join("")}</div><div class="pdf-boundary-strip"><span>AI建议 ≠ 最终责任决定</span><span>规则判断 ≠ 维修诊断</span><span>供应商提交完成 ≠ 自动关闭</span><span>门店验收后才正式关闭</span></div>`
    });
  }
}

addPage({
  id: "pdf-chapter-09", label: "09 核心产品功能", outlineTitle: "09 核心产品功能", key: "chapter-09",
  className: "pdf-product-index",
  body: `<header class="pdf-section-title"><p>第三幕 · 方案与产品 / 09</p><h1>核心产品功能</h1><span>PDF将网页中的模块切换展开为可直接浏览的产品专页</span></header><div class="pdf-product-entry"><section><h2>09A 产品协同前台</h2><p>统一工单连接门店报修、AI分析、信息补充、责任路由、人工复核、供应商处理、SLA、验收返修与设备履历。</p><div class="pdf-module-links">${moduleLinks}</div></section><aside><h2>09B 数据后端与统一事实底座</h2><p>点击进入8张业务表；每页展开字段类型、模拟记录和“记录详情”等效视图。</p><div class="pdf-table-links">${tableLinks}</div><a class="primary-link" href="#pdf-backend-index">进入数据底座 ↗</a></aside></div>`
});

for (let i = 0; i < moduleSnapshots.length; i += 1) {
  const module = moduleSnapshots[i];
  addPage({
    id: `pdf-module-${module.id}`, label: `09A-${String(i + 1).padStart(2, "0")} ${module.title}`,
    outlineTitle: `09A-${String(i + 1).padStart(2, "0")} ${module.title}`, parent: "chapter-09",
    className: "pdf-module-page",
    body: `<header class="pdf-product-title"><div><p>09A · LIVE PRODUCT EXPERIENCE / ${String(i + 1).padStart(2, "0")}</p><h1>${esc(module.title)}</h1></div><span>${esc(module.status)}</span></header><div class="pdf-module-page-grid"><section class="pdf-module-system" aria-label="${esc(module.title)}系统页面">${module.system}</section><aside class="pdf-module-explanation">${module.detail}<div class="pdf-equivalent"><b>PDF中的功能复现</b><p>网页操作已转换为本页的固定输入、系统状态、规则结果与下一责任人。返回产品目录可切换其他模块。</p><a href="#pdf-chapter-09">返回产品目录</a></div></aside></div>`
  });
}

addPage({
  id: "pdf-backend-index", label: "09B 数据后端", outlineTitle: "09B 数据后端与统一事实底座",
  parent: "chapter-09", className: "pdf-backend-index",
  body: `<header class="pdf-section-title"><p>09B · DATA FOUNDATION</p><h1>野人先生设备维修协同数据底座</h1><span>统一保存门店、设备、责任方、故障事件、工单、规则、状态和通知记录</span></header><div class="pdf-backend-purpose"><div>${tableLinks}</div><aside><h2>数据底座如何支持维修协同</h2><p><b>设备唯一ID</b> → 关联门店、型号、模拟保修和责任方</p><p><b>故障事件</b> → 保留门店原始报修信息</p><p><b>维修工单</b> → 连接AI、规则、供应商处理与门店验收</p><p><b>状态事件</b> → 记录责任和状态变化</p><p><b>路由规则</b> → 支撑可配置、可解释的责任判断</p><p><b>通知记录</b> → 追踪提醒和异常升级</p></aside></div><p class="pdf-data-disclaimer">当前页面使用Demo模拟数据，用于展示系统数据结构与可追溯能力。</p>`
});

for (const tableName of tableNames) {
  const table = tableData[tableName];
  const columns = Object.keys(table.types);
  const fontClass = columns.length > 11 ? "very-wide" : columns.length > 8 ? "wide" : "normal";
  addPage({
    id: `pdf-table-${tableName}`, label: `09B · ${tableName}`, outlineTitle: `09B · ${tableName}`,
    parent: "chapter-09", className: `pdf-table-page ${fontClass}`,
    body: `<header class="pdf-db-title"><div><p>09B · DATA TABLE</p><h1>${esc(tableName)}</h1><span>${esc(table.description)}</span></div><div class="pdf-table-tabs">${tableLinks}</div></header><section class="pdf-field-dictionary"><h2>字段与类型</h2><div>${columns.map(column => `<span><b>${esc(column)}</b><small>${esc(table.types[column])}</small></span>`).join("")}</div></section><section class="pdf-records"><header><h2>Demo模拟记录</h2><span>${table.rows.length} records · 点击目录中的表名等效于网页表切换</span></header><table><thead><tr>${columns.map(column => `<th>${esc(column)}<small>${esc(table.types[column])}</small></th>`).join("")}</tr></thead><tbody>${table.rows.map(row => `<tr>${columns.map(column => `<td>${esc(Array.isArray(row[column]) ? row[column].join("、") : row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table></section><section class="pdf-record-detail"><h2>记录详情（网页“点击行”功能的PDF等效展开）</h2><div>${Object.entries(table.rows[0] || {}).map(([key, value]) => `<span><b>${esc(key)}</b><em>${esc(Array.isArray(value) ? value.join("、") : value)}</em></span>`).join("")}</div></section>`
  });
}

addPage({
  id: "pdf-chapter-10", label: "10 Demo验证结果", outlineTitle: "10 Demo验证结果", key: "chapter-10",
  className: "pdf-scenario-index",
  body: `<header class="pdf-section-title"><p>第四幕 · 验证、价值与团队 / 10</p><h1>Demo验证结果</h1><span>五个互动场景在PDF中展开为最终状态、时间线与后端变化</span></header><div class="pdf-scenario-links">${scenarioLinks}</div><div class="pdf-quality-proof"><b>质量验证</b><span>26/26测试通过</span><span>lint通过</span><span>typecheck通过</span><span>production build通过</span><span>5条人工业务链路通过</span><span>390px关键页面通过</span></div><p class="pdf-data-disclaimer">Demo模拟数据，仅用于产品机制和技术链路验证；不证明真实效率提升、AI准确率、成本下降、SLA改善或ROI。</p>`
});

for (let i = 0; i < scenarioSnapshots.length; i += 1) {
  const scenario = scenarioSnapshots[i];
  addPage({
    id: `pdf-scenario-${scenario.id}`, label: `10-${String(i + 1).padStart(2, "0")} ${scenario.title}`,
    outlineTitle: `10-${String(i + 1).padStart(2, "0")} ${scenario.title}`, parent: "chapter-10",
    className: "pdf-scenario-page",
    body: `<header class="pdf-product-title"><div><p>10 · SCENARIO VALIDATOR / ${String(i + 1).padStart(2, "0")}</p><h1>${esc(scenario.title)}</h1></div><span>已推进至最终验证状态</span></header><div class="pdf-scenario-action-path"><b>PDF等效操作路径</b><span>载入场景</span><i>→</i><span>按状态机推进</span><i>→</i><span>记录责任与状态</span><i>→</i><span>展示最终结果</span></div><section class="pdf-scenario-render">${scenario.rendered}</section><div class="pdf-scenario-return"><a href="#pdf-chapter-10">返回五场景目录</a><a href="#pdf-chapter-09">查看产品模块</a><a href="#pdf-backend-index">查看数据底座</a></div>`
  });
}

for (const i of [10, 11]) {
  const [number, slug, title] = chapters[i];
  addPage({
    id: `pdf-chapter-${number}`, label: `${number} ${title}`, outlineTitle: `${number} ${title}`,
    key: `chapter-${number}`, className: `pdf-main pdf-${slug}`,
    body: chapterCanvas[i]
  });
}

const totalPages = pages.length;
const renderedPages = pages.map((item, index) => {
  const pageNumber = index + 1;
  const footer = `<footer class="pdf-footer"><a href="#pdf-overview">章节总览</a><span>${esc(item.label)}</span><b>${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}</b></footer>`;
  return `<section class="pdf-page ${item.className || ""}" id="${item.id}" data-page="${pageNumber}"><nav class="pdf-chapter-nav">${navHtml}</nav><div class="pdf-page-body">${item.body}</div>${footer}</section>`;
}).join("\n");

const pdfCss = `
@page{size:16in 9in;margin:0}
*{box-sizing:border-box}
html,body{margin:0!important;width:auto!important;height:auto!important;overflow:visible!important;background:#fff!important;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif}
body{color:var(--ink)}
a{color:inherit;text-decoration:none}
.pdf-page{position:relative;width:16in;height:9in;min-height:9in;overflow:hidden;background:var(--paper);break-after:page;page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pdf-page:last-child{break-after:auto;page-break-after:auto}
.pdf-chapter-nav{position:absolute;z-index:50;inset:0 0 auto;height:34px;display:flex;align-items:center;justify-content:center;gap:4px;border-bottom:1px solid var(--line);background:#f1ebe2}
.pdf-chapter-nav a{display:grid;place-items:center;width:29px;height:22px;border:1px solid transparent;font-size:9px;font-weight:900;color:#6f675f}
.pdf-chapter-nav a:hover{border-color:var(--orange);color:var(--orange-dark)}
.pdf-page-body{position:absolute;inset:34px 0 27px;overflow:hidden}
.pdf-footer{position:absolute;z-index:50;inset:auto 0 0;height:27px;display:grid;grid-template-columns:130px 1fr 90px;align-items:center;padding:0 24px;border-top:1px solid var(--line);background:#2f2b27;color:#f7f1e8;font-size:8px}
.pdf-footer a{color:#f1aa81;font-weight:850}.pdf-footer span{text-align:center}.pdf-footer b{text-align:right;letter-spacing:.08em}
.pdf-jump-chip{position:absolute;z-index:20;top:13px;right:42px;padding:7px 10px;border:1px solid var(--orange);background:#fff8f0;color:var(--orange-dark);font-size:9px;font-weight:850}
.pdf-main .chapter-canvas{position:absolute!important;inset:0!important;width:auto!important;height:auto!important;padding:24px 36px 20px!important;overflow:hidden!important}
.pdf-main .chapter-head h1{font-size:38px!important}
.pdf-main .no-print{display:none!important}
.pdf-main .product-subpage{display:none!important}
.pdf-cover .pdf-page-body{padding:46px 70px;background:var(--paper)}
.pdf-cover .pdf-page-body:after{content:"";position:absolute;z-index:0;inset:0 0 0 65%;background:#2f2b27;clip-path:polygon(18% 0,100% 0,100% 100%,0 100%)}
.pdf-cover .pdf-page-body>*{position:relative;z-index:1}
.cover-mark{font-size:10px;font-weight:900;letter-spacing:.18em;color:var(--orange-dark)}
.cover-main{width:62%;margin-top:70px}.cover-main>p{margin:0;color:var(--muted);font-size:13px;font-weight:800}.cover-main h1{margin:13px 0 22px;font-size:76px;line-height:.98;letter-spacing:-.07em}.cover-main blockquote{font-size:18px;line-height:1.65}
.cover-actions{display:flex;gap:10px;margin-top:24px}.cover-actions a{padding:12px 18px;background:var(--orange);color:#fff;font-size:11px;font-weight:850}.cover-actions a+ a{background:transparent;border:1px solid var(--strong-line);color:var(--ink)}
.cover-note{position:absolute;right:47px;top:130px;width:26%;display:grid;gap:14px;color:#f7f1e8}.cover-note b{font-size:17px;color:#f1aa81}.cover-note span{padding-bottom:13px;border-bottom:1px solid #5d554e;font-size:10px;line-height:1.55}.demo-disclaimer{position:absolute;left:70px;bottom:24px;width:58%;color:var(--muted);font-size:8px;line-height:1.5}
.pdf-section-title{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding-bottom:12px;border-bottom:1px solid var(--line)}.pdf-section-title p,.pdf-product-title p,.pdf-db-title p{margin:0 0 5px;color:var(--orange-dark);font-size:9px;font-weight:900;letter-spacing:.15em}.pdf-section-title h1,.pdf-product-title h1,.pdf-db-title h1{margin:0;font-size:39px;line-height:1.02;letter-spacing:-.045em}.pdf-section-title>span{max-width:460px;color:var(--muted);font-size:10px;text-align:right}
.pdf-overview-page .pdf-page-body,.pdf-flow-zoom .pdf-page-body,.pdf-node-map .pdf-page-body,.pdf-mechanism-trace .pdf-page-body,.pdf-product-index .pdf-page-body,.pdf-backend-index .pdf-page-body,.pdf-scenario-index .pdf-page-body,.pdf-module-page .pdf-page-body,.pdf-table-page .pdf-page-body,.pdf-scenario-page .pdf-page-body{padding:24px 38px 20px}
.pdf-overview-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin-top:26px;border:1px solid var(--line);background:var(--line)}.pdf-overview-grid a{min-height:128px;padding:18px;background:var(--surface)}.pdf-overview-grid b{display:block;color:var(--orange);font-size:24px}.pdf-overview-grid span{display:block;margin-top:18px;font-size:15px;font-weight:850}.pdf-interaction-legend{display:flex;gap:18px;align-items:center;margin-top:18px;padding:13px 16px;border-left:4px solid var(--orange);background:#fff8f0;font-size:9px}.pdf-interaction-legend b{font-size:12px}.pdf-interaction-legend span{padding-left:14px;border-left:1px solid var(--line)}
.pdf-flow-zoom figure{height:616px;margin:16px 0 0;display:grid;grid-template-rows:1fr 30px;border:1px solid var(--line);background:#fff}.pdf-flow-zoom img{width:100%;height:100%;object-fit:contain}.pdf-flow-zoom figcaption{padding:7px 10px;border-top:1px solid var(--line);background:#f2ece3;color:var(--muted);font-size:8px}
.pdf-node-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;margin-top:14px;border:1px solid var(--line);background:var(--line)}.pdf-node-grid article{position:relative;display:grid;grid-template-columns:116px minmax(0,1fr);grid-template-rows:auto 1fr;align-items:start;min-height:77px;padding:8px 98px 7px 10px;background:var(--surface)}.pdf-node-grid article>span{align-self:center;color:var(--orange-dark);font-size:8px;font-weight:850}.pdf-node-grid h2{align-self:center;margin:0;font-size:12px}.pdf-node-grid dl{grid-column:1/-1;display:grid;grid-template-columns:65px minmax(0,1fr);gap:1px 5px;margin:5px 0 0}.pdf-node-grid dt{color:var(--muted);font-size:6px}.pdf-node-grid dd{margin:0;font-size:7px;line-height:1.25;overflow-wrap:anywhere}.pdf-node-grid a{position:absolute;right:9px;top:9px;width:80px;padding:6px 5px;border:1px solid var(--orange);color:var(--orange-dark);font-size:7px;font-weight:800;text-align:center}
.pdf-mechanism-chain{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;margin-top:18px;border:1px solid var(--line);background:var(--line)}.pdf-mechanism-chain article{min-width:0;padding:13px;background:var(--surface)}.pdf-mechanism-chain article header{display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:3px solid var(--stone)}.pdf-mechanism-chain article.ai header{border-color:var(--orange)}.pdf-mechanism-chain article.rule header{border-color:var(--sage)}.pdf-mechanism-chain article.system header{border-color:var(--blue)}.pdf-mechanism-chain article.human header{border-color:var(--wood)}.pdf-mechanism-chain header span{font-size:9px;color:var(--muted)}.pdf-mechanism-chain h2{margin:0;font-size:14px}.pdf-mechanism-chain dl{margin:10px 0 0}.pdf-mechanism-chain dt{margin-top:7px;color:var(--orange-dark);font-size:7px;font-weight:850}.pdf-mechanism-chain dd{margin:2px 0 0;font-size:8px;line-height:1.45;overflow-wrap:anywhere}.pdf-boundary-strip{display:flex;gap:1px;margin-top:14px;background:#d8aaa2;border:1px solid #d8aaa2}.pdf-boundary-strip span{flex:1;padding:11px;background:#fff3ef;color:#7d3932;font-size:9px;font-weight:800;text-align:center}
.pdf-product-entry{display:grid;grid-template-columns:1.7fr .8fr;gap:18px;margin-top:18px}.pdf-product-entry>section,.pdf-product-entry>aside{padding:18px;border:1px solid var(--line);background:var(--surface)}.pdf-product-entry h2{margin:0;font-size:18px}.pdf-product-entry p{color:var(--muted);font-size:10px;line-height:1.55}.pdf-module-links{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:14px;background:var(--line);border:1px solid var(--line)}.pdf-module-links a{min-height:75px;padding:11px;background:#fff}.pdf-module-links span{display:block;color:var(--orange);font-size:8px}.pdf-module-links b{display:block;margin:6px 0;font-size:12px}.pdf-module-links small{color:var(--muted);font-size:7px}.pdf-table-links{display:flex;flex-wrap:wrap;gap:6px;margin:16px 0}.pdf-table-links a,.pdf-table-tabs a{padding:6px 8px;border:1px solid var(--line);background:#fff;font-size:8px;font-weight:800}.primary-link{display:inline-block;margin-top:10px;padding:10px 13px;background:var(--orange);color:#fff;font-size:10px;font-weight:850}
.pdf-product-title,.pdf-db-title{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid var(--line)}.pdf-product-title h1,.pdf-db-title h1{font-size:31px}.pdf-product-title>span{padding:6px 8px;background:var(--sage-soft);color:#40553c;font-size:9px;font-weight:850}
.pdf-module-page-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:12px;height:625px;margin-top:12px}.pdf-module-system{min-width:0;overflow:hidden;border:1px solid var(--line);background:#f5f1eb}.pdf-module-system>.system-shell{min-width:0!important;min-height:0!important;height:auto!important}.pdf-module-system .system-body{min-height:540px!important}.pdf-module-system .system-main{overflow:hidden!important}.pdf-module-explanation{overflow:hidden;border:1px solid var(--line);padding:11px;background:#f4eee6}.pdf-module-explanation>h2{margin:0 0 8px;font-size:15px}.pdf-module-explanation>dl{display:grid;grid-template-columns:76px minmax(0,1fr);gap:4px 7px;margin:0}.pdf-module-explanation>dl dt{margin:0;color:var(--orange-dark);font-size:7px;font-weight:850}.pdf-module-explanation>dl dd{margin:0;font-size:7.5px;line-height:1.3;overflow-wrap:anywhere}.pdf-module-explanation>.status{display:inline-block;margin-top:7px;padding:4px 6px;background:var(--sage-soft);color:#40553c;font-size:7px;font-weight:850}.pdf-equivalent{margin-top:8px;padding:8px;border-left:3px solid var(--orange);background:#fff8f0}.pdf-equivalent b{font-size:8px}.pdf-equivalent p{margin:3px 0 5px;color:var(--muted);font-size:6.5px;line-height:1.35}.pdf-equivalent a{color:var(--orange-dark);font-size:7px;font-weight:850}
.pdf-backend-purpose{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px}.pdf-backend-purpose>div{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;border:1px solid var(--line);background:var(--line)}.pdf-backend-purpose>div a{display:flex;align-items:center;justify-content:space-between;min-height:72px;padding:14px;background:#fff;font-size:13px;font-weight:850}.pdf-backend-purpose>div a:after{content:'↗';color:var(--orange)}.pdf-backend-purpose aside{padding:17px;border-left:4px solid var(--orange);background:#fff8f0}.pdf-backend-purpose h2{margin:0 0 12px;font-size:17px}.pdf-backend-purpose p{margin:8px 0;font-size:9px}.pdf-data-disclaimer{margin-top:16px;padding:9px 12px;border:1px solid #e4c2ab;background:#fff8ef;color:#7c4b2d;font-size:8px}
.pdf-db-title{align-items:center}.pdf-db-title>div>span{display:block;color:var(--muted);font-size:8px}.pdf-table-tabs{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px;max-width:690px}.pdf-field-dictionary{margin-top:10px;padding:9px 11px;border:1px solid var(--line);background:#f4eee6}.pdf-field-dictionary h2,.pdf-records h2,.pdf-record-detail h2{margin:0;font-size:10px}.pdf-field-dictionary>div{display:grid;grid-template-columns:repeat(5,1fr);gap:4px 8px;margin-top:7px}.pdf-field-dictionary span{display:flex;gap:5px;min-width:0;font-size:7px}.pdf-field-dictionary b{overflow-wrap:anywhere}.pdf-field-dictionary small{color:var(--muted)}.pdf-records{margin-top:9px;border:1px solid var(--line);background:#fff}.pdf-records>header{display:flex;align-items:center;justify-content:space-between;padding:7px 9px;border-bottom:1px solid var(--line)}.pdf-records>header span{color:var(--muted);font-size:7px}.pdf-records table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7px}.pdf-records th,.pdf-records td{padding:5px 4px;border-right:1px solid #e4ddd6;border-bottom:1px solid #e4ddd6;text-align:left;vertical-align:top;overflow-wrap:anywhere}.pdf-records th{background:#f1ece7;color:#635b54}.pdf-records th small{display:block;color:#9a9188;font-size:5px}.pdf-table-page.wide .pdf-records table{font-size:6px}.pdf-table-page.wide .pdf-records th,.pdf-table-page.wide .pdf-records td{padding:4px 3px}.pdf-table-page.very-wide .pdf-records table{font-size:5.5px}.pdf-table-page.very-wide .pdf-records th,.pdf-table-page.very-wide .pdf-records td{padding:3px 2px}.pdf-record-detail{margin-top:9px;padding:9px 11px;border-left:3px solid var(--orange);background:#fff8f0}.pdf-record-detail>div{display:grid;grid-template-columns:repeat(4,1fr);gap:4px 10px;margin-top:7px}.pdf-record-detail span{display:grid;grid-template-columns:80px 1fr;gap:4px;font-size:6px}.pdf-record-detail b{color:var(--muted)}.pdf-record-detail em{font-style:normal;font-weight:700;overflow-wrap:anywhere}
.pdf-scenario-links{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;margin-top:25px;border:1px solid var(--line);background:var(--line)}.pdf-scenario-links a{min-height:310px;padding:19px;background:var(--surface)}.pdf-scenario-links span{color:var(--orange);font-size:24px;font-weight:900}.pdf-scenario-links b{display:block;margin:25px 0 14px;font-size:16px}.pdf-scenario-links small{display:block;color:var(--muted);font-size:9px;line-height:1.6}.pdf-quality-proof{display:flex;align-items:center;gap:15px;margin-top:18px;padding:12px 15px;background:var(--ink);color:#fff;font-size:9px}.pdf-quality-proof b{color:#f1aa81;font-size:11px}.pdf-scenario-action-path{display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 10px;border:1px solid var(--line);background:#fff}.pdf-scenario-action-path b{margin-right:auto;font-size:9px}.pdf-scenario-action-path span{padding:5px 7px;background:#f4eee6;font-size:8px;font-weight:800}.pdf-scenario-action-path i{color:var(--orange);font-style:normal}.pdf-scenario-render{height:545px;margin-top:10px;overflow:hidden;border:1px solid var(--line);padding:12px;background:#fff}.pdf-scenario-render .scenario-grid{font-size:inherit}.pdf-scenario-render .scenario-state span{font-size:7px}.pdf-scenario-render .scenario-state b{font-size:9px}.pdf-scenario-render .scenario-timeline article{font-size:8px}.pdf-scenario-render .scenario-boundary article{font-size:9px}.pdf-scenario-render .backend-change{font-size:8px}.pdf-scenario-return{display:flex;justify-content:flex-end;gap:7px;margin-top:8px}.pdf-scenario-return a{padding:6px 8px;border:1px solid var(--line);font-size:7px;font-weight:800}
`;

const pdfHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>野人先生 AI设备维修协同方案看板</title><style>${sourceCss}\n${pdfCss}</style></head><body>${renderedPages}</body></html>`;
const pdfHtmlPath = path.join(tmpDir, "wildman-showcase-pdf-source.html");
fs.writeFileSync(pdfHtmlPath, pdfHtml, "utf8");

const renderBrowser = await chromium.launch(browserLaunchOptions);
const renderContext = await renderBrowser.newContext({ viewport: { width: 1536, height: 864 }, offline: true, locale: "zh-CN" });
const renderPage = await renderContext.newPage();
const renderErrors = [];
renderPage.on("pageerror", error => renderErrors.push(`pageerror: ${error.message}`));
renderPage.on("request", request => {
  if (/^https?:/i.test(request.url())) renderErrors.push(`external request: ${request.url()}`);
});
await renderPage.goto(pathToFileURL(pdfHtmlPath).href, { waitUntil: "load" });
await renderPage.emulateMedia({ media: "print" });
await renderPage.pdf({
  path: rawPdf,
  width: "16in",
  height: "9in",
  printBackground: true,
  displayHeaderFooter: false,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
});
await renderBrowser.close();

if (renderErrors.length) {
  throw new Error(`PDF渲染检测到错误：\n${renderErrors.join("\n")}`);
}

const pageMap = pages.map((item, index) => ({
  title: item.outlineTitle || item.label,
  page: index,
  key: item.key || "",
  parent: item.parent || ""
}));
fs.writeFileSync(pageMapPath, JSON.stringify(pageMap, null, 2), "utf8");

execFileSync(python, [path.join(root, "scripts/add-pdf-bookmarks.py"), rawPdf, pageMapPath, finalPdf], { stdio: "inherit" });

const size = fs.statSync(finalPdf).size;
console.log(JSON.stringify({ output: finalPdf, pages: totalPages, bytes: size }, null, 2));
