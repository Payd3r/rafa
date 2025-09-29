import { useNavigate } from 'react-router-dom'
import type { Project } from './types'
import { useTranslation } from './hooks/useTranslation'
import { useAnimation, useHoverAnimation } from './hooks/useAnimation'
import { usePrefetch } from './hooks/usePrefetch'

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { ref, isVisible } = useAnimation({ 
    threshold: 0.1, 
    triggerOnce: true,
    delay: index * 150 
  })
  const { ref: hoverRef, isHovered } = useHoverAnimation()
  const { prefetchImages } = usePrefetch()

  const handleClick = () => {
    navigate(`/projects/${project.slug}`)
  }

  // Prefetch delle immagini del progetto al hover
  const handleMouseEnter = () => {
    const projectImages = project.gallery.slice(0, 3).map(photo => photo.src)
    prefetchImages(projectImages, { priority: 'high' })
  }

  const handleImageLoad = () => {
    // Image loaded successfully
  }

  return (
    <article 
      ref={ref}
      className={`border border-charcoal bg-white group cursor-pointer card-hover h-[420px] flex flex-col transition-all duration-500 content-visibility-auto ${
        isVisible ? 'fade-in-up' : 'opacity-0 translate-y-8'
      }`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <div 
        ref={hoverRef as React.RefObject<HTMLDivElement>}
        className="relative overflow-hidden flex-none h-64 md:h-72"
      >
        <img 
          src={project.cover.src} 
          alt={project.cover.alt} 
          className="w-full h-full object-cover image-zoom transition-all duration-700 ease-out will-change-transform gpu-accelerated" 
          loading="lazy"
          onLoad={handleImageLoad}
          data-start-time={performance.now()}
        />
        <div className="image-overlay" />
        
        {/* Overlay numero foto - solo su mobile */}
        <div className={`absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium sm:hidden transition-all duration-300 ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}>
          {project.gallery.length} {t('projectDetail.photo')}
        </div>

        {/* Overlay di hover con informazioni */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6`}>
          <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <h4 className="text-lg font-bold mb-2">{project.title}</h4>
            <p className="text-sm opacity-90">
              {project.gallery.length} {t('projectDetail.photo')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        {/* Layout mobile: colonna a sinistra, desktop: anno a destra */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
            <h3 className="h3-title text-lg font-bold transition-colors duration-300 group-hover:text-charcoal">
              {project.title}
            </h3>
          </div>
          <span className="text-sm text-gray400 font-medium mb-1 sm:mb-0 transition-colors duration-300 group-hover:text-charcoal">
            {new Date(project.dateISO).getFullYear()}
          </span>
        </div>

        <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Numero foto - nascosto su mobile, visibile su desktop */}
          <span className="text-xs text-gray400 hidden sm:block transition-colors duration-300 group-hover:text-gray700">
            {project.gallery.length} {t('projectDetail.photo')}
          </span>
          <span className="text-xs text-charcoal font-medium group-hover:text-gray700 transition-all duration-300 group-hover:translate-x-1">
            {t('projectDetail.viewProject')}
          </span>
        </div>
      </div>
    </article>
  )
}


