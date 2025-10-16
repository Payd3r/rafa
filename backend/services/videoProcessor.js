import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Servizio per processare video usando ffmpeg
 */
export class VideoProcessor {
  constructor(publicPath) {
    this.publicPath = publicPath;
  }

  /**
   * Processa un video: salva originale, crea versione ottimizzata e estrae thumbnail
   * @param {Buffer} buffer - Buffer del file video
   * @param {string} slug - Slug del progetto
   * @returns {Promise<void>}
   */
  async processVideo(buffer, slug) {
    const videoDir = path.join(this.publicPath, 'optimized', slug, 'video');
    
    // Crea directory se non esiste
    await fs.mkdir(videoDir, { recursive: true });

    // Percorsi dei file
    const originalPath = path.join(videoDir, 'original.mp4');
    const optimizedPath = path.join(videoDir, 'optimized.mp4');
    const thumbnailPath = path.join(videoDir, 'thumb.jpg');

    try {
      // 1. Salva il video originale
      await fs.writeFile(originalPath, buffer);
      console.log(`Video originale salvato: ${originalPath}`);

      // 2. Crea versione ottimizzata con ffmpeg
      // - Codec H.264 per compatibilità
      // - Bitrate 2.5 Mbps (buon compromesso qualità/dimensione)
      // - Risoluzione max 1920x1080
      // - Audio AAC 128kbps
      const ffmpegOptimize = `ffmpeg -i "${originalPath}" \
        -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
        -c:v libx264 \
        -b:v 2500k \
        -maxrate 3000k \
        -bufsize 5000k \
        -preset medium \
        -c:a aac \
        -b:a 128k \
        -movflags +faststart \
        -y "${optimizedPath}"`;

      console.log('Inizio ottimizzazione video...');
      await execPromise(ffmpegOptimize);
      console.log(`Video ottimizzato creato: ${optimizedPath}`);

      // 3. Estrai thumbnail (primo frame a 1 secondo)
      const ffmpegThumb = `ffmpeg -i "${optimizedPath}" \
        -ss 00:00:01 \
        -vframes 1 \
        -vf "scale=800:-1" \
        -q:v 2 \
        -y "${thumbnailPath}"`;

      console.log('Estrazione thumbnail...');
      await execPromise(ffmpegThumb);
      console.log(`Thumbnail estratto: ${thumbnailPath}`);

      console.log(`✓ Video processato con successo per ${slug}`);
    } catch (error) {
      console.error(`Errore durante il processing del video per ${slug}:`, error);
      
      // Cleanup in caso di errore
      try {
        await fs.unlink(originalPath).catch(() => {});
        await fs.unlink(optimizedPath).catch(() => {});
        await fs.unlink(thumbnailPath).catch(() => {});
      } catch (cleanupError) {
        console.error('Errore durante il cleanup:', cleanupError);
      }
      
      throw error;
    }
  }

  /**
   * Verifica se ffmpeg è installato
   * @returns {Promise<boolean>}
   */
  async checkFFmpeg() {
    try {
      await execPromise('ffmpeg -version');
      return true;
    } catch (error) {
      console.error('FFmpeg non è installato o non è nel PATH');
      return false;
    }
  }
}

