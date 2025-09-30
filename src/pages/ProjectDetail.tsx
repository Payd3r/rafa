import { Header } from '../shared/Header'
import { Footer } from '../shared/Footer'
import { MasonryGrid } from '../shared/MasonryGrid'
import { Lightbox } from '../shared/Lightbox'
import { useParams, Link } from 'react-router-dom'
import { projects } from '../shared/data/projects'
import { useMemo, useState } from 'react'
import { useTranslation } from '../shared/hooks/useTranslation'

export default function ProjectDetail() {
  const { t, language } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const project = useMemo(() => projects.find((p) => p.slug === slug), [slug])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  
  if (!project) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header />
        <main className="section-y max-w-6xl mx-auto px-4 text-center">
          <h1 className="h2-title mb-4">{t('projectDetail.notFound')}</h1>
          <p className="text-gray700 mb-8">{t('projectDetail.notFoundDescription')}</p>
          <Link to="/projects" className="btn">
            {t('projectDetail.backToProjects')}
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <main className="section-y max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link to="/projects" className="text-gray500 hover:text-charcoal transition-colors">
            {t('projectDetail.backToProjectsLink')}
          </Link>
        </nav>

        {/* Header del progetto */}
        <header className="mb-12">
          <h1 className="h1-hero mb-4">{project.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <time className="text-lg text-gray700 font-medium">
              {new Date(project.dateISO).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <span className="text-sm text-gray500">
              {project.gallery.length} {t('projectDetail.photos')}
            </span>
          </div>
          <p className="text-lg text-gray700 leading-relaxed max-w-4xl">
            {t(`projectDescriptions.${project.slug}`) || project.description}
          </p>
        </header>

        {/* Galleria masonry */}
        <section>
          <h2 className="sr-only">{t('gallery.title')}</h2>
          <MasonryGrid 
            photos={project.gallery} 
            onPhotoClick={(idx) => setLightboxIndex(idx)} 
          />
        </section>

        {/* Lightbox */}
        <Lightbox
          photos={project.gallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i! > 0 ? (i as number) - 1 : i))}
          onNext={() =>
            setLightboxIndex((i) => (i! < project.gallery.length - 1 ? (i as number) + 1 : i))
          }
        />
      </main>
      <Footer />
    </div>
  )
}


