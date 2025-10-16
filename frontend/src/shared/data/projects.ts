import type { Project, Photo } from '../../shared/types'

// Genera le foto per ogni progetto basandosi sulle cartelle in public/assets
const createProjectPhotos = (projectSlug: string, count: number): Photo[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${projectSlug}-${i + 1}`,
    src: `/optimized/${projectSlug}/${i + 1}/thumb.webp`,
    originalUrl: `/optimized/${projectSlug}/${i + 1}/original.jpg`,
    alt: `Foto ${i + 1} del progetto ${projectSlug}`,
  }))
}

export const projects: Project[] = [
  
]
