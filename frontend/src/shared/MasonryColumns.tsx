import { useMemo } from 'react'
import type { Photo } from './types'
import { PhotoCard } from './PhotoCard'

export function MasonryColumns({
  photos,
  onPhotoClick
}: {
  photos: Photo[]
  onPhotoClick?: (index: number) => void
}) {
  const safePhotos = useMemo(() => photos ?? [], [photos])

  return (
    <div className="w-full">
      <div className="columns-1 md:columns-2 lg:columns-3 gap-3 sm:gap-4 md:gap-5">
        {safePhotos.map((p, i) => (
          <div key={p.id ?? i} className="break-inside-avoid mb-3 sm:mb-4 md:mb-5">
            <PhotoCard
              photo={p}
              index={i}
              onClick={() => onPhotoClick?.(i)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}


