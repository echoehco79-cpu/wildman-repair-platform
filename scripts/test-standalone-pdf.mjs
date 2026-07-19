import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const pdf = path.join(root, "output/pdf/野人先生_AI设备维修协同方案看板.pdf");
const tmp = path.join(root, "tmp/pdfs");
const textPath = path.join(tmp, "wildman-showcase.txt");
const python = "/Users/gaodaqiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const pdftotext = "/Users/gaodaqiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftotext";
const checks = [];

function check(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` · ${detail}` : ""}`);
}

check("PDF文件存在", fs.existsSync(pdf));
if (!fs.existsSync(pdf)) process.exit(1);

const stat = fs.statSync(pdf);
check("PDF文件非空", stat.size > 500_000, `${(stat.size / 1024 / 1024).toFixed(2)} MB`);

const info = execFileSync("pdfinfo", [pdf], { encoding: "utf8" });
const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
check("PDF包含完整扩展页面", pages >= 40, `${pages} pages`);
check("横版16:9画布", /Page size:\s+1152 x 648 pts/.test(info), info.match(/^Page size:.*$/m)?.[0] || "");

fs.mkdirSync(tmp, { recursive: true });
execFileSync(pdftotext, ["-layout", pdf, textPath]);
const text = fs.readFileSync(textPath, "utf8");

const chapters = [
  "业务背景与命题理解", "为什么设备维修是经营问题", "As-Is流程假设与研究边界", "核心协同断点",
  "根因分析", "To-Be目标流程", "整体解决方案架构", "AI、规则、系统、人工分工",
  "核心产品功能", "Demo验证结果", "价值指标与未来落地路径", "团队能力与总结"
];
for (const chapter of chapters) check(`章节存在：${chapter}`, text.includes(chapter));

const modules = ["智能报修", "AI分析", "信息补充", "责任路由", "人工复核", "统一工单", "供应商协同", "SLA异常管理", "维修结果", "门店验收", "返修", "设备履历"];
for (const module of modules) check(`产品模块展开：${module}`, text.includes(module));

const tables = ["Asset", "FaultEvent", "NotificationLog", "ResponsibilityParty", "RoutingRule", "StateEvent", "Store", "WorkOrder"];
for (const table of tables) check(`数据表展开：${table}`, text.includes(`09B · ${table}`) || text.includes(`\n${table}\n`));
check("Asset包含9台模拟设备", ["AC-001", "COLD-001", "COLD-002", "COLD-003", "GEL-001", "GEL-002", "GEL-003", "GEL-004", "POS-001"].every(code => text.includes(code)));

const scenarios = ["正常自动派单", "信息缺失", "低置信度", "P1超时", "验收返修"];
for (const scenario of scenarios) check(`验证场景展开：${scenario}`, text.includes(scenario));

check("包含PDF等效交互说明", text.includes("PDF中的功能复现") && text.includes("PDF等效操作路径"));
check("包含Demo数据边界", text.includes("Demo模拟"));

const pythonCheck = `
from pypdf import PdfReader
r=PdfReader(${JSON.stringify(pdf)})
annots=sum(len(p.get('/Annots', [])) for p in r.pages)
outline=len(r.outline)
print(f"{annots}|{outline}|{len(r.pages)}")
`;
const [annotations, outline, pyPages] = execFileSync(python, ["-c", pythonCheck], { encoding: "utf8" }).trim().split("|").map(Number);
check("PDF保留可点击页内链接", annotations >= 40, `${annotations} annotations`);
check("PDF包含书签目录", outline >= 12, `${outline} outline items`);
check("书签后页数不变", pyPages === pages, `${pyPages} pages`);

const failed = checks.filter(item => !item.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exit(1);
