import express from 'express';
import multer from 'multer';
import path from 'path';
import { basicAuth } from '../middleware/auth.js';
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

/**
 * GET /api/admin/projects
 * Ritorna la lista di tutti i progetti
 */
router.get('/projects', basicAuth, async (req, res) => {
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
router.get('/imagemeta', basicAuth, async (req, res) => {
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
router.patch('/photos', basicAuth, async (req, res) => {
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
router.patch('/projects/:slug', basicAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { dateISO, description, instagramUrl } = req.body;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Slug è obbligatorio'
      });
    }

    // Valida che almeno un campo sia presente
    if (dateISO === undefined && description === undefined && instagramUrl === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Almeno un campo da aggiornare è richiesto: dateISO, description, instagramUrl'
      });
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

    console.log(`Aggiornamento progetto: ${slug}`, { dateISO, description: description ? 'presente' : undefined, instagramUrl });

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

    // Aggiorna solo i campi presenti
    if (dateISO !== undefined) {
      projects[projectIndex].dateISO = dateISO;
    }
    if (description !== undefined) {
      projects[projectIndex].description = description;
    }
    if (instagramUrl !== undefined) {
      projects[projectIndex].instagramUrl = instagramUrl || null;
    }
    
    // Salva progetti
    await fileGenerator.saveProjectsData(dataPath, projects);
    
    // Rigenera projects.json pubblico
    await fileGenerator.regenerateProjectsFile(projects);

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
router.delete('/projects/:slug', basicAuth, async (req, res) => {
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
async function processProjectInBackground(slug, title, description, dateISO, coverFiles, galleryFiles, videoFile = null, instagramUrl = null) {
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
      try {
        await videoProcessor.processVideo(videoFile.buffer, slug);
        hasVideo = true;
        console.log(`[Background] Video processato: ${slug}`);
      } catch (error) {
        console.error(`[Background] Errore processing video per ${slug}:`, error);
        // Continua anche se il video fallisce
      }
    }
    
    // Crea progetto
    const newProject = {
      slug,
      title,
      description,
      dateISO,
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
router.post('/projects', basicAuth, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'images', maxCount: 30 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, dateISO, instagramUrl } = req.body;
    const coverFiles = req.files?.cover;
    const galleryFiles = req.files?.images || [];
    const videoFile = req.files?.video?.[0] || null;

    // Validazione
    if (!title || !description || !dateISO) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti: title, description, dateISO'
      });
    }

    if (!coverFiles || coverFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Devi caricare un\'immagine di copertina'
      });
    }

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
        description,
        dateISO,
        instagramUrl: instagramUrl || null
      },
      message: `Upload completato! Il progetto "${title}" sarà disponibile a breve.`
    });

    // 🔥 PROCESSING IN BACKGROUND (fire-and-forget)
    // Non usa await = non blocca la risposta
    processProjectInBackground(slug, title, description, dateISO, coverFiles, galleryFiles, videoFile, instagramUrl)
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

