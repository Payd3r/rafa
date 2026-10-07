import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Photo } from './types'
import { PhotoCard } from './PhotoCard'
import { useImageMetaContext } from './contexts/ImageMetaContext'
import { useMasonryLayouts, type MasonryLayout } from './hooks/useMasonryLayouts'

type RowItem = { index: number; ratio: number }
type Row = { height: number; items: RowItem[] }

// Breakpoint disponibili (devono corrispondere a quelli del backend)
const BREAKPOINTS = [320, 375, 768, 1024, 1440]

// Buffer di virtualizzazione: numero di px sopra e sotto la viewport da tenere montati
const VIRTUALIZATION_BUFFER_PX = 600

/**
 * Trova il breakpoint più vicino alla larghezza corrente
 */
function findClosestBreakpoint(width: number): number {
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
    const scaledHeight = row.height * scale
    const sumRatio = row.items.reduce((sum, item) => sum + item.ratio, 0)
    const calculatedWidth = sumRatio * scaledHeight + gap * (row.items.length - 1)
    const heightAdjustment = Math.abs(calculatedWidth - targetWidth) / targetWidth
    const finalHeight = heightAdjustment < 0.01
      ? scaledHeight
      : (targetWidth - gap * (row.items.length - 1)) / sumRatio

    return { height: finalHeight, items: row.items }
  })
}

export function MasonryGrid({ photos, onPhotoClick, maxRows, layoutKey }: {
  photos: Photo[]
  onPhotoClick?: (index: number) => void
  maxRows?: number
  layoutKey?: string
}) {
  const { imageMeta } = useImageMetaContext()
  const { layouts } = useMasonryLayouts()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  // Stato per virtualizzazione: top offset della viewport rispetto al container
  const [visibleRange, setVisibleRange] = useState<{ top: number; bottom: number }>({
    top: 0,
    bottom: Number.MAX_SAFE_INTEGER
  })

  // Ratios pre-calcolati da imageMeta
  const ratios = useMemo(() => {
    return photos.map(photo => {
      const meta = imageMeta[photo.src]
      return meta?.ratio || 1.5
    })
  }, [photos, imageMeta])

  // ResizeObserver per la larghezza
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

  // IntersectionObserver + scroll per virtualizzazione
  useEffect(() => {
    if (!containerRef.current) return

    const updateVisible = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const viewportTop = -rect.top - VIRTUALIZATION_BUFFER_PX
      const viewportBottom = window.innerHeight - rect.top + VIRTUALIZATION_BUFFER_PX
      setVisibleRange({
        top: Math.max(0, viewportTop),
        bottom: Math.max(0, viewportBottom)
      })
    }

    updateVisible()
    window.addEventListener('scroll', updateVisible, { passive: true })
    window.addEventListener('resize', updateVisible, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateVisible)
      window.removeEventListener('resize', updateVisible)
    }
  }, [])

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

    // APPROCCIO IBRIDO: usa layout pre-calcolato se disponibile
    if (layouts && layoutKey) {
      const layoutConfig = layouts[layoutKey]
      if (layoutConfig) {
        const closestBreakpoint = findClosestBreakpoint(containerWidth)
        const precomputedLayout = layoutConfig[closestBreakpoint.toString()]

        if (precomputedLayout && precomputedLayout.length > 0) {
          return scaleLayoutToWidth(precomputedLayout, containerWidth, closestBreakpoint, gap)
        }
      }
    }

    // FALLBACK: calcolo dinamico
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
        let height = (containerWidth - gap * (current.length - 1)) / sumRatio
        const scale = height / targetHeight
        if (scale > maxScaleUp) height = targetHeight * maxScaleUp
        if (scale < minScaleDown) height = targetHeight * minScaleDown
        r.push({ height, items: current })
        if (maxRows && r.length >= maxRows) return r
        current = []
        sumRatio = 0
      }
    }

    if (current.length > 0) {
      if (maxRows && r.length >= maxRows) return r
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

  // Calcola le posizioni top/bottom di ogni riga (per virtualizzazione)
  const rowPositions = useMemo(() => {
    const positions: { top: number; bottom: number }[] = []
    let top = 0
    for (const row of rows) {
      const bottom = top + row.height
      positions.push({ top, bottom })
      top = bottom + gap
    }
    return positions
  }, [rows, gap])

  const handleImageLoad = useCallback((_i: number, _e: React.SyntheticEvent<HTMLImageElement>) => {
    // No-op: ratios pre-calcolati
  }, [])

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div
        style={{
          display: 'grid',
          rowGap: gap,
          // Altezza totale per mantenere lo scroll corretto anche con righe virtualizzate
          minHeight: rowPositions.length > 0
            ? rowPositions[rowPositions.length - 1].bottom
            : undefined
        }}
        className="w-full overflow-hidden relative"
      >
        {rows.map((row, rIdx) => {
          const pos = rowPositions[rIdx]
          // Virtualizzazione: salta righe fuori dal range visibile (+ buffer)
          const isVisible = !pos || (pos.bottom >= visibleRange.top && pos.top <= visibleRange.bottom)

          if (!isVisible) {
            // Placeholder silenzioso per mantenere layout
            return (
              <div
                key={rIdx}
                style={{ height: row.height, width: '100%' }}
                aria-hidden
              />
            )
          }

          return (
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
          )
        })}
      </div>
    </div>
  )
}
