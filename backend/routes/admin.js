import { isProjectCategory } from '../services/projectCategories.js';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { ImageProcessor } from '../services/imageProcessor.js';
import { VideoProcessor } from '../services/videoProcessor.js';
import { FileGenerator } from '../services/fileGenerator.js';
import { generateUniqueSlug } from '../utils/slugify.js';

const router = express.Router();

// Configurazione multer per upload in memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB max per file (per i video)
    files: 32 // Max 30 immagini + 1 cover + 1 video
  },
  fileFilter: (req, file, cb) => {
    const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allAllowedMimes = [...allowedImageMimes, ...allowedVideoMimes];

    if (allAllowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato file non supportato. Usa JPG/PNG per immagini o MP4/WebM/MOV per video.'));
    }
  }
});

// Inizializza i servizi
// In produzione usa PROD_* paths, in development usa DEV_* paths
const isDev = process.env.NODE_ENV !== 'production';
const publicPath = process.env.PUBLIC_PATH || (isDev
  ? path.join(process.cwd(), process.env.DEV_PUBLIC_PATH || '../frontend/public')
  : process.env.PROD_PUBLIC_PATH || '/app/public');
const srcPath = process.env.SRC_PATH || (isDev
  ? path.join(process.cwd(), process.env.DEV_SRC_PATH || '../frontend/src')
  : process.env.PROD_SRC_PATH || '/app/src');
const dataPath = process.env.DATA_PATH || (isDev
  ? path.join(process.cwd(), process.env.DEV_DATA_PATH || './data/projects.json')
  : process.env.PROD_DATA_PATH || '/app/data/projects.json');

const imageProcessor = new ImageProcessor(publicPath);
const videoProcessor = new VideoProcessor(publicPath);
const fileGenerator = new FileGenerator(publicPath, srcPath);

function validateMedia(type, images, video, existingVideo = false) {
  if (!['photo', 'video'].includes(type)) return 'Tipo progetto non valido';
  if (type === 'photo' && video) return 'Un progetto foto non può contenere video';
  if (type === 'video' && images.length) return 'Un progetto video non può contenere una galleria foto';
  if (type === 'video' && !video && !existingVideo) return 'Video obbligatorio';
  if (images.some(file => !file.mimetype.startsWith('image/'))) return 'La galleria deve contenere solo immagini';
  if (video && !video.mimetype.startsWith('video/')) return 'File video non valido';
  return null;
}

router.patch('/photos/selection', async (req, res) => {
  try {
    const { paths } = req.body;
    const meta = JSON.parse(await fs.readFile(path.join(publicPath, 'imageMeta.json'), 'utf8'));
    if (!Array.isArray(paths) || new Set(paths).size !== paths.length || paths.some(item => typeof item !== 'string' || !Object.hasOwn(meta, item))) {
      return res.status(400).json({ success: false, error: 'Selezione foto non valida' });
    }
    for (const photoPath of Object.keys(meta)) {
      const order = paths.indexOf(photoPath);
      const updates = { isBest: order !== -1, bestOrder: order === -1 ? null : order + 1 };
      const local = path.resolve(publicPath, '.' + path.dirname(photoPath), 'meta.json');
      if (!local.startsWith(path.resolve(publicPath, 'optimized') + path.sep)) throw new Error('Percorso foto non valido');
      const localMeta = JSON.parse(await fs.readFile(local, 'utf8'));
      await fs.writeFile(local, JSON.stringify({...localMeta, ...updates}, null, 2));
      Object.assign(meta[photoPath], updates);
    }
    const output = path.join(publicPath, 'imageMeta.json');
    await fs.writeFile(output + '.tmp', JSON.stringify(meta));
    await fs.rename(output + '.tmp', output);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

/**
 * GET /api/admin/projects
 * Ritorna la lista di tutti i progetti
 */
router.get('/projects', async (req, res) => {
  try {
    const projects = await fileGenerator.readProjectsData(dataPath);
    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Errore nel recupero progetti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei progetti'
    });
  }
});

/**
 * GET /api/admin/imagemeta
 * Ritorna imageMeta.json completo
 */
router.get('/imagemeta', async (req, res) => {
  try {
    const imageMetaPath = path.join(publicPath, 'imageMeta.json');
    const imageMetaContent = await import('fs/promises').then(fs => fs.readFile(imageMetaPath, 'utf-8'));
    const imageMeta = JSON.parse(imageMetaContent);

    res.json({
      success: true,
      imageMeta
    });
  } catch (error) {
    console.error('Errore nel recupero imageMeta:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei metadati immagini'
    });
  }
});

