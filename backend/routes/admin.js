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
 * Funzione async separata per processing in background
 */
async function processProjectInBackground(slug, title, description, dateISO, coverFiles, galleryFiles, videoFile = null) {
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
      createdAt: new Date().toISOString()
    };
    
    // Leggi e salva projects.json
    const existingProjects = await fileGenerator.readProjectsData(dataPath);
    const updatedProjects = [newProject, ...existingProjects];
    await fileGenerator.saveProjectsData(dataPath, updatedProjects);
    
    // Rigenera file TS
    await fileGenerator.regenerateProjectsFile(updatedProjects);
    await fileGenerator.regenerateImageMetaFile();
    
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
    const { title, description, dateISO } = req.body;
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
        dateISO
      },
      message: `Upload completato! Il progetto "${title}" sarà disponibile a breve.`
    });

    // 🔥 PROCESSING IN BACKGROUND (fire-and-forget)
    // Non usa await = non blocca la risposta
    processProjectInBackground(slug, title, description, dateISO, coverFiles, galleryFiles, videoFile)
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

