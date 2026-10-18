import fs from "node:fs/promises";
import path from "node:path";
import { generateResponsiveImages } from "../services/responsiveImages.js";
const publicPath = process.env.PUBLIC_PATH || "/usr/share/nginx/html";
const projects = JSON.parse(
  await fs.readFile(path.join(publicPath, "projects.json"), "utf8"),
);
const metadata = JSON.parse(
  await fs
    .readFile(path.join(publicPath, "imageMeta.json"), "utf8")
    .catch(() => "{}"),
);
const directories = [
  ...new Set([
    ...projects
      .flatMap((p) => [p.cover, ...p.gallery])
      .map((p) => path.dirname(p.originalUrl)),
    ...Object.keys(metadata).map((src) => path.dirname(src)),
  ]),
];
let count = 0;
for (const urlBase of directories) {
  const dir = path.join(publicPath, urlBase);
  try {
    const metadata = JSON.parse(
      await fs.readFile(path.join(dir, "meta.json"), "utf8"),
    );
    // Prefer the highest-quality source still available.
    let source;
    for (const name of [
      "original.jpg",
      "original.png",
      "original.webp",
      "original.avif",
    ]) {
      const candidate = path.join(dir, name);
      if ((await fs.stat(candidate).catch(() => null))?.size) {
        source = candidate;
        break;
      }
    }
    if (!source) throw new Error("No original source");
    const responsive = await generateResponsiveImages(source, dir, urlBase);
    await fs.writeFile(
      path.join(dir, "meta.json.tmp"),
      JSON.stringify({ ...metadata, ...responsive }, null, 2),
    );
    await fs.rename(
      path.join(dir, "meta.json.tmp"),
      path.join(dir, "meta.json"),
    );
    console.log(`${++count}/${directories.length} ${urlBase}`);
  } catch (error) {
    console.error(urlBase, error.message);
    process.exitCode = 1;
  }
}
