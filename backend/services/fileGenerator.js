import fs from 'fs/promises';
import path from 'path';
import { MasonryLayoutGenerator } from './masonryLayoutGenerator.js';

/**
 * Servizio per rigenerare i file TypeScript projects.ts e imageMeta.ts
 */
export class FileGenerator {
  constructor(publicPath, srcPath) {
    this.publicPath = publicPath;
    this.srcPath = srcPath;
  }

  /**
   * Rigenera public/projects.json con struttura completa per frontend
   */
  async regenerateProjectsFile(projectsData) {
    // Trasforma i progetti in formato completo con cover e gallery
    const projects = projectsData.map(project => {
      // Nuovi progetti usano /cover/, progetti vecchi usano /1/
      const coverPath = project.hasCover ? 'cover' : '1';
      
      // Genera gallery photos
      const gallery = Array.from({ length: project.imageCount }, (_, i) => ({
        id: `${project.slug}-${i + 1}`,
        src: `/optimized/${project.slug}/${i + 1}/thumb.webp`,
        originalUrl: `/optimized/${project.slug}/${i + 1}/original.jpg`,
        alt: `Foto ${i + 1} del progetto ${project.slug}`
      }));
      
      const projectData = {
        slug: project.slug,
        title: project.title,
        dateISO: project.dateISO,
        description: project.description,
        cover: {
          id: `${project.slug}-cover`,
          src: `/optimized/${project.slug}/${coverPath}/thumb.webp`,
          originalUrl: `/optimized/${project.slug}/${coverPath}/original.jpg`,
          alt: project.title
        },
        gallery
      };

      // Aggiungi video se presente
      if (project.hasVideo) {
        projectData.video = {
          src: `/optimized/${project.slug}/video/optimized.mp4`,
          thumbnail: `/optimized/${project.slug}/video/thumb.jpg`,
          alt: `Video del progetto ${project.title}`
        };
      }

      // Aggiungi Instagram URL se presente
      if (project.instagramUrl) {
        projectData.instagramUrl = project.instagramUrl;
      }

      return projectData;
    });

    // Scrivi JSON in public/ (servito da Nginx)
    const outputPath = path.join(this.publicPath, 'projects.json');
    await fs.writeFile(outputPath, JSON.stringify(projects, null, 2));
    
    console.log(`Generato ${outputPath} con ${projects.length} progetti`);
    
    return outputPath;
  }

