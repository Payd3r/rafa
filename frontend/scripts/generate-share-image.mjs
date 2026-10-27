import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../public/', import.meta.url));
const source = root + 'portfolio/images/image-67ff42a6dff42f5817fe-960.avif';
const size = 1200;
// Keep the entire portrait. Extend its colors behind it to fill a square preview.
const background = await sharp(source).resize(size, size, {fit:'cover'}).blur(70).png().toBuffer();
const portrait = await sharp(source).resize(size, size, {fit:'inside'}).png().toBuffer();
await sharp(background).composite([{input:portrait,gravity:'centre'}]).jpeg({quality:90,mozjpeg:true}).toFile(root + 'portfolio/images/share-andrea-farao-square.jpg');
