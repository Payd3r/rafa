import { createContext, useContext, type ReactNode } from 'react'
import { useImageMeta, type ImageMetaData } from '../hooks/useImageMeta'

interface ImageMetaContextType {
  imageMeta: ImageMetaData
  loading: boolean
}

const ImageMetaContext = createContext<ImageMetaContextType | null>(null)

export function ImageMetaProvider({ children }: { children: ReactNode }) {
  const { imageMeta, loading } = useImageMeta()
  
  return (
    <ImageMetaContext.Provider value={{ imageMeta, loading }}>
      {children}
    </ImageMetaContext.Provider>
  )
}

export function useImageMetaContext() {
  const context = useContext(ImageMetaContext)
  if (!context) {
    throw new Error('useImageMetaContext deve essere usato dentro ImageMetaProvider')
  }
  return context
}

