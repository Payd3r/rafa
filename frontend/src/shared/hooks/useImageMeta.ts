import { useState, useEffect } from 'react'

export type ImageMetaData = Record<string, { ratio: number; placeholder: string; isBest?: boolean }>

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 secondo

/**
 * Hook per caricare metadati immagini da /imageMeta.json
 * Con retry logic e gestione errori migliorata
 */
export function useImageMeta() {
  const [imageMeta, setImageMeta] = useState<ImageMetaData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchImageMeta = async (retryCount = 0): Promise<void> => {
      try {
        setLoading(true)
        setError(null)
        
        // Cache busting più aggressivo: timestamp + random
        const cacheBuster = `?t=${Date.now()}&r=${Math.random()}`
        const response = await fetch(`/imageMeta.json${cacheBuster}`, {
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Verifica che i dati siano validi
        if (!data || typeof data !== 'object') {
          throw new Error('Formato dati non valido: imageMeta.json è vuoto o non valido')
        }
        
        setImageMeta(data)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Errore sconosciuto nel caricamento di imageMeta.json')
        
        // Retry se non è l'ultimo tentativo
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

