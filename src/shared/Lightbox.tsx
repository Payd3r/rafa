import { useEffect, useRef } from 'react'
import type { Photo } from './types'

export function Lightbox({ photos, index, onClose, onPrev, onNext }: { photos: Photo[]; index: number | null; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

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
    return () => overlay.removeEventListener('keydown', trap as any)
  }, [index])

  if (index === null) return null
  const current = photos[index]
  const resolveFull = (p: Photo | undefined) => {
    if (!p) return undefined
    if (p.src.startsWith('/optimized/') && p.src.endsWith('/thumb.webp')) {
      // Prefer original.webp if present, fallback to original.jpg
      const base = p.src.slice(0, -'thumb.webp'.length)
      return `${base}original.webp`
    }
    // fallback: try from srcset picking the last candidate
    if (p.srcset) {
      const parts = p.srcset.split(',').map(s => s.trim().split(' ')[0])
      return parts[parts.length - 1] || p.src
    }
    return p.src
  }
  const currentFull = resolveFull(current)!

  // Prefetch adiacenti
  const prev = photos[index - 1]
  const next = photos[index + 1]
  const prevFull = resolveFull(prev)
  const nextFull = resolveFull(next)

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
    >
      {prevFull && <link rel="prefetch" as="image" href={prevFull} />}
      {nextFull && <link rel="prefetch" as="image" href={nextFull} />}
      <button
        ref={closeBtnRef}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white text-black border-2 border-black px-3 py-2 sm:px-3 sm:py-1 shadow-md text-lg transition-all duration-300 hover:scale-110 hover:bg-gray-100 hover:shadow-lg"
        onClick={onClose}
        aria-label="Chiudi"
      >
        ×
      </button>
      <img
        src={currentFull}
        alt={current.alt}
        className="lightbox-content object-contain transition-all duration-500 ease-out"
        style={{
          maxWidth: '95svw',
          maxHeight: '78svh'
        }}
      />
      {/* Barra controlli in basso: Prev | Download | Next */}
      <div className="absolute left-4 right-4 sm:inset-x-0 bottom-4 sm:bottom-6 flex items-center justify-center gap-2 sm:gap-3">
        <button
          className="bg-white text-black border-2 border-black px-3 py-2 sm:px-4 sm:py-2 shadow-md text-xl h-10 leading-none flex items-center justify-center"
          onClick={onPrev}
          aria-label="Precedente"
        >
          ‹
        </button>
        <a
          className="bg-white text-black border-2 border-black px-4 py-2 sm:px-4 sm:py-2 text-center shadow-md w-full sm:w-auto min-w-[120px] h-10 leading-none flex items-center justify-center"
          href={current.originalUrl}
          download
          aria-label="Scarica immagine originale"
        >
          Download
        </a>
        <button
          className="bg-white text-black border-2 border-black px-3 py-2 sm:px-4 sm:py-2 shadow-md text-xl h-10 leading-none flex items-center justify-center"
          onClick={onNext}
          aria-label="Successiva"
        >
          ›
        </button>
      </div>
    </div>
  )
}


