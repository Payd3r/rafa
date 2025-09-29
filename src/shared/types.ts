export type Photo = {
  id: string
  src: string
  originalUrl: string
  alt: string
  tags?: string[]
  srcset?: string
  ratio?: number
  placeholder?: string
}

export type Project = {
  slug: string
  title: string
  dateISO: string
  description: string
  cover: Photo
  gallery: Photo[]
}


