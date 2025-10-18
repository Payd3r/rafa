export type Photo = {
  id: string
  src: string
  originalUrl: string
  alt: string
  srcset?: string
  ratio?: number
  placeholder?: string
  isBest?: boolean
}

export type Project = {
  slug: string
  title: string
  dateISO: string
  description: string
  cover: Photo
  gallery: Photo[]
  video?: {
    src: string
    thumbnail: string
    alt: string
  }
}


