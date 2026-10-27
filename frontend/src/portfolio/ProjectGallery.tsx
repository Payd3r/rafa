import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Photo } from '../shared/types'
import { SmartImage } from './SmartImage'
import { masonryLayout } from './masonry'

type Metrics = { width: number; gap: number; columns: number }
export function ProjectGallery({photos, onOpen}: {photos: Photo[]; onOpen: (index: number, orderedPhotos: Photo[]) => void}) {
  const canvas = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  useLayoutEffect(() => {
    const element = canvas.current
    if (!element) return
    const measure = () => {
      const mobile = window.matchMedia('(max-width:760px)').matches
      const next = {
        width: element.getBoundingClientRect().width,
        gap: mobile ? 10 : 18,
        columns: window.matchMedia('(min-width:1440px)').matches ? 3 : 2,
      }
      setMetrics(previous => previous && Object.keys(next).every(key => previous[key as keyof Metrics] === next[key as keyof Metrics]) ? previous : next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  const layout = useMemo(() => metrics && metrics.width > 0 ? masonryLayout(photos, metrics.width, metrics.gap, metrics.columns) : null, [photos, metrics])
  const order = layout?.order || photos.map((_, index) => index)
  const orderedPhotos = order.map(index => photos[index])
  return <section className="project-gallery ratio-gallery" id="photos" aria-label="Fotografie del progetto">
    <div ref={canvas} className="masonry-canvas" style={layout ? {position:'relative', height:layout.height} : undefined}>
      {order.map((index, visualIndex) => {
        const photo = photos[index]
        const item = layout?.items[index]
        return <figure key={photo.id} className="photo" data-photo-column={item?.column} data-photo-span={item?.span} data-photo-index={index} style={item ? {position:'absolute', left:item.left, top:item.top, width:item.width, height:item.height} : undefined}>
          <button className="photo-button" onClick={() => onOpen(visualIndex, orderedPhotos)} aria-label={`Apri fotografia ${visualIndex + 1}`}>
            <SmartImage photo={photo} priority={visualIndex < 2} fit="contain" sizes={item ? `${Math.ceil(item.width)}px` : '(max-width:760px) 88vw, 92vw'} />
          </button>
        </figure>
      })}
    </div>
  </section>
}
