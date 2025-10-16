import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Processa un'immagine creando tutte le varianti necessarie
 * - original.jpg: originale convertito in JPEG
 * - original.webp: versione WebP full quality
 * - thumb.webp: thumbnail 800px max-width
 * - placeholder.webp: blur placeholder 20px
 * - meta.json: metadati (width, height, ratio, placeholder)
 */
export class ImageProcessor {
  constructor(publicPath) {
    this.publicPath = publicPath;
  }

  /**
   * Processa un'immagine e crea tutte le varianti
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

    // 1. Original JPEG (qualità alta)
    await image
      .clone()
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(path.join(outputDir, 'original.jpg'));

    // 2. Original WebP (qualità alta)
    await image
      .clone()
      .webp({ quality: 90 })
      .toFile(path.join(outputDir, 'original.webp'));

    // 3. Thumbnail WebP (max 800px width)
    const thumbWidth = Math.min(800, width);
    await image
      .clone()
      .resize(thumbWidth, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: 85 })
      .toFile(path.join(outputDir, 'thumb.webp'));

    // 4. Placeholder WebP (20px blur)
    const placeholderPath = `/optimized/${projectSlug}/${imageIndex}/placeholder.webp`;
    await image
      .clone()
      .resize(20, null, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .blur(5)
      .webp({ quality: 50 })
      .toFile(path.join(outputDir, 'placeholder.webp'));

    // 5. Meta.json
    const metaData = {
      width,
      height,
      ratio,
      placeholder: placeholderPath
    };

    await fs.writeFile(
      path.join(outputDir, 'meta.json'),
      JSON.stringify(metaData, null, 2)
    );

    return {
      width,
      height,
      ratio,
      placeholder: placeholderPath
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

