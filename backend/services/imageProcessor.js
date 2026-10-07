import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Processa un'immagine creando tutte le varianti necessarie
 * - original.avif: originale in AVIF alta qualità
 * - thumb.avif: thumbnail 800px max-width (display desktop/tablet)
 * - thumb-sm.avif: thumbnail 400px max-width (display mobile)
 * - meta.json: metadati (width, height, ratio, placeholder base64 inline)
 */
export class ImageProcessor {
  constructor(publicPath) {
    this.publicPath = publicPath;
  }

  /**
   * Genera un placeholder Data URL Base64 (LQIP) da un buffer immagine
   */
  async generatePlaceholderBase64(image) {
    const placeholderBuffer = await image
      .clone()
      .resize(20, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .blur(3)
      .avif({ quality: 30, speed: 9 })
      .toBuffer();

    return `data:image/avif;base64,${placeholderBuffer.toString('base64')}`;
  }

  /**
   * Processa un'immagine e crea tutte le varianti AVIF
   */
  async processImage(imageBuffer, projectSlug, imageIndex) {
    const outputDir = path.join(this.publicPath, 'optimized', projectSlug, String(imageIndex));

    // Crea la directory se non esiste
    await fs.mkdir(outputDir, { recursive: true });

    // Ottieni metadati dell'immagine originale
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;
    const ratio = width / height;

    // 1. Original AVIF (qualità alta)
    await image
      .clone()
      .avif({ quality: 80, speed: 4 })
      .toFile(path.join(outputDir, 'original.avif'));

    // 2. Thumbnail AVIF grande (max 800px width - desktop/tablet)
    const thumbWidth = Math.min(800, width);
    await image
      .clone()
      .resize(thumbWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .avif({ quality: 75, speed: 5 })
      .toFile(path.join(outputDir, 'thumb.avif'));

    // 3. Thumbnail AVIF piccola (max 400px width - mobile)
    const thumbSmWidth = Math.min(400, width);
    await image
      .clone()
      .resize(thumbSmWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .avif({ quality: 70, speed: 6 })
      .toFile(path.join(outputDir, 'thumb-sm.avif'));

    // 4. Placeholder Base64 inline (nessuna richiesta HTTP extra!)
    const placeholderBase64 = await this.generatePlaceholderBase64(image);

    // 5. Meta.json con placeholder Base64 inline
    const metaData = {
      width,
      height,
      ratio,
      placeholder: placeholderBase64
    };

    await fs.writeFile(
      path.join(outputDir, 'meta.json'),
      JSON.stringify(metaData, null, 2)
    );

    return {
      width,
      height,
      ratio,
      placeholder: placeholderBase64
    };
  }

  /**
   * Processa tutte le immagini di un progetto
   */
  async processProjectImages(images, projectSlug) {
    const results = [];

    for (let i = 0; i < images.length; i++) {
      const imageIndex = i + 1;
      const result = await this.processImage(images[i].buffer, projectSlug, imageIndex);
      results.push(result);
    }

    return results;
  }
}