/**
 * PATCH /api/admin/photos
 * Aggiorna metadati di una singola foto (es: isBest)
 */
router.patch('/photos', async (req, res) => {
  try {
    const { photoPath, isBest } = req.body;

    if (!photoPath || isBest === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti: photoPath, isBest'
      });
    }

    // Aggiorna imageMeta.json
    await fileGenerator.updatePhotoMeta(photoPath, { isBest });

    res.json({
      success: true,
      message: `Foto ${photoPath} aggiornata con isBest=${isBest}`
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento foto:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore nell\'aggiornamento della foto'
    });
  }
});

/**
 * PATCH /api/admin/projects/:slug
 * Aggiorna la data, descrizione o instagramUrl di un progetto
 */
router.patch('/projects/:slug', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'images', maxCount: 30 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const { slug } = req.params;
    const { dateISO, title, instagramUrl, category, type, description } = req.body;

    if (description !== undefined && (typeof description !== 'string' || description.length > 5000)) return res.status(400).json({success:false,error:'Descrizione non valida (massimo 5000 caratteri)'});
    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Slug è obbligatorio'
      });
    }

    // Valida che almeno un campo sia presente
    if (description === undefined && dateISO === undefined && title === undefined && instagramUrl === undefined && category === undefined && type === undefined && !Object.keys(req.files || {}).length) {
      return res.status(400).json({
        success: false,
        error: 'Almeno un campo da aggiornare è richiesto: dateISO, title, instagramUrl, category, type'
      });
    }

    if (category !== undefined && !isProjectCategory(category)) {
      return res.status(400).json({ success: false, error: 'Categoria non valida' });
    }

    // Valida formato data se presente
    if (dateISO !== undefined) {
      const dateObj = new Date(dateISO);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Formato data non valido'
        });
      }
    }



    // Leggi progetti
    const projects = await fileGenerator.readProjectsData(dataPath);

    // Trova e aggiorna progetto
    const projectIndex = projects.findIndex(p => p.slug === slug);
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Progetto non trovato'
      });
    }

    if (category !== undefined) projects[projectIndex].category = category;

    // Aggiorna solo i campi presenti
    if (dateISO !== undefined) {
      projects[projectIndex].dateISO = dateISO;
    }
    const project = projects[projectIndex];
    if (description !== undefined) project.description = description.trim();
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ success: false, error: 'Titolo obbligatorio' });
      project.title = title.trim();
    }
    const nextType = type || project.type || (project.hasVideo ? 'video' : 'photo');
    const gallery = req.files?.images || [];
    const video = req.files?.video?.[0];
    const mediaError = validateMedia(nextType, gallery, video, nextType === 'video' && project.hasVideo);
    if (mediaError) return res.status(400).json({ success: false, error: mediaError });
    if (req.files?.cover?.[0] && !req.files.cover[0].mimetype.startsWith('image/')) return res.status(400).json({success:false,error:'Copertina non valida'});
    if (req.files?.cover?.[0]) {
      await imageProcessor.processImage(req.files.cover[0].buffer, slug, 'cover');
      project.hasCover = true;
    }
    // Preserve legacy covers stored as gallery image 1 before replacing media.
    if (!project.hasCover && (gallery.length || nextType === 'video')) {
      await fs.cp(path.join(publicPath, 'optimized', slug, '1'), path.join(publicPath, 'optimized', slug, 'cover'), {recursive:true});
      project.hasCover = true;
    }
    if (video) await videoProcessor.processVideo(video.buffer, slug);
    if (gallery.length || nextType === 'video') {
      const folder = path.join(publicPath, 'optimized', slug);
      for (const entry of await fs.readdir(folder).catch(() => [])) {
        if (/^\d+$/.test(entry) && !(entry === '1' && !project.hasCover)) await fs.rm(path.join(folder, entry), {recursive:true,force:true});
      }
      if (gallery.length) await imageProcessor.processProjectImages(gallery, slug);
      project.imageCount = gallery.length;
    }
    if (nextType === 'photo') await fs.rm(path.join(publicPath, 'optimized', slug, 'video'), {recursive:true,force:true});
    project.type = nextType;
    project.hasVideo = nextType === 'video';
    if (instagramUrl !== undefined) {
      projects[projectIndex].instagramUrl = instagramUrl || null;
    }

    // Salva progetti
    await fileGenerator.saveProjectsData(dataPath, projects);

    // Rigenera projects.json pubblico
    await fileGenerator.regenerateProjectsFile(projects);
    await fileGenerator.regenerateImageMetaFile();
    await fileGenerator.regenerateMasonryLayoutsFile();

    res.json({
      success: true,
      message: `Progetto ${slug} aggiornato con successo`,
      project: projects[projectIndex]
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento progetto:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore nell\'aggiornamento del progetto'
    });
  }
});

