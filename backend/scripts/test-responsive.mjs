import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { generateResponsiveImages } from "../services/responsiveImages.js";
import { FileGenerator } from "../services/fileGenerator.js";

test("responsive images have stable content hashes, accurate ratios, usable variants and preserved CMS flags", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "rafa-images-"));
  try {
    const imageDir = path.join(dir, "optimized", "test", "1");
    await fs.mkdir(imageDir, { recursive: true });
    const input = await sharp({
      create: { width: 480, height: 720, channels: 3, background: "#926455" },
    })
      .jpeg()
      .toBuffer();
    const first = await generateResponsiveImages(
      input,
      imageDir,
      "/optimized/test/1",
    );
    const second = await generateResponsiveImages(
      input,
      imageDir,
      "/optimized/test/1",
    );
    assert.equal(first.hash, second.hash);
    assert.equal(first.ratio, 2 / 3);
    assert.deepEqual(
      first.variants.avif.map((v) => v.width),
      [320, 480],
    );
    for (const variant of [...first.variants.avif, ...first.variants.webp]) {
      const meta = await sharp(path.join(dir, variant.src)).metadata();
      assert.equal(meta.width, variant.width);
      assert.ok((await fs.stat(path.join(dir, variant.src))).size > 0);
    }
    const changed = await sharp(input)
      .modulate({ brightness: 1.2 })
      .jpeg()
      .toBuffer();
    assert.notEqual(
      (await generateResponsiveImages(changed, imageDir, "/optimized/test/1"))
        .hash,
      first.hash,
    );
    const rotated = await sharp(input)
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const orientation = await generateResponsiveImages(
      rotated,
      imageDir,
      "/optimized/test/1",
    );
    assert.equal(orientation.width, 720);
    assert.equal(orientation.height, 480);
    await fs.writeFile(
      path.join(imageDir, "meta.json"),
      JSON.stringify({ ...first, isBest: true }),
    );
    const generator = new FileGenerator(dir, dir);
    await generator.regenerateProjectsFile([
      { slug: "test", title: "Test", dateISO: "2026-10-16", imageCount: 1 },
    ]);
    const projects = JSON.parse(
      await fs.readFile(path.join(dir, "projects.json")),
    );
    assert.equal(projects[0].gallery[0].width, 480);
    assert.equal(projects[0].gallery[0].ratio, 2 / 3);
    await generator.regenerateImageMetaFile();
    const metadata = JSON.parse(
      await fs.readFile(path.join(dir, "imageMeta.json")),
    );
    assert.equal(metadata["/optimized/test/1/thumb.avif"].isBest, true);
    assert.equal(
      metadata["/optimized/test/1/thumb.avif"].variants.avif.length,
      2,
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
