import { useState, useEffect } from 'react'

export type ImageMetaData = Record<string, { ratio: number; placeholder: string }>

/**
 * Hook per caricare metadati immagini da /imageMeta.json
 */
export function useImageMeta() {
  const [imageMeta, setImageMeta] = useState<ImageMetaData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImageMeta = async () => {
      try {
        setLoading(true)
        const response = await fetch('/imageMeta.json')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setImageMeta(data)
      } catch (err) {
        console.error('Errore caricamento imageMeta:', err)
        setImageMeta({})
      } finally {
        setLoading(false)
      }
    }

    fetchImageMeta()
  }, [])

  return { imageMeta, loading }
}

