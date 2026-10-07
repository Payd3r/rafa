#!/usr/bin/env node
/**
 * migrate-to-avif.js
 *
 * Script di migrazione per convertire tutte le immagini nella cartella /optimized/
 * da WebP/JPEG al nuovo formato AVIF, aggiornare i meta.json con il placeholder Base64,
 * e rrigenerare imageMeta.json e projects.json.
 *
 * UTILIZZO (da eseguire all'interno del container backend):
 *   docker exec -it sito-rafa-backend node /app/scripts/migrate-to-avif.js
 *
 * Oppure localmente (se hai Node.js e le dipendenze installate):
 *   cd backend
 *   node scripts/migrate-to-avif.js
 *
 * OPZIONI:
 *   --dry-run    Solo simula senza scrivere file
 *   --force      Ri-converte anche le immagini già in AVIF
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDryRun = process.argv.includes('--dry-run');
const isForce = process.argv.includes('--force');

// Path del volume condiviso (uguale a quello usato dal backend in produzione)
const isDev = process.env.NODE_ENV !== 'production';
const PUBLIC_PATH = process.env.PUBLIC_PATH || (isDev
  ? path.join(__dirname, '../../frontend/public')
  : '/usr/share/nginx/html');

const OPTIMIZED_PATH = path.join(PUBLIC_PATH, 'optimized');

console.log(`
╔══════════════════════════════════════════════════════╗
║   Migrazione WebP → AVIF                             ║
║   Cartella: ${OPTIMIZED_PATH.padEnd(40)}║
║   Modalità: ${isDryRun ? 'DRY-RUN (nessuna modifica)'.padEnd(39) : isForce ? 'FORCE (riconverte tutto)'.padEnd(39) : 'INCREMENTAL (salta già AVIF)'.padEnd(39)}║
╚══════════════════════════════════════════════════════╝
`);

// Statistiche
let projectsProcessed = 0;
let imagesProcessed = 0;
let imagesSkipped = 0;
let errors = 0;

/**
 * Genera un placeholder Data URL Base64 (LQIP)
 */
async function generatePlaceholderBase64(image) {
  const placeholderBuffer = await image
    .clone()
    .resize(20, null, { fit: 'inside', withoutEnlargement: true })
    .blur(3)
    .avif({ quality: 30, speed: 9 })
    .toBuffer();

  return `data:image/avif;base64,${placeholderBuffer.toString('base64')}`;
}

/**
 * Converte una singola cartella immagine (es: optimized/my-project/1/)
 */
