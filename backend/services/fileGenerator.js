import fs from 'fs/promises';
import path from 'path';

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
   */
  async regenerateImageMetaFile() {
    const optimizedPath = path.join(this.publicPath, 'optimized');
    const metaObject = {};

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
            metaObject[thumbPath] = {
              ratio: meta.ratio,
              placeholder: meta.placeholder
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
}

