import assert from "node:assert/strict";
import fs from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    "../frontend/node_modules/playwright/index.mjs"
);
const browser = await chromium.launch();
const results = [];
const payload = {
  name: "preview-check.jpg",
  mimeType: "image/jpeg",
  buffer: await fs.readFile(
    new URL(
      "../frontend/public/portfolio/images/andrea-about.webp",
      import.meta.url,
    ),
  ),
};
for (const mobile of [false, true]) {
  const page = await browser.newPage({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto((process.env.BENCH_URL || "http://172.19.0.10") + "/admin");
  await page.locator("#cover").setInputFiles(payload);
  await page
    .locator('img[alt="Cover preview"]')
    .evaluate((image) => image.decode());
  await page
    .locator("#images")
    .setInputFiles([payload, { ...payload, name: "preview-check-2.jpg" }]);
  await page.waitForFunction(
    () => document.querySelectorAll('img[src^="data:"]').length >= 3,
  );
  for (const image of await page.locator('img[src^="data:"]').all())
    await image.evaluate((image) => image.decode());
  results.push({
    mobile,
    previews: await page.locator('img[src^="data:"]').count(),
    errors,
  });
  assert.equal(errors.length, 0);
  await page.close();
}
await browser.close();
await fs.writeFile(
  "benchmarks/admin-previews.json",
  JSON.stringify(results, null, 2),
);
console.log(results);
