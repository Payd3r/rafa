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
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/projects",
    "/gallery",
    ...projects.map((p) => "/projects/" + p.slug),
  ]) {
    await page.goto(base + route);
    await page.locator(".project-button,.photo-button").first().waitFor();
    await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
    const images = page.locator(".smart-image");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      await images.nth(i).scrollIntoViewIfNeeded();
      await images.nth(i).locator("img").waitFor();
      await images
        .nth(i)
        .locator("img")
        .evaluate((image) => image.decode());
    }
    const buttons = page.locator(
      ".hero-shot,.photo-button,button.project-button",
    );
    for (let i = 0; i < (await buttons.count()); i++) {
      await buttons.nth(i).click();
      await page
        .locator("dialog[open] img")
        .evaluate((image) => image.decode());
      await page.keyboard.press("ArrowRight");
      await page
        .locator("dialog[open] img")
        .evaluate((image) => image.decode());
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("dialog").evaluate((d) => d.open), false);
    }
    if (route === "/" || route === "/projects") {
      for (const filter of ["Film", "Photography", "All"])
        await page.getByRole("button", { name: filter, exact: true }).click();
      assert.equal(
        await page
          .locator('a[href="mailto:insidefaraostudio@gmail.com"]')
          .count(),
        1,
      );
      assert.equal(
        await page.locator('a[href="https://wa.me/393492152369"]').count(),
        1,
      );
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    results.push({
      route,
      mobile,
      positions: count,
      viewers: await buttons.count(),
      errors: [...errors],
    });
    await fs.writeFile(
      "benchmarks/audit.json",
      JSON.stringify(results, null, 2),
    );
    console.log(
      route,
      mobile ? "mobile" : "desktop",
      count,
      "positions checked",
    );
  }
  await page.goto(base + "/admin");
  await page.getByRole("button", { name: /Migliori Foto/i }).click();
  await page.locator(".smart-image").first().waitFor();
  const adminImages = page.locator(".smart-image");
  for (let i = 0; i < (await adminImages.count()); i++) {
    await adminImages.nth(i).scrollIntoViewIfNeeded();
    await adminImages.nth(i).locator("img").waitFor();
    await adminImages
      .nth(i)
      .locator("img")
      .evaluate((image) => image.decode());
  }
  results.push({
    route: "/admin#best",
    mobile,
    positions: await adminImages.count(),
    errors: [...errors],
  });
  await context.close();
}
await browser.close();
await fs.writeFile("benchmarks/audit.json", JSON.stringify(results, null, 2));
assert.ok(results.every((result) => !result.errors.length));
