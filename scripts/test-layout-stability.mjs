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
for (const mobile of [false, true]) {
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (!entry.hadRecentInput) window.__cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.route("**/imageMeta.json", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  for (const project of projects) {
    await page.goto(base + "/projects/" + project.slug, {
      waitUntil: "domcontentloaded",
    });
    await page.locator(".photo").first().waitFor();
    await page.waitForTimeout(700);
    const cls = await page.evaluate(() => window.__cls);
    results.push({ route: project.slug, mobile, cls });
    assert.ok(
      cls < 0.01,
      `${project.slug} ${mobile ? "mobile" : "desktop"} CLS ${cls}`,
    );
  }
  await context.close();
}
await browser.close();
await fs.writeFile(
  "benchmarks/layout-stability.json",
  JSON.stringify(results, null, 2),
);
console.log(
  results.length,
  "delayed-metadata layout checks passed; max CLS",
  Math.max(...results.map((r) => r.cls)),
);
