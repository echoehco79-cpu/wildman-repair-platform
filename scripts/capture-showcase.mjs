import { chromium } from "playwright";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const baseUrl = process.env.SHOWCASE_URL ?? "http://localhost:3000/showcase";
const outputDir = path.resolve("screenshots/showcase");

const chapters = [
  ["business-context", "01-business-context.png"],
  ["business-impact", "02-business-impact.png"],
  ["as-is-boundary", "03-as-is-boundary.png"],
  ["breakpoints", "04-breakpoints.png"],
  ["root-causes", "05-root-causes.png"],
  ["to-be", "06-to-be.png"],
  ["solution-architecture", "07-solution-architecture.png"],
  ["responsibility-boundary", "08-responsibility-boundary.png"],
  ["product-features", "09-product-features.png"],
  ["demo-validation", "10-demo-validation.png"],
  ["value-roadmap", "11-value-roadmap.png"],
  ["team-summary", "12-team-summary.png"],
];

await fs.mkdir(outputDir, { recursive: true });

const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(systemChrome) ? { executablePath: systemChrome } : {}),
});
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
const page = await desktop.newPage();

for (const [chapter, file] of chapters) {
  await page.goto(`${baseUrl}#${chapter}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(650);
  await page.screenshot({ path: path.join(outputDir, file) });
}

await page.goto(`${baseUrl}#business-context`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "总览", exact: true }).click();
await page.waitForTimeout(250);
await page.screenshot({ path: path.join(outputDir, "overview.png") });

const reviewViewports = [
  ["1920x1080", 1920, 1080, "solution-architecture"],
  ["1366x768", 1366, 768, "product-features"],
  ["1024x768", 1024, 768, "demo-validation"],
  ["390x844", 390, 844, "product-features"],
];

for (const [label, width, height, chapter] of reviewViewports) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    colorScheme: "light",
  });
  const reviewPage = await context.newPage();
  await reviewPage.goto(`${baseUrl}#${chapter}`, { waitUntil: "networkidle" });
  await reviewPage.waitForTimeout(700);
  await reviewPage.screenshot({
    path: path.join(outputDir, `viewport-${label}.png`),
    fullPage: label === "390x844",
  });
  await context.close();
}

await desktop.close();
await browser.close();

console.log(
  `Showcase screenshots: ${chapters.length + 1} required + ${reviewViewports.length} viewport review files → ${outputDir}`,
);