/**
 * DELETE /api/admin/projects/:slug
 * Elimina un progetto completo (cartella + JSON)
 */
router.delete('/projects/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Slug mancante'
      });
    }

    console.log(`Eliminazione progetto: ${slug}`);

    // Elimina progetto
    const updatedProjects = await fileGenerator.deleteProject(slug, dataPath);

    // Rigenera file
    await fileGenerator.regenerateProjectsFile(updatedProjects);
    await fileGenerator.regenerateImageMetaFile();
    await fileGenerator.regenerateMasonryLayoutsFile();

    res.json({
      success: true,
      message: `Progetto ${slug} eliminato con successo`,
      remainingProjects: updatedProjects.length
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione progetto:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore nell\'eliminazione del progetto'
    });
  }
});

/**
 * Funzione async separata per processing in background
 */
async function processProjectInBackground(slug, title, type, dateISO, coverFiles, galleryFiles, videoFile = null, instagramUrl = null, category, description = '') {
  console.log(`[Background] Inizio processing progetto: ${slug}`);

  try {
    // Processa cover
    await imageProcessor.processImage(coverFiles[0].buffer, slug, 'cover');
    console.log(`[Background] Cover processata: ${slug}`);

    // Processa galleria
    if (galleryFiles.length > 0) {
      await imageProcessor.processProjectImages(galleryFiles, slug);
      console.log(`[Background] Galleria processata: ${slug} (${galleryFiles.length} immagini)`);
    }

    // Processa video (se presente)
    let hasVideo = false;
    if (videoFile) {
      await videoProcessor.processVideo(videoFile.buffer, slug);
      hasVideo = true;
    }

    // Crea progetto
    const newProject = {
      slug,
      title,
      type,
      dateISO,
      category,
      description: description.trim(),
      hasCover: true,
      imageCount: galleryFiles.length,
      hasVideo,
      createdAt: new Date().toISOString(),
      instagramUrl: instagramUrl || null
    };

    // Leggi e salva projects.json
    const existingProjects = await fileGenerator.readProjectsData(dataPath);
    const updatedProjects = [newProject, ...existingProjects];
    await fileGenerator.saveProjectsData(dataPath, updatedProjects);

    // Rigenera file TS e layout
    await fileGenerator.regenerateProjectsFile(updatedProjects);
    await fileGenerator.regenerateImageMetaFile();
    await fileGenerator.regenerateMasonryLayoutsFile();

    console.log(`[Background] ✓ Progetto completato: ${slug}`);

  } catch (error) {
    console.error(`[Background] ✗ Errore processing ${slug}:`, error);
  }
}

/**
 * POST /api/admin/projects
 * Upload immediato + processing in background (fire-and-forget)
 */
router.post('/projects', upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'images', maxCount: 30 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, type, dateISO, instagramUrl, category, description } = req.body;
    const coverFiles = req.files?.cover;
    const galleryFiles = req.files?.images || [];
    const videoFile = req.files?.video?.[0] || null;

    if (!isProjectCategory(category)) {
      return res.status(400).json({ success: false, error: 'Categoria obbligatoria non valida' });
    }

    // Validazione
    if (description !== undefined && (typeof description !== 'string' || description.length > 5000)) return res.status(400).json({success:false,error:'Descrizione non valida (massimo 5000 caratteri)'});
    if (!title?.trim() || !dateISO || isNaN(new Date(dateISO).getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti: title, type, dateISO'
      });
    }

    if (!coverFiles || coverFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Devi caricare un\'immagine di copertina'
      });
    }

    const mediaError = validateMedia(type, galleryFiles, videoFile);
    if (mediaError) return res.status(400).json({ success: false, error: mediaError });
    if (!coverFiles[0].mimetype.startsWith('image/')) return res.status(400).json({success:false,error:'Copertina non valida'});

    // Leggi progetti esistenti
    const existingProjects = await fileGenerator.readProjectsData(dataPath);
    const existingSlugs = existingProjects.map(p => p.slug);

    // Genera slug unico
    const slug = generateUniqueSlug(title, existingSlugs);

    console.log(`Upload ricevuto: ${slug} con cover, ${galleryFiles.length} immagini galleria${videoFile ? ' e video' : ''}`);

    // 🔥 RISPOSTA IMMEDIATA (prima del processing!)
    res.json({
      success: true,
      project: {
        slug,
        title,
        type,
        dateISO,
        category,
        instagramUrl: instagramUrl || null
      },
      message: `Upload completato! Il progetto "${title}" sarà disponibile a breve.`
    });

    // 🔥 PROCESSING IN BACKGROUND (fire-and-forget)
    // Non usa await = non blocca la risposta
    processProjectInBackground(slug, title, type, dateISO, coverFiles, galleryFiles, videoFile, instagramUrl, category, description || '')
      .catch(err => console.error('Errore processing background:', err));

  } catch (error) {
    console.error('Errore durante upload:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore durante l\'upload'
    });
  }
});

