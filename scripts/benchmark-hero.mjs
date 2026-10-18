import fs from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    "../frontend/node_modules/playwright/index.mjs"
);
const base = process.env.BENCH_URL || "http://172.19.0.10";
const label = process.argv[2] || "before";
const browser = await chromium.launch();
const results = [];
for (let run = 0; run < 3; run++) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 300,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (200 * 1024) / 8,
  });
  for (const cache of ["cold", "warm"]) {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => {
        const image = document.querySelector(".hero-shot:nth-child(3) img");
        return image?.complete && image.naturalWidth > 0;
      },
      {},
      { timeout: 90000 },
    );
    const result = await page.evaluate(() => {
      const image = document.querySelector(".hero-shot:nth-child(3) img");
      const resource = performance.getEntriesByName(image.currentSrc).at(-1);
      return {
        readyMs: resource?.responseEnd ?? performance.now(),
        source: image.currentSrc,
        bytes: performance
          .getEntriesByType("resource")
          .reduce((s, r) => s + r.transferSize, 0),
      };
    });
    results.push({ run, cache, ...result });
    console.log(label, run, cache, Math.round(result.readyMs), result.bytes);
    await fs.writeFile(
      `benchmarks/hero-${label}.json`,
      JSON.stringify(results, null, 2),
    );
  }
  await context.close();
}
await browser.close();
