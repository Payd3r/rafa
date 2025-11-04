import { Header } from '../shared/Header'
import { Footer } from '../shared/Footer'
import { MasonryGrid } from '../shared/MasonryGrid'
import { Lightbox } from '../shared/Lightbox'
import { VideoCard } from '../shared/VideoCard'
import { useParams, Link } from 'react-router-dom'
import { useProjects } from '../shared/hooks/useProjects'
import { useMemo, useState } from 'react'
import { useTranslation } from '../shared/hooks/useTranslation'

export default function ProjectDetail() {
  const { t, language } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const { projects, loading } = useProjects()
  const project = useMemo(() => projects.find((p) => p.slug === slug), [slug, projects])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <Header />
        <main className="section-y max-w-6xl mx-auto px-4 text-center">
          <div className="inline-block w-8 h-8 border-2 border-charcoal dark:border-white border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <Header />
        <main className="section-y max-w-6xl mx-auto px-4 text-center">
          <h1 className="h2-title mb-4">{t('projectDetail.notFound')}</h1>
          <p className="text-gray700 dark:text-gray-300 mb-8">{t('projectDetail.notFoundDescription')}</p>
          <Link to="/projects" className="btn">
            {t('projectDetail.backToProjects')}
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <Header />
      <main className="section-y max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link to="/projects" className="text-gray700 dark:text-gray-300 hover:text-charcoal dark:hover:text-white transition-colors">
            {t('projectDetail.backToProjectsLink')}
          </Link>
        </nav>

        {/* Header del progetto */}
        <header className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="h1-hero flex-1">{project.title}</h1>
            {project.instagramUrl && (
              <a
                href={project.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 mt-2 text-charcoal dark:text-white hover:opacity-70 transition-opacity"
                aria-label="Vai al post Instagram"
              >
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <time className="text-lg text-gray700 dark:text-gray-300 font-medium">
              {new Date(project.dateISO).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <span className="text-sm text-gray700 dark:text-gray-300">
              {project.gallery.length} {t('projectDetail.photos')}
            </span>
          </div>
          <p className="text-lg text-gray700 dark:text-gray-300 leading-relaxed max-w-4xl">
            {project.description}
          </p>
        </header>

        {/* Video (se presente) */}
        {project.video && (
          <section className="mb-12">
            <VideoCard 
              src={project.video.src}
              thumbnail={project.video.thumbnail}
              alt={project.video.alt}
            />
          </section>
        )}

        {/* Galleria masonry */}
        <section>
          <h2 className="sr-only">{t('gallery.title')}</h2>
          <MasonryGrid 
            photos={project.gallery} 
            onPhotoClick={(idx) => setLightboxIndex(idx)}
            layoutKey={`project-${project.slug}`}
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


