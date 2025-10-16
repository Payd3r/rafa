import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../shared/Header'
import { Footer } from '../shared/Footer'
import { SectionTitle } from '../shared/SectionTitle'
import { NewsletterBanner } from '../shared/NewsletterBanner'
import { MasonryGrid } from '../shared/MasonryGrid'
import { ProjectCard } from '../shared/ProjectCard'
import { Lightbox } from '../shared/Lightbox'
import { useProjects } from '../shared/hooks/useProjects'
import { useTranslation } from '../shared/hooks/useTranslation'
import { useAnimation } from '../shared/hooks/useAnimation'

export default function Home() {
  const { t } = useTranslation()
  const { projects, loading } = useProjects()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Prendi i primi 4 progetti per la sezione "Migliori progetti"
  const featuredProjects = projects.slice(0, 4)

  // Animazioni per le sezioni
  const { ref: heroRef, isVisible: heroVisible } = useAnimation({ 
    threshold: 0.1, 
    triggerOnce: true 
  })
  const { ref: worksRef, isVisible: worksVisible } = useAnimation({ 
    threshold: 0.1, 
    triggerOnce: true 
  })
  const { ref: projectsRef, isVisible: projectsVisible } = useAnimation({ 
    threshold: 0.1, 
    triggerOnce: true 
  })

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <Header />
      <main>
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className={`section-y border-b border-charcoal dark:border-white transition-all duration-1000 ${
            heroVisible ? 'fade-in-up' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-sm uppercase tracking-wider text-gray700 dark:text-gray-300 mb-2 animate-fade-in">
              {t('home.photographer')}
            </div>
            <h1 className="h1-hero text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in-up">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-4 max-w-2xl text-gray700 dark:text-gray-300 animate-fade-in">
              {t('home.heroDescription')}
            </p>
            <button 
              type="button"
              onClick={() => window.open('https://www.instagram.com/inside.faraostudio/', '_blank', 'noopener,noreferrer')}
              className="btn btn-animated mt-6 group"
              aria-label="Instagram - About me"
            >
              <span className="relative z-10">{t('home.readMore')}</span>
            </button>
          </div>
        </section>

        {/* My Latest Works Section */}
        <section 
          ref={worksRef}
          className={`section-y transition-all duration-1000 ${
            worksVisible ? 'fade-in' : 'opacity-0 translate-y-8'
          }`}
        >
          <SectionTitle title={t('home.myLatestWorks')} />
          <div className="max-w-6xl mx-auto px-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-2 border-charcoal dark:border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <MasonryGrid 
                photos={projects.flatMap(p => p.gallery).slice(0, 8)} 
                onPhotoClick={handlePhotoClick}
              />
            )}
            <div className="text-center mt-8 animate-fade-in-up">
              <Link to="/gallery" className="btn btn-animated w-full sm:w-auto inline-block text-center group">
                <span className="relative z-10">{t('home.seeAllPhotos')}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter Banner */}
        <NewsletterBanner />

        {/* Migliori Progetti Section */}
        <section 
          ref={projectsRef}
          className={`section-y transition-all duration-1000 ${
            projectsVisible ? 'fade-in' : 'opacity-0 translate-y-8'
          }`}
        >
          <SectionTitle title={t('home.bestProjects')} />
          <div className="max-w-6xl mx-auto px-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-2 border-charcoal dark:border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                {featuredProjects.map((project, index) => (
                  <ProjectCard 
                    key={project.slug} 
                    project={project} 
                    index={index}
                  />
                ))}
              </div>
            )}
            
            <div className="text-center mt-8 animate-fade-in-up">
              <Link to="/projects" className="btn btn-animated w-full sm:w-auto inline-block text-center group">
                <span className="relative z-10">{t('home.seeAllProjects')}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={projects.flatMap(p => p.gallery)}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() =>
            setLightboxIndex((i) => (i > 0 ? i - 1 : projects.flatMap(p => p.gallery).length - 1))
          }
          onNext={() =>
            setLightboxIndex((i) => (i < projects.flatMap(p => p.gallery).length - 1 ? i + 1 : 0))
          }
        />
      )}
    </div>
  )
}