async function convertImageDir(imageDir, projectSlug, imageIndex) {
  console.log(`  [${projectSlug}/${imageIndex}] Processing...`);

  // Controlla se già convertita (thumb.avif esiste) e non in modalità force
  const thumbAvifPath = path.join(imageDir, 'thumb.avif');
  const thumbSmAvifPath = path.join(imageDir, 'thumb-sm.avif');
  const originalAvifPath = path.join(imageDir, 'original.avif');

  try {
    await fs.access(thumbAvifPath);
    if (!isForce) {
      console.log(`  [${projectSlug}/${imageIndex}] ✓ Già in AVIF, skip (usa --force per riconvertire)`);
      imagesSkipped++;
      return;
    }
  } catch {
    // File non esiste, procedi con la conversione
  }

  // Trova l'immagine sorgente (preferisce original.jpg, poi original.webp)
  let sourceBuffer = null;
  let sourceName = '';

  const candidates = ['original.jpg', 'original.webp', 'thumb.webp'];
  for (const candidate of candidates) {
    const candidatePath = path.join(imageDir, candidate);
    try {
      await fs.access(candidatePath);
      sourceBuffer = await fs.readFile(candidatePath);
      sourceName = candidate;
      break;
    } catch {
      // Non esiste, prova il prossimo
    }
  }

  if (!sourceBuffer) {
    console.error(`  [${projectSlug}/${imageIndex}] ✗ Nessuna immagine sorgente trovata`);
    errors++;
    return;
  }

  console.log(`  [${projectSlug}/${imageIndex}] Sorgente: ${sourceName}`);

  try {
    const image = sharp(sourceBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;
    const ratio = width / height;

    if (!isDryRun) {
      // 1. Original AVIF
      await image.clone().avif({ quality: 80, speed: 4 }).toFile(originalAvifPath);
      console.log(`  [${projectSlug}/${imageIndex}] ✓ original.avif`);

      // 2. Thumb grande (800px)
      const thumbWidth = Math.min(800, width);
      await image.clone()
        .resize(thumbWidth, null, { withoutEnlargement: true, fit: 'inside' })
        .avif({ quality: 75, speed: 5 })
        .toFile(thumbAvifPath);
      console.log(`  [${projectSlug}/${imageIndex}] ✓ thumb.avif (${thumbWidth}px)`);

      // 3. Thumb piccola (400px)
      const thumbSmWidth = Math.min(400, width);
      await image.clone()
        .resize(thumbSmWidth, null, { withoutEnlargement: true, fit: 'inside' })
        .avif({ quality: 70, speed: 6 })
        .toFile(thumbSmAvifPath);
      console.log(`  [${projectSlug}/${imageIndex}] ✓ thumb-sm.avif (${thumbSmWidth}px)`);

      // 4. Placeholder Base64
      const placeholderBase64 = await generatePlaceholderBase64(image);

      // 5. Aggiorna meta.json leggendo quello esistente e preservando isBest
      const metaPath = path.join(imageDir, 'meta.json');
      let existingMeta = {};
      try {
        const existingContent = await fs.readFile(metaPath, 'utf-8');
        existingMeta = JSON.parse(existingContent);
      } catch {
        // meta.json non esiste, partiamo da zero
      }

      const updatedMeta = {
        ...existingMeta,
        width,
        height,
        ratio,
        placeholder: placeholderBase64
      };

      await fs.writeFile(metaPath, JSON.stringify(updatedMeta, null, 2));
      console.log(`  [${projectSlug}/${imageIndex}] ✓ meta.json aggiornato (Base64 placeholder, ${placeholderBase64.length} chars)`);
    } else {
      console.log(`  [${projectSlug}/${imageIndex}] DRY-RUN: genererei thumb.avif, thumb-sm.avif, original.avif, meta.json`);
    }

    imagesProcessed++;
  } catch (err) {
    console.error(`  [${projectSlug}/${imageIndex}] ✗ Errore:`, err.message);
    errors++;
  }
}

/**
 * Entry point principale
 */
async function main() {
  // Verifica che la cartella optimized esista
  try {
    await fs.access(OPTIMIZED_PATH);
  } catch {
    console.error(`✗ Cartella non trovata: ${OPTIMIZED_PATH}`);
    console.error('Assicurati di eseguire lo script dal container backend o di impostare PUBLIC_PATH correttamente.');
    process.exit(1);
  }

  const projectDirs = await fs.readdir(OPTIMIZED_PATH);

  for (const projectSlug of projectDirs) {
    const projectPath = path.join(OPTIMIZED_PATH, projectSlug);
    const stat = await fs.stat(projectPath);
    if (!stat.isDirectory()) continue;

    console.log(`\n📁 Progetto: ${projectSlug}`);
    projectsProcessed++;

    const imageDirs = await fs.readdir(projectPath);

    for (const imageIndex of imageDirs) {
      // Salta la cartella video
      if (imageIndex === 'video') continue;

      const imagePath = path.join(projectPath, imageIndex);
      const imageStat = await fs.stat(imagePath);
      if (!imageStat.isDirectory()) continue;

      await convertImageDir(imagePath, projectSlug, imageIndex);
    }
  }

  console.log(`
╔══════════════════════════════════════════════════════╗
║   MIGRAZIONE COMPLETATA                              ║
║   Progetti: ${String(projectsProcessed).padEnd(41)}║
║   Immagini convertite: ${String(imagesProcessed).padEnd(31)}║
║   Immagini saltate: ${String(imagesSkipped).padEnd(34)}║
║   Errori: ${String(errors).padEnd(44)}║
╚══════════════════════════════════════════════════════╝

${isDryRun ? '⚠️  DRY-RUN: nessun file è stato modificato. Rimuovi --dry-run per applicare.' : ''}

Prossimi passi:
  1. Chiama POST /api/admin/regenerate-imagemeta dal backend
     (o riavvia il container: docker restart sito-rafa-backend)
  2. I nuovi path AVIF saranno riflessi in imageMeta.json e projects.json
  3. Facoltativo: elimina i vecchi file .webp e .jpg per liberare spazio
     (solo dopo aver verificato che tutto funziona)
`);

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Errore fatale:', err);
  process.exit(1);
});
