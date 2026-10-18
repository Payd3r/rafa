import fs from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    "../frontend/node_modules/playwright/index.mjs"
);
const base = process.env.BENCH_URL || "http://172.19.0.10";
const label = process.argv[2] || "before";
const projects = await fetch(`${base}/projects.json`).then((r) => r.json());
const routes = [
  "/",
  "/projects",
  "/gallery",
  ...projects.map((p) => `/projects/${p.slug}`),
  "/admin",
];
const browser = await chromium.launch({ headless: true });
const resultPath = `benchmarks/${label}.json`;
const previous = await fs
  .readFile(resultPath, "utf8")
  .then(JSON.parse)
  .catch(() => ({ results: [] }));
const results = previous.results;

async function measureRoute(profile, route) {
  const context = await browser.newContext({
    viewport:
      profile === "desktop"
        ? { width: 1440, height: 900 }
        : { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  if (profile === "mobile-slow")
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 300,
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (200 * 1024) / 8,
    });
  await page.addInitScript(() => {
    window.__metrics = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__metrics.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.__metrics.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await cdp.send("Network.clearBrowserCache");
  for (const cache of ["cold", "warm"]) {
    if (
      results.some(
        (r) => r.profile === profile && r.route === route && r.cache === cache,
      )
    )
      continue;
    const failures = [];
    const listener = (r) => {
      if (r.status() >= 400)
        failures.push({ url: r.url(), status: r.status() });
    };
    page.on("response", listener);
    await page.goto(base + route, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
    await page.waitForTimeout(profile === "desktop" ? 2000 : 8000);
    const initial = await page.evaluate(() => ({
      ...window.__metrics,
      images: [...document.images].map((i) => ({
        src: i.currentSrc,
        loaded: i.complete && i.naturalWidth > 0,
        visible:
          i.getBoundingClientRect().top < innerHeight &&
          i.getBoundingClientRect().bottom > 0,
      })),
      resources: performance
        .getEntriesByType("resource")
        .map((r) => ({
          url: r.name,
          bytes: r.transferSize,
          encoded: r.encodedBodySize,
          type: r.initiatorType,
        })),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    // Sample every photograph position by scrolling the complete document.
    for (let step = 0; step < 80; step++) {
      const done = await page.evaluate(() => {
        window.scrollBy({ top: innerHeight * 0.8, behavior: "instant" });
        return (
          scrollY + innerHeight >= document.documentElement.scrollHeight - 5
        );
      });
      await page.waitForTimeout(profile === "desktop" ? 50 : 100);
      if (done) break;
    }
    await page.waitForTimeout(profile === "desktop" ? 1000 : 3000);
    const scan = await page.evaluate(() => ({
      totalImages: document.images.length,
      broken: [...document.images]
        .filter((i) => i.complete && !i.naturalWidth)
        .map((i) => i.currentSrc),
      pending: [...document.images].filter((i) => !i.complete).length,
    }));
    let viewer = null;
    const button = page
      .locator(".photo-button,.hero-shot,button.project-button")
      .first();
    if (await button.count()) {
      await button.click();
      await page.waitForTimeout(profile === "desktop" ? 500 : 1500);
      await page.keyboard.press("ArrowRight");
      viewer = await page
        .locator("dialog")
        .evaluate((d) => ({
          open: d.open,
          counter: d.querySelector(".counter")?.textContent,
        }));
      await page.keyboard.press("Escape");
    }
    results.push({ profile, route, cache, initial, scan, viewer, failures });
    await fs.writeFile(resultPath, JSON.stringify({ base, results }, null, 2));
    page.off("response", listener);
    console.log(
      label,
      profile,
      route,
      cache,
      "LCP",
      Math.round(initial.lcp),
      "bytes",
      initial.resources.reduce((s, r) => s + r.bytes, 0),
      "broken",
      scan.broken.length,
    );
  }
  await context.close();
}
const queue = ["desktop", "mobile-slow"]
  .flatMap((profile) => routes.map((route) => ({ profile, route })))
  .filter(
    ({ profile, route }) =>
      !["cold", "warm"].every((cache) =>
        results.some(
          (r) =>
            r.profile === profile && r.route === route && r.cache === cache,
        ),
      ),
  );
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await measureRoute(item.profile, item.route);
    }
  }),
);
await browser.close();
await fs.writeFile(
  `benchmarks/${label}.json`,
  JSON.stringify(
    {
      date: new Date().toISOString(),
      base,
      network: { mobile: "500 kbit/s down, 200 kbit/s up, 300 ms RTT" },
      results,
    },
    null,
    2,
  ),
);
