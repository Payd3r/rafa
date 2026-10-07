import { useState } from 'react'
import type React from 'react'
import type { Photo } from './types'
import { useImageMetaContext } from './contexts/ImageMetaContext'
import { useAnimation, useHoverAnimation } from './hooks/useAnimation'

export function PhotoCard({
  photo,
  onClick,
  onLoad,
  index = 0
}: {
  photo: Photo
  onClick?: () => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  index?: number
}) {
  const { imageMeta } = useImageMetaContext()
  const meta = imageMeta[photo.src] as { ratio: number; placeholder: string } | undefined
  const { ref, isVisible } = useAnimation({
    threshold: 0,
    rootMargin: '300px 0px',
    triggerOnce: true,
    delay: Math.min(index * 60, 240)
  })
  const { ref: hoverRef, isHovered } = useHoverAnimation()
  // Progressive loading: false = thumb-sm caricata, true = thumb grande caricata
  const [thumbSmLoaded, setThumbSmLoaded] = useState(false)
  const [thumbLoaded, setThumbLoaded] = useState(false)

  // Il placeholder è ora Base64 inline dal meta (nessuna richiesta HTTP aggiuntiva)
  const placeholderSrc = meta?.placeholder || photo.placeholder || ''

  // URLs delle thumbnails
  const thumbSmSrc = photo.srcSm || photo.src
  const thumbSrc = photo.src

  const handleSmLoad = () => {
    setThumbSmLoaded(true)
    // Avvia immediatamente il caricamento della thumb grande in background
  }

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setThumbLoaded(true)
    onLoad?.(e)
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      className={`block w-full overflow-hidden rounded-none group transition-all duration-500 content-visibility-auto ${
        isVisible ? 'fade-in' : 'opacity-0 translate-y-4'
      }`}
      aria-label={photo.alt}
    >
      <div
        ref={hoverRef as React.RefObject<HTMLDivElement>}
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: meta ? `${100 / (meta.ratio || 1.5)}%` : undefined }}
      >
        {/* 1. Placeholder Base64 blur (immediato, nessuna richiesta HTTP) */}
        {placeholderSrc && (
          <img
            src={placeholderSrc}
            alt=""
            aria-hidden
            className={`absolute inset-0 w-full h-full object-cover blur-md scale-[1.02] transition-opacity duration-700 ${
              thumbLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ willChange: 'opacity' }}
          />
        )}

        {/* 2. Thumb piccola (400px) — caricata per prima, leggera su mobile */}
        {isVisible && !thumbLoaded && (
          <img
            src={thumbSmSrc}
            alt={photo.alt}
            className={`absolute inset-0 block w-full h-full object-cover transition-opacity duration-500 ${
              thumbSmLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading={index < 4 ? 'eager' : 'lazy'}
            onLoad={handleSmLoad}
            aria-hidden={thumbLoaded}
          />
        )}

        {/* 3. Thumb grande (800px) — caricata dopo la piccola per dettaglio massimo */}
        {isVisible && (
          <img
            src={thumbSrc}
            alt={photo.alt}
            className={`masonry-content absolute inset-0 block w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 will-change-transform gpu-accelerated ${
              thumbLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading={index < 4 ? 'eager' : 'lazy'}
            onLoad={handleLoad}
          />
        )}

        {/* Overlay di hover */}
        <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 will-change-opacity ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />

        {/* Icona di zoom al hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100 will-change-transform">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
            <svg
              className="w-6 h-6 text-charcoal"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </div>
        </div>
      </div>
    </button>
  )
}
