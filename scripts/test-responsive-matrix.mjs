import fs from "node:fs/promises";
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    "../frontend/node_modules/playwright/index.mjs"
);
const base = process.env.BENCH_URL || "http://172.19.0.10";
const projects = await fetch(base + "/projects.json").then((r) => r.json());
const browser = await chromium.launch();
const results = [];
for (const { width, dpr } of [
  { width: 320, dpr: 2 },
  { width: 390, dpr: 3 },
  { width: 768, dpr: 2 },
  { width: 1440, dpr: 1 },
]) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: dpr,
  });
  const page = await context.newPage();
  for (const route of [
    "/",
    "/projects",
    "/gallery",
    ...projects.map((p) => "/projects/" + p.slug),
  ]) {
    await page.goto(base + route, { waitUntil: "domcontentloaded" });
    const image = page
      .locator(
        ".hero-shot:nth-child(3) .smart-image,.photo .smart-image,.project .smart-image",
      )
      .first();
    await image.waitFor();
    await image.scrollIntoViewIfNeeded();
    await image.locator("img").waitFor();
    await image.locator("img").evaluate((i) => i.decode());
    const check = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      failed: document.querySelectorAll(".is-failed").length,
    }));
    assert.equal(check.overflow, false, `${width} ${route}`);
    assert.equal(check.failed, 0);
    results.push({ width, dpr, route, ...check });
    console.log(width, dpr, route);
    await fs.writeFile(
      "benchmarks/responsive-matrix.json",
      JSON.stringify(results, null, 2),
    );
  }
  await context.close();
}
await browser.close();
await fs.writeFile(
  "benchmarks/responsive-matrix.json",
  JSON.stringify(results, null, 2),
);
console.log(results.length, "viewport/DPR/page checks passed");
