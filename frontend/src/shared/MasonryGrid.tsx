import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Photo } from './types'
import { PhotoCard } from './PhotoCard'
import { useImageMetaContext } from './contexts/ImageMetaContext'
import { useMasonryLayouts, type MasonryLayout } from './hooks/useMasonryLayouts'

type RowItem = { index: number; ratio: number }
type Row = { height: number; items: RowItem[] }

// Breakpoint disponibili (devono corrispondere a quelli del backend)
const BREAKPOINTS = [320, 375, 768, 1024, 1440]

/**
 * Trova il breakpoint più vicino alla larghezza corrente
 */
function findClosestBreakpoint(width: number): number {
  // Trova il breakpoint più vicino (arrotonda al più vicino, non sempre in basso)
  let closest = BREAKPOINTS[0]
  let minDiff = Math.abs(width - closest)
  
  for (const bp of BREAKPOINTS) {
    const diff = Math.abs(width - bp)
    if (diff < minDiff) {
      minDiff = diff
      closest = bp
    }
  }
  
  return closest
}

/**
 * Scala un layout pre-calcolato alla larghezza corrente
 */
function scaleLayoutToWidth(layout: MasonryLayout, targetWidth: number, breakpointWidth: number, gap: number): Row[] {
  const scale = targetWidth / breakpointWidth
  
  return layout.map(row => {
    // Scala l'altezza proporzionalmente
    const scaledHeight = row.height * scale
    
    // Verifica che le immagini scalate riempiano effettivamente la larghezza
    // (potrebbe essere necessario un aggiustamento fine)
    const sumRatio = row.items.reduce((sum, item) => sum + item.ratio, 0)
    const calculatedWidth = sumRatio * scaledHeight + gap * (row.items.length - 1)
    
    // Se la differenza è minima, usa l'altezza scalata
    // Altrimenti ricalcola l'altezza esatta per riempire la larghezza
    const heightAdjustment = Math.abs(calculatedWidth - targetWidth) / targetWidth
    const finalHeight = heightAdjustment < 0.01 
      ? scaledHeight 
      : (targetWidth - gap * (row.items.length - 1)) / sumRatio
    
    return {
      height: finalHeight,
      items: row.items
    }
  })
}

export function MasonryGrid({ photos, onPhotoClick, maxRows, layoutKey }: { 
  photos: Photo[]; 
  onPhotoClick?: (index: number) => void; 
  maxRows?: number;
  layoutKey?: string;
}) {
  const { imageMeta } = useImageMetaContext()
  const { layouts } = useMasonryLayouts()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  
  // Use pre-calculated ratios from imageMeta instead of waiting for image load
  const ratios = useMemo(() => {
    return photos.map(photo => {
      const meta = imageMeta[photo.src]
      return meta?.ratio || 1.5
    })
  }, [photos, imageMeta])

  // Aggiorna larghezza container con ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width)
        if (w !== containerWidth) setContainerWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerWidth])

  // No need to update ratios - they're pre-calculated from imageMeta

  const gap = useMemo(() => {
    if (containerWidth >= 1024) return 18
    if (containerWidth >= 768) return 14
    return 12
  }, [containerWidth])
  const targetHeight = useMemo(() => {
    const w = containerWidth
    if (w >= 1024) return 280
    if (w >= 768) return 220
    return 160
  }, [containerWidth])

  const rows: Row[] = useMemo(() => {
    if (!containerWidth || photos.length === 0) return []

    // APPROCCIO IBRIDO: Prova a usare layout pre-calcolato, altrimenti calcola dinamicamente
    if (layouts && layoutKey) {
      const layoutConfig = layouts[layoutKey]
      if (layoutConfig) {
        // Trova il breakpoint più vicino
        const closestBreakpoint = findClosestBreakpoint(containerWidth)
        const precomputedLayout = layoutConfig[closestBreakpoint.toString()]
        
        if (precomputedLayout && precomputedLayout.length > 0) {
          // Usa e scala il layout pre-calcolato
          return scaleLayoutToWidth(precomputedLayout, containerWidth, closestBreakpoint, gap)
        }
      }
    }

    // FALLBACK: Calcolo dinamico (algoritmo originale)
    const r: Row[] = []
    let current: RowItem[] = []
    let sumRatio = 0
    const maxScaleUp = 1.35
    const minScaleDown = 0.7

    for (let i = 0; i < photos.length; i++) {
      const ratio = Math.max(0.2, Math.min(4, ratios[i] ?? 1.5))
      current.push({ index: i, ratio })
      sumRatio += ratio
      const rowWidthAtTarget = sumRatio * targetHeight + gap * (current.length - 1)
      if (rowWidthAtTarget >= containerWidth) {
        // calcola altezza che riempie esattamente la riga
        let height = (containerWidth - gap * (current.length - 1)) / sumRatio
        const scale = height / targetHeight
        if (scale > maxScaleUp) height = targetHeight * maxScaleUp
        if (scale < minScaleDown) height = targetHeight * minScaleDown
        r.push({ height, items: current })
        if (maxRows && r.length >= maxRows) {
          return r
        }
        current = []
        sumRatio = 0
      }
    }
    // Ultima riga: gestione diversa se maxRows è specificato
    if (current.length > 0) {
      // Se maxRows è specificato E abbiamo già raggiunto maxRows, NON aggiungere righe incomplete
      if (maxRows && r.length >= maxRows) {
        // Salta l'ultima riga incompleta quando maxRows è già raggiunto
        return r
      }
      
      // Altrimenti, aggiungi l'ultima riga anche se incompleta (se ha almeno 1 immagine)
      if (current.length >= 1) {
        let height = (containerWidth - gap * (current.length - 1)) / sumRatio
        const scale = height / targetHeight
        const maxScaleUp = 1.35
        const minScaleDown = 0.7
        if (scale > maxScaleUp) height = targetHeight * maxScaleUp
        if (scale < minScaleDown) height = targetHeight * minScaleDown
        r.push({ height, items: current })
      }
    }
    return r
  }, [containerWidth, photos, ratios, targetHeight, gap, maxRows, layouts, layoutKey])

  const handleImageLoad = useCallback((_i: number, _e: React.SyntheticEvent<HTMLImageElement>) => {
    // No need to update ratios - they're pre-calculated
    // This callback is kept for compatibility but does nothing
  }, [])

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div style={{ display: 'grid', rowGap: gap }} className="w-full overflow-hidden">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex overflow-hidden" style={{ height: row.height, gap, maxWidth: '100%' }}>
            {row.items.map((it) => {
              const width = it.ratio * row.height
              return (
                <div key={it.index} style={{ width, flexShrink: 0, maxWidth: '100%' }}>
                  <PhotoCard
                    photo={photos[it.index]}
                    onClick={() => onPhotoClick?.(it.index)}
                    onLoad={(e) => handleImageLoad(it.index, e as any)}
                    index={it.index}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}


