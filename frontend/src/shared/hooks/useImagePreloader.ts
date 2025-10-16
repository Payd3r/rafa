import { useEffect, useRef } from 'react'

/**
 * Hook per precaricare immagini in modo imperativo
 * Utilizza new Image() per garantire che le immagini siano caricate in cache
 */
export function useImagePreloader(
  currentSrc: string,
  prevSrc: string | undefined,
  nextSrc: string | undefined,
  enabled: boolean = true
) {
  const preloadedRef = useRef<Set<string>>(new Set())
  const loadingRef = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    if (!enabled) return

    // Funzione helper per precaricare una singola immagine
    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Se l'immagine è già stata precaricata, skip
        if (preloadedRef.current.has(src)) {
          resolve()
          return
        }

        // Se l'immagine è già in fase di caricamento, skip
        if (loadingRef.current.has(src)) {
          resolve()
          return
        }

        const img = new Image()
        loadingRef.current.set(src, img)

        img.onload = () => {
          preloadedRef.current.add(src)
          loadingRef.current.delete(src)
          resolve()
        }

        img.onerror = () => {
          loadingRef.current.delete(src)
          reject(new Error(`Failed to preload image: ${src}`))
        }

        img.src = src
      })
    }

    // 1. Precarica l'immagine corrente con priorità massima
    preloadImage(currentSrc)
      .then(() => {
        // 2. Quando l'immagine corrente è caricata, precarica le adiacenti
        const adjacentPromises: Promise<void>[] = []
        
        if (prevSrc) {
          adjacentPromises.push(preloadImage(prevSrc).catch(() => {
            // Ignora errori per immagini adiacenti
          }))
        }
        
        if (nextSrc) {
          adjacentPromises.push(preloadImage(nextSrc).catch(() => {
            // Ignora errori per immagini adiacenti
          }))
        }

        return Promise.all(adjacentPromises)
      })
      .catch(() => {
        // Gestione errori silenziosa per l'immagine corrente
        // L'immagine verrà comunque caricata dal tag <img> nel DOM
      })

    // Cleanup: cancella le immagini in caricamento quando il componente viene smontato
    return () => {
      loadingRef.current.forEach((img) => {
        img.onload = null
        img.onerror = null
      })
      loadingRef.current.clear()
    }
  }, [currentSrc, prevSrc, nextSrc, enabled])

  return {
    isPreloaded: (src: string) => preloadedRef.current.has(src)
  }
}

