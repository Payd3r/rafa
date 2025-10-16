import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Photo } from './types'
import { PhotoCard } from './PhotoCard'
import { imageMeta } from './data/imageMeta'

type RowItem = { index: number; ratio: number }
type Row = { height: number; items: RowItem[] }

export function MasonryGrid({ photos, onPhotoClick }: { photos: Photo[]; onPhotoClick?: (index: number) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  
  // Use pre-calculated ratios from imageMeta instead of waiting for image load
  const ratios = useMemo(() => {
    return photos.map(photo => {
      const meta = imageMeta[photo.src]
      return meta?.ratio || 1.5
    })
  }, [photos])

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
        current = []
        sumRatio = 0
      }
    }
    if (current.length > 0) {
      // Ultima riga: se ha almeno 2 elementi, giustifica per riempire tutta la larghezza
      if (current.length >= 2) {
        let height = (containerWidth - gap * (current.length - 1)) / sumRatio
        const scale = height / targetHeight
        const maxScaleUp = 1.35
        const minScaleDown = 0.7
        if (scale > maxScaleUp) height = targetHeight * maxScaleUp
        if (scale < minScaleDown) height = targetHeight * minScaleDown
        r.push({ height, items: current })
      } else {
        r.push({ height: targetHeight, items: current })
      }
    }
    return r
  }, [containerWidth, photos, ratios, targetHeight])

  const handleImageLoad = useCallback((_i: number, _e: React.SyntheticEvent<HTMLImageElement>) => {
    // No need to update ratios - they're pre-calculated
    // This callback is kept for compatibility but does nothing
  }, [])

  return (
    <div ref={containerRef} className="w-full">
      <div style={{ display: 'grid', rowGap: gap }}>
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex" style={{ height: row.height, gap }}>
            {row.items.map((it) => {
              const width = it.ratio * row.height
              return (
                <div key={it.index} style={{ width }}>
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


