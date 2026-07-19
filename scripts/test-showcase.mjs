import { chromium } from "playwright";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

const baseURL = process.env.BASE_URL || "http://localhost:3000";
const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(systemChrome) ? { executablePath: systemChrome } : {}),
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.goto(`${baseURL}/showcase#business-context`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(700);

const dbBefore = await page.evaluate(async () => {
  const data = await fetch("/api/bootstrap", { cache: "no-store" }).then((r) =>
    r.json(),
  );
  return data.orders.map((order) => ({
    id: order.id,
    status: order.status,
    updatedAt: order.updatedAt,
  }));
});

assert.equal(await page.locator("[data-chapter-index]").count(), 12);
assert.equal(await page.locator(".chapter-nav button").count(), 12);
assert.equal(await page.getByRole("link", { name: /进入系统Demo/ }).first().getAttribute("href"), "/demo");

await page.getByRole("button", { name: "总览", exact: true }).click();
assert.equal(await page.locator(".overview-items > button").count(), 12);
await page.getByRole("button", { name: /返回当前章节/ }).click();

await page.getByRole("button", { name: "第03章 As-Is流程假设与研究边界" }).click();
await page.waitForURL(/#as-is-boundary$/, { timeout: 3_000 });
assert.match(page.url(), /#as-is-boundary$/);
await page.getByRole("button", { name: /放大查看：AS-IS/ }).click();
assert.equal(await page.locator(".image-lightbox").count(), 1);
await page.keyboard.press("Escape");
assert.equal(await page.locator(".image-lightbox").count(), 0);
await page.keyboard.press("ArrowRight");
await page.waitForURL(/#breakpoints$/, { timeout: 3_000 });
assert.match(page.url(), /#breakpoints$/);

await page.goto(`${baseURL}/showcase#demo-validation`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(700);
const validator = page.locator(".scenario-validator");
const next = validator.getByRole("button", { name: "下一步", exact: true });
const status = () =>
  validator.locator(".validator-state > div").nth(2).locator("strong").innerText();

// Normal: preloaded order → accept → start → complete → approve.
for (let index = 0; index < 4; index += 1) await next.click();
assert.equal(await status(), "已关闭");

// Missing: submit blocks formal order, supplement creates R009 order.
await page.getByRole("button", { name: /02 信息缺失/ }).click();
await next.click();
assert.equal(await status(), "待补充");
await next.click();
assert.equal(await status(), "待接单");
assert.match(
  await validator.locator(".validator-state > div").nth(4).locator("strong").innerText(),
  /R009/,
);

// Low confidence: frozen seed enters manual review, then dispatches with reason.
await page.getByRole("button", { name: /03 低置信度/ }).click();
await next.click();
assert.equal(await status(), "待人工确认");
await next.click();
assert.equal(await status(), "待接单");

// Timeout: create → almost timeout → timeout → redispatch.
await page.getByRole("button", { name: /04 P1超时/ }).click();
await next.click();
await next.click();
assert.match(
  await validator.locator(".validator-state > div").nth(6).locator("strong").innerText(),
  /即将超时/,
);
await next.click();
assert.equal(await status(), "超时未接单");
await next.click();
assert.equal(await status(), "待接单");

// Return: same work order proceeds through return and second acceptance.
await page.getByRole("button", { name: /05 验收返修/ }).click();
const returnStates = [];
for (let index = 0; index < 8; index += 1) {
  await next.click();
  returnStates.push(await status());
}
assert.deepEqual(returnStates, [
  "待接单",
  "处理中",
  "处理中",
  "待验收",
  "返修中",
  "处理中",
  "待验收",
  "已关闭",
]);

const dbAfter = await page.evaluate(async () => {
  const data = await fetch("/api/bootstrap", { cache: "no-store" }).then((r) =>
    r.json(),
  );
  return data.orders.map((order) => ({
    id: order.id,
    status: order.status,
    updatedAt: order.updatedAt,
  }));
});
assert.deepEqual(dbAfter, dbBefore, "Showcase sandbox must not mutate Demo SQLite data");

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});
const mobilePage = await mobile.newPage();
await mobilePage.goto(`${baseURL}/showcase#product-features`, {
  waitUntil: "networkidle",
});
await mobilePage.waitForTimeout(700);
const viewportOverflow = await mobilePage.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth,
);
assert.ok(viewportOverflow <= 1, `mobile viewport overflow: ${viewportOverflow}px`);
assert.equal(await mobilePage.locator("[data-chapter-index]").count(), 12);

await page.emulateMedia({ media: "print" });
assert.equal(await page.locator("[data-chapter-index]").count(), 12);
assert.equal(await page.locator(".showcase-topbar").evaluate((el) => getComputedStyle(el).display), "none");

await mobile.close();
await context.close();
await browser.close();

console.log("Showcase interaction checks: 20/20 passed");