/**
 * POST /api/admin/regenerate-imagemeta
 * Rigenera il file imageMeta.json
 */
router.post('/regenerate-imagemeta', async (req, res) => {
  try {
    await fileGenerator.regenerateImageMetaFile();

    res.json({
      success: true,
      message: 'imageMeta.json rigenerato con successo'
    });
  } catch (error) {
    console.error('Errore durante la rigenerazione di imageMeta.json:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore durante la rigenerazione di imageMeta.json'
    });
  }
});

/**
 * GET /api/admin/debug/imagemeta
 * Endpoint di debug per verificare lo stato di imageMeta.json e i meta.json locali
 */
router.get('/debug/imagemeta', async (req, res) => {
  try {
    const imageMetaPath = path.join(publicPath, 'imageMeta.json');
    const optimizedPath = path.join(publicPath, 'optimized');

    // Leggi imageMeta.json
    let imageMeta = {};
    let imageMetaExists = false;
    let imageMetaSize = 0;
    try {
      const imageMetaContent = await fs.readFile(imageMetaPath, 'utf-8');
      const parsed = JSON.parse(imageMetaContent);
      if (parsed && typeof parsed === 'object') {
        imageMeta = parsed;
        imageMetaExists = true;
        imageMetaSize = imageMetaContent.length;
      }
    } catch (err) {
      // File non esiste o non è valido
    }

    // Conta immagini preferite
    const bestCount = Object.values(imageMeta).filter(m => m?.isBest === true).length;
    const totalCount = Object.keys(imageMeta).length;

    // Conta meta.json locali con isBest
    let localMetaStats = {
      total: 0,
      withIsBest: 0,
      withIsBestTrue: 0
    };

    try {
      const projects = await fs.readdir(optimizedPath);

      for (const projectSlug of projects) {
        const projectPath = path.join(optimizedPath, projectSlug);
        const stat = await fs.stat(projectPath);

        if (!stat.isDirectory()) continue;

        const images = await fs.readdir(projectPath);

        for (const imageIndex of images) {
          const imagePath = path.join(projectPath, imageIndex);
          const imageStat = await fs.stat(imagePath);

          if (!imageStat.isDirectory()) continue;

          const metaPath = path.join(imagePath, 'meta.json');
          try {
            const metaContent = await fs.readFile(metaPath, 'utf-8');
            const meta = JSON.parse(metaContent);
            localMetaStats.total++;

            if (meta.isBest !== undefined) {
              localMetaStats.withIsBest++;
              if (meta.isBest === true) {
                localMetaStats.withIsBestTrue++;
              }
            }
          } catch (err) {
            // Ignora errori di lettura
          }
        }
      }
    } catch (err) {
      // Errore nella scansione
    }

    res.json({
      success: true,
      debug: {
        imageMeta: {
          exists: imageMetaExists,
          size: imageMetaSize,
          totalImages: totalCount,
          bestImages: bestCount,
          isEmpty: totalCount === 0
        },
        localMeta: {
          totalFiles: localMetaStats.total,
          withIsBest: localMetaStats.withIsBest,
          withIsBestTrue: localMetaStats.withIsBestTrue
        },
        path: {
          imageMetaPath,
          optimizedPath
        }
      }
    });
  } catch (error) {
    console.error('Errore durante il debug di imageMeta:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore durante il debug di imageMeta'
    });
  }
});

/**
 * GET /api/users/me
 * Verifica autenticazione utente (per compatibilità con sistemi che lo richiedono)
 */
router.get('/users/me', (req, res) => {
  res.json({
    success: true,
    user: {
      authenticated: true,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * GET /api/admin/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;

