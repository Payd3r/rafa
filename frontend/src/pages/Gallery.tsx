import { Header } from '../shared/Header'
import { Footer } from '../shared/Footer'
import { MasonryColumns } from '../shared/MasonryColumns'
import { Lightbox } from '../shared/Lightbox'
import { useState } from 'react'
import { useProjects } from '../shared/hooks/useProjects'
import { useTranslation } from '../shared/hooks/useTranslation'
import { useImageMetaContext } from '../shared/contexts/ImageMetaContext'

export default function Gallery() {
  const { t } = useTranslation()
  const { projects, loading } = useProjects()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { imageMeta } = useImageMetaContext()
  const photos = projects
    .flatMap((p) => p.gallery)
    .filter((photo) => imageMeta[photo.src]?.isBest === true)
  
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <Header />
      <main className="section-y max-w-6xl mx-auto px-4">
        <h1 className="h2-title text-center mb-8">{t('gallery.title')}</h1>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-charcoal dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MasonryColumns
            photos={photos}
            onPhotoClick={(idx) => setLightboxIndex(idx)}
          />
        )}
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex((i) => {
              if (i === null) return i
              return i > 0 ? i - 1 : photos.length - 1
            })
          }
          onNext={() =>
            setLightboxIndex((i) => {
              if (i === null) return i
              return i < photos.length - 1 ? i + 1 : 0
            })
          }
        />
      </main>
      <Footer />
    </div>
  )
}


