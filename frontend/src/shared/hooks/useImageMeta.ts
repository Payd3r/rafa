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
        
        // Aggiungi timestamp per evitare cache
        const cacheBuster = `?t=${Date.now()}`
        const response = await fetch(`/imageMeta.json${cacheBuster}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
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
        
        // Verifica se il file è vuoto (solo {})
        const keys = Object.keys(data)
        if (keys.length === 0) {
          console.warn('⚠️ imageMeta.json è vuoto. Nessuna immagine preferita disponibile.')
        } else {
          // Debug: mostra quanti isBest ci sono
          const bestCount = Object.values(data).filter((m: any) => m?.isBest === true).length
          console.log(`✅ imageMeta.json caricato: ${keys.length} immagini totali, ${bestCount} preferite`)
          if (bestCount > 0) {
            const bestPaths = Object.entries(data)
              .filter(([_, meta]: [string, any]) => meta?.isBest === true)
              .map(([path, _]) => path)
              .slice(0, 5)
            console.log('📸 Prime immagini preferite:', bestPaths)
          }
        }
        
        setImageMeta(data)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Errore sconosciuto nel caricamento di imageMeta.json')
        
        // Retry se non è l'ultimo tentativo
        if (retryCount < MAX_RETRIES) {
          console.warn(`Errore caricamento imageMeta (tentativo ${retryCount + 1}/${MAX_RETRIES}):`, error.message)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
          return fetchImageMeta(retryCount + 1)
        }
        
        console.error('Errore caricamento imageMeta dopo tutti i tentativi:', error)
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

