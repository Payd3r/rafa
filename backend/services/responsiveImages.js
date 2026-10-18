import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

// Include encoder settings in the fingerprint: changing quality produces new URLs.
const RECIPE = "responsive-v1-avif50-webp72-320-640-960-1600";
export async function generateResponsiveImages(input, directory, urlBase) {
  const buffer = Buffer.isBuffer(input) ? input : await fs.readFile(input);
  const hash = createHash("sha256")
    .update(RECIPE)
    .update(buffer)
    .digest("hex")
    .slice(0, 20);
  const image = sharp(buffer).rotate();
  const info = await image.metadata();
  const swapped = [5, 6, 7, 8].includes(info.orientation);
  const width = swapped ? info.height : info.width;
  const height = swapped ? info.width : info.height;
  const widths = [
    ...new Set([320, 640, 960, 1600].map((size) => Math.min(size, width))),
  ];
  const variants = { avif: [], webp: [] };
  for (const size of widths) {
    for (const format of ["avif", "webp"]) {
      const name = `image-${hash}-${size}.${format}`;
      const destination = path.join(directory, name);
      const existing = await fs.stat(destination).catch(() => null);
      if (!existing?.size) {
        const pipeline = image
          .clone()
          .resize({ width: size, withoutEnlargement: true });
        const data = await (
          format === "avif"
            ? pipeline.avif({ quality: 50, effort: 2 })
            : pipeline.webp({ quality: 72, effort: 4 })
        ).toBuffer();
        const temporary = destination + ".tmp";
        await fs.writeFile(temporary, data);
        await fs.rename(temporary, destination);
      }
      variants[format].push({ src: `${urlBase}/${name}`, width: size });
    }
  }
  const placeholder = await image
    .clone()
    .resize({ width: 24, withoutEnlargement: true })
    .webp({ quality: 35 })
    .toBuffer();
  return {
    width,
    height,
    ratio: width / height,
    hash,
    variants,
    placeholder: `data:image/webp;base64,${placeholder.toString("base64")}`,
  };
}
