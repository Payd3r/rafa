import { useState, useEffect } from 'react'

export type ImageMetaData = Record<string, { ratio: number; placeholder: string; isBest?: boolean }>

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 secondo

/**
 * Hook per caricare metadati immagini da /imageMeta.json
 * Usa stale-while-revalidate: serve subito la cache e aggiorna in background.
 * Il placeholder è una stringa Base64 inline (no fetch extra per ogni immagine).
 */
export function useImageMeta() {
  const [imageMeta, setImageMeta] = useState<ImageMetaData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchImageMeta = async (retryCount = 0): Promise<void> => {
      try {
        // stale-while-revalidate: il browser serve subito la versione in cache
        // e scarica in background una versione fresca (perfetto per JSON semi-dinamico)
        const response = await fetch('/imageMeta.json', {
          cache: 'default',
          headers: {
            'Cache-Control': 'stale-while-revalidate=60'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data || typeof data !== 'object') {
          throw new Error('Formato dati non valido: imageMeta.json è vuoto o non valido')
        }

        setImageMeta(data)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Errore sconosciuto nel caricamento di imageMeta.json')

        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
          return fetchImageMeta(retryCount + 1)
        }
        setError(error)
        setImageMeta({})
      } finally {
        setLoading(false)
      }
    }

    fetchImageMeta()
  }, [])

  return { imageMeta, loading, error }
}
