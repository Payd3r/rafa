import { useCallback, useEffect, useRef } from 'react'

interface PrefetchOptions {
  priority?: 'high' | 'low' | 'auto'
  timeout?: number
}

// Cache per evitare prefetch duplicati
const prefetchCache = new Set<string>()

export function usePrefetch() {
  const prefetchQueue = useRef<Set<string>>(new Set())
  const isPrefetching = useRef(false)

  const prefetchImage = useCallback((src: string, options: PrefetchOptions = {}) => {
    if (prefetchCache.has(src) || prefetchQueue.current.has(src)) {
      return Promise.resolve()
    }

    prefetchQueue.current.add(src)

    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      const timeout = options.timeout || 5000
      
      const cleanup = () => {
        prefetchCache.add(src)
        prefetchQueue.current.delete(src)
        isPrefetching.current = false
      }

    const timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error(`Prefetch timeout for ${src}`))
    }, timeout)

      img.onload = () => {
        clearTimeout(timeoutId)
        cleanup()
        resolve()
      }

      img.onerror = () => {
        clearTimeout(timeoutId)
        cleanup()
        reject(new Error(`Failed to prefetch ${src}`))
      }

      // Imposta la priorità se supportata
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = options.priority || 'auto'
      }

      img.src = src
    })
  }, [])

  const prefetchImages = useCallback(async (urls: string[], options: PrefetchOptions = {}) => {
    if (isPrefetching.current) return

    isPrefetching.current = true
    
    try {
      // Prefetch in batch per non sovraccaricare la rete
      const batchSize = 3
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize)
        await Promise.allSettled(
          batch.map(url => prefetchImage(url, options))
        )
        
        // Piccola pausa tra i batch
        if (i + batchSize < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    } finally {
      isPrefetching.current = false
    }
  }, [prefetchImage])

  const prefetchOnHover = useCallback((urls: string[], element: HTMLElement) => {
    let hoverTimeout: number

    const handleMouseEnter = () => {
      hoverTimeout = setTimeout(() => {
        prefetchImages(urls, { priority: 'high' })
      }, 200) // Delay per evitare prefetch accidentali
    }

    const handleMouseLeave = () => {
      clearTimeout(hoverTimeout)
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      clearTimeout(hoverTimeout)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [prefetchImages])

  return {
    prefetchImage,
    prefetchImages,
    prefetchOnHover
  }
}

// Hook per prefetch automatico delle immagini visibili
export function useIntersectionPrefetch(urls: string[], options: PrefetchOptions = {}) {
  const { prefetchImages } = usePrefetch()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || urls.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchImages(urls, options)
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px', // Prefetch quando l'elemento è a 50px dal viewport
        threshold: 0.1
      }
    )

    observerRef.current.observe(element)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [urls, prefetchImages, options])

  return elementRef
}

// Hook per prefetch delle immagini adiacenti (per lightbox)
export function useAdjacentPrefetch(currentIndex: number, allImages: string[]) {
  const { prefetchImages } = usePrefetch()

  useEffect(() => {
    const adjacentImages: string[] = []
    
    // Prefetch immagine precedente e successiva
    if (currentIndex > 0) {
      adjacentImages.push(allImages[currentIndex - 1])
    }
    if (currentIndex < allImages.length - 1) {
      adjacentImages.push(allImages[currentIndex + 1])
    }

    if (adjacentImages.length > 0) {
      prefetchImages(adjacentImages, { priority: 'high' })
    }
  }, [currentIndex, allImages, prefetchImages])
}
