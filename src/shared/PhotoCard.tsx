import type React from 'react'
import type { Photo } from './types'
import { imageMeta } from './data/imageMeta.ts'
import { useAnimation, useHoverAnimation } from './hooks/useAnimation'

export function PhotoCard({ 
  photo, 
  onClick, 
  onLoad, 
  index = 0 
}: { 
  photo: Photo; 
  onClick?: () => void; 
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  index?: number;
}) {
  const meta = imageMeta[photo.src] as { ratio: number; placeholder: string } | undefined
  const { ref, isVisible } = useAnimation({ 
    threshold: 0.1, 
    triggerOnce: true,
    delay: index * 100 
  })
  const { ref: hoverRef, isHovered } = useHoverAnimation()
  
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    onLoad?.(e)
  }

  return (
    <button 
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={onClick} 
      className={`block w-full overflow-hidden border border-charcoal rounded-none group transition-all duration-500 hover:shadow-2xl hover:shadow-charcoal/20 content-visibility-auto ${
        isVisible ? 'fade-in' : 'opacity-0 translate-y-4'
      }`} 
      aria-label={photo.alt}
    >
      <div
        ref={hoverRef as React.RefObject<HTMLDivElement>}
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: meta ? `${100 / (meta.ratio || 1.5)}%` : undefined }}
      >
        {/* Placeholder blur */}
        {meta && (
          <img
            src={meta.placeholder}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover blur-md scale-[1.02] transition-all duration-700"
          />
        )}
        
        {/* Immagine principale con lazy loading nativo */}
        <img
          src={photo.src}
          alt={photo.alt}
          className="masonry-content absolute inset-0 block w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 will-change-transform gpu-accelerated image-lazy loaded"
          loading="lazy"
          srcSet={photo.srcset}
          sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
          onLoad={handleLoad}
        />
        
        {/* Overlay di hover */}
        <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 will-change-opacity ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
        
        {/* Icona di zoom al hover */}
        <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100 will-change-transform`}>
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


