import type { Project, Photo } from '../../shared/types'

// Genera le foto per ogni progetto basandosi sulle cartelle in public/assets
const createProjectPhotos = (projectSlug: string, count: number): Photo[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${projectSlug}-${i + 1}`,
    src: `/optimized/${projectSlug}/${i + 1}/thumb.webp`,
    originalUrl: `/optimized/${projectSlug}/${i + 1}/original.jpg`,
    alt: `Foto ${i + 1} del progetto ${projectSlug}`,
    tags: ['fotografia', 'bianco-e-nero'],
  }))
}

export const projects: Project[] = [
  {
    slug: 'progetto1',
    title: 'Ritratti Urbani',
    dateISO: '2024-11-12',
    description: 'Volti e storie nelle strade della città, in contrasto netto b/n. Una serie che cattura l\'essenza umana attraverso sguardi intensi e momenti di vita quotidiana.',
    cover: {
      id: 'progetto1-cover',
      src: '/optimized/progetto1/1/thumb.webp',
      originalUrl: '/optimized/progetto1/1/original.jpg',
      alt: 'Ritratto urbano in bianco e nero',
      tags: ['ritratto', 'urbano'],
    },
    gallery: createProjectPhotos('progetto1', 14),
  },
  {
    slug: 'progetto2',
    title: 'Linee e Ombre',
    dateISO: '2023-06-07',
    description: 'Architetture e geometrie con forte uso di ombre e luce radente. Un\'esplorazione delle forme architettoniche attraverso il gioco di luci e ombre.',
    cover: {
      id: 'progetto2-cover',
      src: '/optimized/progetto2/1/thumb.webp',
      originalUrl: '/optimized/progetto2/1/original.jpg',
      alt: 'Architettura con ombre drammatiche',
      tags: ['architettura', 'geometrie'],
    },
    gallery: createProjectPhotos('progetto2', 8),
  },
  {
    slug: 'progetto3',
    title: 'Paesaggi Interiori',
    dateISO: '2024-03-15',
    description: 'Spazi interni che raccontano storie attraverso la luce naturale. Un viaggio negli ambienti domestici e commerciali.',
    cover: {
      id: 'progetto3-cover',
      src: '/optimized/progetto3/1/thumb.webp',
      originalUrl: '/optimized/progetto3/1/original.jpg',
      alt: 'Interno con luce naturale',
      tags: ['interni', 'luce'],
    },
    gallery: createProjectPhotos('progetto3', 6),
  },
  {
    slug: 'progetto4',
    title: 'Movimento e Stasi',
    dateISO: '2024-01-20',
    description: 'La dialettica tra movimento e immobilità nella fotografia di strada. Catturare l\'attimo fuggente e l\'eternità del momento.',
    cover: {
      id: 'progetto4-cover',
      src: '/optimized/progetto4/1/thumb.webp',
      originalUrl: '/optimized/progetto4/1/original.jpg',
      alt: 'Movimento nella strada',
      tags: ['movimento', 'strada'],
    },
    gallery: createProjectPhotos('progetto4', 6),
  },
  {
    slug: 'progetto5',
    title: 'Texture Urbane',
    dateISO: '2023-09-10',
    description: 'Le texture delle superfici urbane raccontano la storia della città. Mura, pavimenti, metalli che portano i segni del tempo.',
    cover: {
      id: 'progetto5-cover',
      src: '/optimized/progetto5/1/thumb.webp',
      originalUrl: '/optimized/progetto5/1/original.jpg',
      alt: 'Texture urbana dettagliata',
      tags: ['texture', 'urbano'],
    },
    gallery: createProjectPhotos('progetto5', 6),
  },
  {
    slug: 'progetto6',
    title: 'Silhouette e Profili',
    dateISO: '2024-05-03',
    description: 'La potenza espressiva delle silhouette contro la luce. Figure che si stagliano nette sullo sfondo.',
    cover: {
      id: 'progetto6-cover',
      src: '/optimized/progetto6/1/thumb.webp',
      originalUrl: '/optimized/progetto6/1/original.jpg',
      alt: 'Silhouette contro la luce',
      tags: ['silhouette', 'controluce'],
    },
    gallery: createProjectPhotos('progetto6', 5),
  },
  {
    slug: 'progetto7',
    title: 'Minimalismo Urbano',
    dateISO: '2024-07-18',
    description: 'La bellezza del minimalismo nella fotografia urbana. Spazi vuoti, linee pulite, composizioni essenziali.',
    cover: {
      id: 'progetto7-cover',
      src: '/optimized/progetto7/1/thumb.webp',
      originalUrl: '/optimized/progetto7/1/original.jpg',
      alt: 'Composizione minimalista urbana',
      tags: ['minimalismo', 'urbano'],
    },
    gallery: createProjectPhotos('progetto7', 3),
  },
]


