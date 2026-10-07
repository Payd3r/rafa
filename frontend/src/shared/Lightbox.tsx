import { useEffect, useRef, useState } from 'react'
import type { Photo } from './types'
import { useImagePreloader } from './hooks/useImagePreloader'
import { useImageMetaContext } from './contexts/ImageMetaContext'

export function Lightbox({ photos, index, onClose, onPrev, onNext }: { photos: Photo[]; index: number | null; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const { imageMeta } = useImageMetaContext()
  
  // Stati di caricamento per il caricamento progressivo
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [fullLoaded, setFullLoaded] = useState(false)

  // Calcola i path delle immagini da precaricare (PRIMA del return condizionale)
  const current = index !== null ? photos[index] : undefined
  
  // Reset stati quando cambia l'immagine
  useEffect(() => {
    setThumbLoaded(false)
    setFullLoaded(false)
  }, [index])

  useEffect(() => {
    if (index === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [index, onClose, onPrev, onNext])

  useEffect(() => {
    if (index === null) return
    closeBtnRef.current?.focus()
  }, [index])

  // Blocca lo scroll della pagina quando la lightbox è aperta
  useEffect(() => {
    if (index === null) return
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevOverscroll = body.style.overscrollBehavior
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'contain'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.overscrollBehavior = prevOverscroll
    }
  }, [index])

  useEffect(() => {
    if (!overlayRef.current) return
    const overlay = overlayRef.current
    const focusable = overlay.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    overlay.addEventListener('keydown', trap as any)
    return () => overlay.addEventListener('keydown', trap as any)
  }, [index])

  const resolveFull = (p: Photo | undefined) => {
    if (!p) return undefined
    // Usa l'originalUrl direttamente se disponibile (già punta a original.avif)
    if (p.originalUrl) return p.originalUrl
    // Fallback: sostituisce thumb con original nella struttura AVIF
    if (p.src.includes('/thumb.avif')) {
      return p.src.replace('/thumb.avif', '/original.avif')
    }
    if (p.src.includes('/thumb-sm.avif')) {
      return p.src.replace('/thumb-sm.avif', '/original.avif')
    }
    // Legacy WebP fallback
    if (p.src.startsWith('/optimized/') && p.src.endsWith('/thumb.webp')) {
      const base = p.src.slice(0, -'thumb.webp'.length)
      return `${base}original.webp`
    }
    if (p.srcset) {
      const parts = p.srcset.split(',').map(s => s.trim().split(' ')[0])
      return parts[parts.length - 1] || p.src
    }
    return p.src
  }
  
  const currentFull = current ? resolveFull(current) : undefined
  const prev = index !== null ? photos[index - 1] : undefined
  const next = index !== null ? photos[index + 1] : undefined
  const prevFull = resolveFull(prev)
  const nextFull = resolveFull(next)
  
  const meta = current ? imageMeta[current.src] : undefined
  const placeholderSrc = meta?.placeholder || current?.placeholder || ''

  // Precarica immagini in modo imperativo per una navigazione fluida
  useImagePreloader(currentFull || '', prevFull, nextFull, index !== null && !!currentFull)

  if (index === null) return null

  return (
    <div
      ref={overlayRef}
      className="lightbox-backdrop fixed inset-0 bg-black/90 z-50 p-2 sm:p-4 flex items-center justify-center overflow-hidden touch-pan-y"
      role="dialog"
      aria-modal
      aria-label="Immagine a schermo intero"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
      }}
      onClick={(e) => {
        // Chiudi solo se il clic è esattamente sullo sfondo (non sui figli)
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {prevFull && <link rel="prefetch" as="image" href={prevFull} />}
      {nextFull && <link rel="prefetch" as="image" href={nextFull} />}
      <button
        ref={closeBtnRef}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white px-3 py-2 sm:px-3 sm:py-1 shadow-md text-lg transition-all duration-300 hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-900 hover:shadow-lg z-20"
        onClick={onClose}
        aria-label="Chiudi"
      >
        ×
      </button>

      {/* Contenitore Immagini Progressive */}
      <div 
        className="relative flex items-center justify-center w-full h-full max-w-[95svw] max-h-[78svh]"
        onClick={(e) => {
          // Chiudi anche se si clicca "sopra/sotto" l'immagine ma dentro il container
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        {/* 1. Placeholder Base64 blur */}
        {placeholderSrc && (
          <img
            src={placeholderSrc}
            alt=""
            aria-hidden
            className={`absolute inset-0 m-auto max-w-full max-h-full object-contain blur-xl transition-opacity duration-700 ${
              fullLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}

        {/* 2. Thumb (800px) - veloce da caricare */}
        {!fullLoaded && (
          <img
            src={current!.src}
            alt=""
            aria-hidden
            className={`absolute inset-0 m-auto max-w-full max-h-full object-contain transition-opacity duration-500 ${
              thumbLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setThumbLoaded(true)}
          />
        )}

        {/* 3. Original (full res) - alta qualità */}
        <img
          src={currentFull!}
          alt={current!.alt}
          className={`relative max-w-full max-h-full object-contain transition-opacity duration-700 ease-out preserve-3d will-change-opacity ${
            fullLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setFullLoaded(true)}
        />
      </div>

      {/* Barra controlli in basso */}
      <div 
        className="absolute left-4 right-4 sm:inset-x-0 bottom-4 sm:bottom-6 flex items-center justify-center gap-2 sm:gap-3 z-20"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <button
          className="bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white px-3 py-2 sm:px-4 sm:py-2 shadow-md text-xl h-10 leading-none flex items-center justify-center transition-colors duration-300"
          onClick={onPrev}
          aria-label="Precedente"
        >
          ‹
        </button>

        <button
          className="bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white px-3 py-2 sm:px-4 sm:py-2 shadow-md text-xl h-10 leading-none flex items-center justify-center transition-colors duration-300"
          onClick={onNext}
          aria-label="Successiva"
        >
          ›
        </button>
      </div>
    </div>
  )
}



