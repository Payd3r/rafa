import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project } from './types'
import { useTranslation } from './hooks/useTranslation'
import { useAnimation, useHoverAnimation } from './hooks/useAnimation'
import { usePrefetch } from './hooks/usePrefetch'
import { useImageMetaContext } from './contexts/ImageMetaContext'

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { imageMeta } = useImageMetaContext()
  const { ref, isVisible } = useAnimation({
    threshold: 0.1,
    triggerOnce: true,
    delay: index * 150
  })
  const { ref: hoverRef } = useHoverAnimation()
  const { prefetchImages } = usePrefetch()

  // Progressive loading state per la cover
  const coverMeta = imageMeta[project.cover.src] as { ratio: number; placeholder: string } | undefined
  const [coverSmLoaded, setCoverSmLoaded] = useState(false)
  const [coverLoaded, setCoverLoaded] = useState(false)

  const placeholderSrc = coverMeta?.placeholder || ''
  const coverSmSrc = project.cover.srcSm || project.cover.src
  const coverSrc = project.cover.src

  const handleClick = () => {
    navigate(`/projects/${project.slug}`)
  }

  // Prefetch delle immagini del progetto al hover
  const handleMouseEnter = () => {
    const projectImages = project.gallery.slice(0, 3).map(photo => photo.src)
    prefetchImages(projectImages, { priority: 'high' })
  }

  return (
    <article
      ref={ref}
      className={`border border-charcoal dark:border-white bg-white dark:bg-black group cursor-pointer h-[420px] flex flex-col transition-all duration-500 content-visibility-auto ${
        isVisible ? 'fade-in-up' : 'opacity-0 translate-y-8'
      }`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <div
        ref={hoverRef as React.RefObject<HTMLDivElement>}
        className="relative overflow-hidden flex-none h-64 md:h-72"
      >
        {/* 1. Placeholder Base64 blur */}
        {placeholderSrc && (
          <img
            src={placeholderSrc}
            alt=""
            aria-hidden
            className={`absolute inset-0 w-full h-full object-cover blur-md scale-[1.02] transition-opacity duration-700 ${
              coverLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}

        {/* 2. Cover thumb piccola (400px) */}
        {!coverLoaded && (
          <img
            src={coverSmSrc}
            alt={project.cover.alt}
            className={`absolute inset-0 w-full h-full object-cover image-zoom transition-all duration-700 ease-out will-change-transform ${
              coverSmLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setCoverSmLoaded(true)}
            aria-hidden
          />
        )}

        {/* 3. Cover thumb grande (800px) */}
        <img
          src={coverSrc}
          alt={project.cover.alt}
          className={`absolute inset-0 w-full h-full object-cover image-zoom transition-all duration-700 ease-out will-change-transform gpu-accelerated ${
            coverLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setCoverLoaded(true)}
        />

        <div className="image-overlay" />

        {/* Overlay numero foto - solo su mobile */}
        <div className="absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium sm:hidden">
          {project.gallery.length} {t('projectDetail.photo')}
        </div>

        {/* Overlay di hover con informazioni */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6">
          <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 w-full">
            <h4 className="text-lg font-bold mb-2 break-words hyphens-auto leading-tight">{project.title}</h4>
            <p className="text-sm opacity-90">
              {project.gallery.length} {t('projectDetail.photo')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="h3-title text-lg font-bold transition-colors duration-300 group-hover:text-charcoal dark:group-hover:text-white break-words hyphens-auto leading-tight">
              {project.title}
            </h3>
          </div>
          <span className="text-sm text-gray400 dark:text-gray-600 font-medium flex-shrink-0 transition-colors duration-300 group-hover:text-charcoal dark:group-hover:text-white">
            {new Date(project.dateISO).getFullYear()}
          </span>
        </div>

        <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs text-gray400 dark:text-gray-600 hidden sm:block transition-colors duration-300 group-hover:text-gray700 dark:group-hover:text-gray-300">
            {project.gallery.length} {t('projectDetail.photo')}
          </span>
          <span className="text-xs text-charcoal dark:text-white font-medium group-hover:text-gray700 dark:group-hover:text-gray-300 transition-all duration-300 group-hover:translate-x-1">
            {t('projectDetail.viewProject')}
          </span>
        </div>
      </div>
    </article>
  )
}
