import assert from "node:assert/strict";
import fs from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    "../frontend/node_modules/playwright/index.mjs"
);
const base = process.env.BENCH_URL || "http://172.19.0.10";
const browser = await chromium.launch();
const results = [];
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
await context.addInitScript(() => {
  const connection = new EventTarget();
  Object.assign(connection, {
    saveData: true,
    effectiveType: "2g",
    downlink: 0.3,
  });
  Object.defineProperty(navigator, "connection", { value: connection });
});
const page = await context.newPage();
const requests = [];
page.on("request", (r) => requests.push(r.url()));
await page.goto(base);
await page.locator(".hero-shot .smart-image img").first().waitFor();
await page.waitForTimeout(500);
assert.ok(requests.some((url) => /image-.*-\d+\.(avif|webp)/.test(url)));
assert.ok(
  requests
    .filter((url) => /image-.*-\d+\.(avif|webp)/.test(url))
    .every((url) => Number(url.match(/-(\d+)\.(avif|webp)/)[1]) <= 640),
);
assert.ok(!requests.some((url) => /original\.(avif|jpg|webp)/.test(url)));
results.push("Save-Data: variants <=640px; no original downloads");
await context.close();
const slow = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const p = await slow.newPage();
let release;
const gate = new Promise((resolve) => (release = resolve));
await p.route("**/optimized/**", async (route) => {
  if (/\.(avif|webp)$/.test(route.request().url())) await gate;
  await route.continue();
});
const projects = await fetch(base + "/projects.json").then((r) => r.json());
await p.goto(base + "/projects/" + projects[0].slug, {
  waitUntil: "domcontentloaded",
});
const image = p.locator(".photo .smart-image").first();
await image.waitFor();
await image.scrollIntoViewIfNeeded();
const before = await image.boundingBox();
assert.ok(before.height > 100);
assert.equal(await image.locator(".image-skeleton").count(), 1);
release();
await image.locator("img").evaluate((i) => i.decode());
await p.waitForTimeout(350);
const after = await image.boundingBox();
assert.ok(Math.abs(before.height - after.height) < 1);
results.push(
  `Precise skeleton: ${Math.round(before.width)}×${Math.round(before.height)}; no size change after decode`,
);
await slow.close();
const failing = await browser.newContext();
const f = await failing.newPage();
let failures = true;
await f.route("**/optimized/**", async (route) => {
  if (failures && /\.(avif|webp)$/.test(route.request().url()))
    await route.abort();
  else await route.continue();
});
await f.goto(base);
const retry = f.locator(".hero-shot .image-retry").first();
await retry.waitFor();
failures = false;
await retry.click();
await f.locator(".hero-shot .is-loaded").first().waitFor();
assert.equal(await f.locator("dialog").evaluate((d) => d.open), false);
results.push(
  "Request failure: alternatives exhausted, retry works without opening lightbox",
);
await failing.setOffline(true);
await f
  .locator(".project-button")
  .first()
  .click({ position: { x: 5, y: 5 } });
await f.locator(".photo .smart-image").first().scrollIntoViewIfNeeded();
await f.locator(".photo .is-failed").first().waitFor();
await failing.setOffline(false);
await f.locator(".photo .is-loaded").first().waitFor();
results.push(
  "Offline to online: failed project photographs recover automatically",
);
await failing.close();
await browser.close();
await fs.writeFile(
  "benchmarks/network-tests.json",
  JSON.stringify(results, null, 2),
);
console.log(results.join("\n"));