  /**
   * Rigenera public/imageMeta.json scansionando le cartelle optimized
   * Preserva i valori isBest esistenti se il file imageMeta.json già esiste
   */
  async regenerateImageMetaFile() {
    const optimizedPath = path.join(this.publicPath, 'optimized');
    const metaObject = {};
    
    // Leggi il file imageMeta.json esistente per preservare i valori isBest
    // (nel caso ci siano stati aggiornamenti diretti che non sono ancora nei meta.json locali)
    let existingImageMeta = {};
    const imageMetaPath = path.join(this.publicPath, 'imageMeta.json');
    try {
      const existingContent = await fs.readFile(imageMetaPath, 'utf-8');
      existingImageMeta = JSON.parse(existingContent);
    } catch (err) {
      // File non esiste o non è valido, va bene, partiremo da zero
      console.log('imageMeta.json non trovato o vuoto, verrà generato da zero');
    }

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

          // Leggi meta.json
          const metaPath = path.join(imagePath, 'meta.json');
          try {
            const metaContent = await fs.readFile(metaPath, 'utf-8');
            const meta = JSON.parse(metaContent);
            
            const thumbPath = `/optimized/${projectSlug}/${imageIndex}/thumb.webp`;
            
            // Preferisci isBest da meta.json locale, altrimenti usa quello esistente in imageMeta.json
            const existingIsBest = existingImageMeta[thumbPath]?.isBest;
            const localIsBest = meta.isBest !== undefined ? meta.isBest : false;
            const isBest = localIsBest || existingIsBest || false;
            
            metaObject[thumbPath] = {
              ratio: meta.ratio,
              placeholder: meta.placeholder,
              isBest: isBest
            };
          } catch (err) {
            console.warn(`Impossibile leggere meta.json per ${projectSlug}/${imageIndex}`);
          }
        }
      }

      // Scrivi JSON in public/ (servito da Nginx)
      const outputPath = path.join(this.publicPath, 'imageMeta.json');
      await fs.writeFile(outputPath, JSON.stringify(metaObject, null, 2));
      
      console.log(`Generato ${outputPath} con ${Object.keys(metaObject).length} immagini`);
      
      return outputPath;
    } catch (error) {
      console.error('Errore durante la rigenerazione di imageMeta.json:', error);
      throw error;
    }
  }

  /**
   * Legge il file projects.json
   */
  async readProjectsData(dataPath) {
    try {
      const content = await fs.readFile(dataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Se il file non esiste, ritorna array vuoto
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Salva il file projects.json
   */
  async saveProjectsData(dataPath, projectsData) {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(projectsData, null, 2));
  }

  /**
   * Aggiorna un singolo campo di una foto in imageMeta.json
   * Aggiorna anche il file meta.json locale dell'immagine per preservare i dati
   */
  async updatePhotoMeta(photoPath, updates) {
    try {
      const imageMetaPath = path.join(this.publicPath, 'imageMeta.json');
      const imageMetaContent = await fs.readFile(imageMetaPath, 'utf-8');
      const imageMeta = JSON.parse(imageMetaContent);

      if (!imageMeta[photoPath]) {
        throw new Error(`Photo not found: ${photoPath}`);
      }

      // Estrai slug progetto e indice immagine dal path
      // photoPath è del formato: /optimized/project-slug/image-index/thumb.webp
      const pathMatch = photoPath.match(/^\/optimized\/([^\/]+)\/([^\/]+)\//);
      if (!pathMatch) {
        throw new Error(`Formato photoPath non valido: ${photoPath}`);
      }

      const projectSlug = pathMatch[1];
      const imageIndex = pathMatch[2];

      // Aggiorna il file meta.json locale dell'immagine
      const imageMetaFilePath = path.join(this.publicPath, 'optimized', projectSlug, imageIndex, 'meta.json');
      try {
        const existingMetaContent = await fs.readFile(imageMetaFilePath, 'utf-8');
        const existingMeta = JSON.parse(existingMetaContent);
        
        // Aggiorna i campi nel meta.json locale
        const updatedMeta = {
          ...existingMeta,
          ...updates
        };
        
        // Salva il meta.json locale aggiornato
        await fs.writeFile(imageMetaFilePath, JSON.stringify(updatedMeta, null, 2));
        console.log(`Aggiornato meta.json locale per ${projectSlug}/${imageIndex}`);
      } catch (err) {
        console.warn(`Impossibile aggiornare meta.json locale per ${photoPath}:`, err);
        // Continua comunque ad aggiornare imageMeta.json
      }

      // Aggiorna i campi in imageMeta.json
      imageMeta[photoPath] = {
        ...imageMeta[photoPath],
        ...updates
      };

      // Salva imageMeta.json
      await fs.writeFile(imageMetaPath, JSON.stringify(imageMeta, null, 2));
      
      console.log(`Aggiornato ${photoPath} in imageMeta.json`);
      
      return imageMeta;
    } catch (error) {
      console.error('Errore durante l\'aggiornamento di imageMeta.json:', error);
      throw error;
    }
  }

  /**
   * Elimina un progetto completo (cartella + JSON)
   */
  async deleteProject(slug, dataPath) {
    try {
      // 1. Elimina cartella fisica
      const projectPath = path.join(this.publicPath, 'optimized', slug);
      await fs.rm(projectPath, { recursive: true, force: true });
      console.log(`Eliminata cartella: ${projectPath}`);

      // 2. Rimuovi da projects.json
      const projects = await this.readProjectsData(dataPath);
      const updatedProjects = projects.filter(p => p.slug !== slug);
      await this.saveProjectsData(dataPath, updatedProjects);
      console.log(`Rimosso progetto ${slug} da projects.json`);

      return updatedProjects;
    } catch (error) {
      console.error(`Errore durante l'eliminazione del progetto ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Rigenera public/masonryLayouts.json con layout pre-calcolati per tutti i breakpoint
   */
  async regenerateMasonryLayoutsFile() {
    try {
      // Leggi projects.json (già generato)
      const projectsPath = path.join(this.publicPath, 'projects.json');
      const projectsContent = await fs.readFile(projectsPath, 'utf-8');
      const projects = JSON.parse(projectsContent);

      // Leggi imageMeta.json (già generato)
      const imageMetaPath = path.join(this.publicPath, 'imageMeta.json');
      const imageMetaContent = await fs.readFile(imageMetaPath, 'utf-8');
      const imageMeta = JSON.parse(imageMetaContent);

      // Genera tutti i layout
      const layouts = MasonryLayoutGenerator.generateAllLayouts(projects, imageMeta);

      // Scrivi JSON in public/
      const outputPath = path.join(this.publicPath, 'masonryLayouts.json');
      await fs.writeFile(outputPath, JSON.stringify(layouts, null, 2));

      console.log(`Generato ${outputPath} con ${Object.keys(layouts).length} configurazioni di layout`);
      
      return outputPath;
    } catch (error) {
      console.error('Errore durante la rigenerazione di masonryLayouts.json:', error);
      throw error;
    }
  }
}

