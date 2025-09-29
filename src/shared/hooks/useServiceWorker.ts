import { useCallback, useEffect, useState } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isInstalled: boolean
  isUpdated: boolean
  registration: ServiceWorkerRegistration | null
  error: string | null
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isInstalled: false,
    isUpdated: false,
    registration: null,
    error: null
  })

  const updateServiceWorker = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [state.registration])

  const cacheImages = useCallback(async (urls: string[]) => {
    if (!state.registration?.active) return

    state.registration.active.postMessage({
      type: 'CACHE_IMAGES',
      payload: { urls }
    })
  }, [state.registration])

  const clearCache = useCallback(async (cacheName?: string) => {
    if (!state.registration?.active) return

    state.registration.active.postMessage({
      type: 'CLEAR_CACHE',
      payload: { cacheName }
    })
  }, [state.registration])

  const getCacheSize = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      if (!state.registration?.active) {
        resolve(0)
        return
      }

      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_SIZE') {
          resolve(event.data.size)
        }
      }

      state.registration.active.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      )
    })
  }, [state.registration])

  useEffect(() => {
    if (!state.isSupported) return

    let registration: ServiceWorkerRegistration | null = null

    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        setState(prev => ({
          ...prev,
          registration,
          isInstalled: true,
          error: null
        }))

        // Controlla se c'è un aggiornamento
        registration.addEventListener('updatefound', () => {
          const newWorker = registration!.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({
                  ...prev,
                  isUpdated: true
                }))
              }
            })
          }
        })

        // Gestisce i messaggi dal service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, payload } = event.data
          
          switch (type) {
            case 'CACHE_UPDATED':
              console.log('SW: Cache updated for', payload.url)
              break
            case 'CACHE_ERROR':
              console.error('SW: Cache error:', payload.error)
              break
          }
        })

      } catch (error) {
        console.error('SW registration failed:', error)
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    registerSW()

    // Cleanup
    return () => {
      if (registration) {
        registration.removeEventListener('updatefound', () => {})
      }
    }
  }, [state.isSupported])

  return {
    ...state,
    updateServiceWorker,
    cacheImages,
    clearCache,
    getCacheSize
  }
}

// Hook per prefetch automatico delle immagini critiche
export function useCriticalImagePrefetch() {
  const { cacheImages } = useServiceWorker()

  useEffect(() => {
    // Prefetch delle immagini critiche dopo un breve delay
    const timer = setTimeout(() => {
      const criticalImages = [
        '/optimized/progetto1/1/thumb.webp',
        '/optimized/progetto2/1/thumb.webp',
        '/optimized/progetto3/1/thumb.webp',
        '/optimized/progetto4/1/thumb.webp',
        '/optimized/progetto5/1/thumb.webp',
        '/optimized/progetto6/1/thumb.webp',
        '/optimized/progetto7/1/thumb.webp'
      ]

      cacheImages(criticalImages)
    }, 1000)

    return () => clearTimeout(timer)
  }, [cacheImages])
}

// Hook per gestire il caching delle immagini durante la navigazione
export function useImageCaching() {
  const { cacheImages } = useServiceWorker()

  const prefetchProjectImages = useCallback((projectSlug: string, count: number) => {
    const urls = Array.from({ length: count }, (_, i) => 
      `/optimized/${projectSlug}/${i + 1}/thumb.webp`
    )
    cacheImages(urls)
  }, [cacheImages])

  const prefetchGalleryImages = useCallback((photos: string[]) => {
    cacheImages(photos)
  }, [cacheImages])

  return {
    prefetchProjectImages,
    prefetchGalleryImages
  }
}
