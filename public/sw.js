// Service Worker per caching intelligente
const CACHE_NAME = 'farao-studio-v2'
const STATIC_CACHE = 'static-v2'
const IMAGE_CACHE = 'images-v2'
const API_CACHE = 'api-v2'

// Risorse da cachare immediatamente
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/logo-white.png'
]

// Strategie di caching
const CACHE_STRATEGIES = {
  // Cache first per risorse statiche
  CACHE_FIRST: 'cache-first',
  // Network first per API
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate per immagini
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Installa il service worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing...')
  
  event.waitUntil(
    Promise.allSettled([
      // Cache delle risorse statiche con gestione errori
      caches.open(STATIC_CACHE).then(cache => {
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(error => {
              console.warn('SW: Failed to cache static asset:', url, error)
              return Promise.resolve()
            })
          )
        )
      }),
      // Prefetch delle immagini critiche
      caches.open(IMAGE_CACHE).then(cache => {
        const criticalImages = [
          '/optimized/progetto1/1/thumb.webp',
          '/optimized/progetto2/1/thumb.webp',
          '/optimized/progetto3/1/thumb.webp',
          '/optimized/progetto4/1/thumb.webp',
          '/optimized/progetto5/1/thumb.webp',
          '/optimized/progetto6/1/thumb.webp',
          '/optimized/progetto7/1/thumb.webp'
        ]
        
        return Promise.allSettled(
          criticalImages.map(url => 
            fetch(url).then(response => 
              response.ok ? cache.put(url, response) : Promise.resolve()
            ).catch(() => Promise.resolve()) // Ignora errori di fetch
          )
        )
      }),
      self.skipWaiting()
    ]).then(() => {
      console.log('SW: Installation completed')
    }).catch(error => {
      console.error('SW: Installation failed:', error)
    })
  )
})

// Attiva il service worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...')
  
  event.waitUntil(
    Promise.all([
      // Pulisci cache vecchie
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes('v2')) {
              console.log('SW: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      self.clients.claim()
    ]).then(() => {
      console.log('SW: Activation completed')
    }).catch(error => {
      console.error('SW: Activation failed:', error)
    })
  )
})

// Gestisce le richieste
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension e altri protocolli
  if (!url.protocol.startsWith('http')) return

  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Strategia per immagini
  if (isImageRequest(url)) {
    return handleImageRequest(request)
  }
  
  // Strategia per API
  if (isApiRequest(url)) {
    return handleApiRequest(request)
  }
  
  // Strategia per risorse statiche
  return handleStaticRequest(request)
}

function isImageRequest(url) {
  return url.pathname.includes('/optimized/') || 
         url.pathname.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname !== self.location.hostname
}

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE)
  
  // Stale while revalidate per immagini
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    // Ritorna la versione cached e aggiorna in background
    fetchAndCache(request, cache)
    return cachedResponse
  }
  
  // Se non in cache, fetcha e cachia
  return fetchAndCache(request, cache)
}

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE)
  
  try {
    // Network first per API
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Fallback alla cache se la rete fallisce
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE)
  
  // Cache first per risorse statiche
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Se non in cache, fetcha e cachia
  return fetchAndCache(request, cache)
}

async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('SW: Fetch failed:', error)
    throw error
  }
}

// Gestisce i messaggi dal client
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_IMAGES':
      cacheImages(payload.urls)
      break
      
    case 'CLEAR_CACHE':
      clearCache(payload.cacheName)
      break
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size })
      })
      break
  }
})

async function cacheImages(urls) {
  const cache = await caches.open(IMAGE_CACHE)
  
  const promises = urls.map(async (url) => {
    try {
      const response = await fetch(url)
      if (response.ok) {
        await cache.put(url, response)
      }
    } catch (error) {
      console.warn('SW: Failed to cache image:', url, error)
    }
  })
  
  await Promise.allSettled(promises)
}

async function clearCache(cacheName) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  await Promise.all(keys.map(key => cache.delete(key)))
}

async function getCacheSize() {
  const caches = await caches.keys()
  let totalSize = 0
  
  for (const cacheName of caches) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    
    for (const key of keys) {
      const response = await cache.match(key)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }
  
  return totalSize
}

// Prefetch delle immagini critiche al primo caricamento
// Questo viene gestito nel primo event listener install
