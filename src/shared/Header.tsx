import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from './hooks/useTranslation'
import { LanguageToggle } from './components/LanguageToggle'
import { useAnimation } from './hooks/useAnimation'
import { usePrefetch } from './hooks/usePrefetch'

export function Header() {
  const { t } = useTranslation()
  const { ref: headerRef, isVisible } = useAnimation({
    threshold: 0.1,
    triggerOnce: true
  })
  const { prefetchOnHover } = usePrefetch()

  // Prefetch delle immagini della gallery al hover
  const handleGalleryHover = (element: HTMLAnchorElement | null) => {
    if (!element) return

    const galleryImages = [
      '/optimized/progetto1/1/thumb.webp',
      '/optimized/progetto1/2/thumb.webp',
      '/optimized/progetto1/3/thumb.webp',
      '/optimized/progetto2/1/thumb.webp',
      '/optimized/progetto2/2/thumb.webp',
      '/optimized/progetto3/1/thumb.webp',
      '/optimized/progetto4/1/thumb.webp',
      '/optimized/progetto5/1/thumb.webp'
    ]

    return prefetchOnHover(galleryImages, element)
  }

  // Prefetch delle immagini dei progetti al hover
  const handleProjectsHover = (element: HTMLAnchorElement | null) => {
    if (!element) return

    const projectImages = [
      '/optimized/progetto1/1/thumb.webp',
      '/optimized/progetto2/1/thumb.webp',
      '/optimized/progetto3/1/thumb.webp',
      '/optimized/progetto4/1/thumb.webp',
      '/optimized/progetto5/1/thumb.webp',
      '/optimized/progetto6/1/thumb.webp',
      '/optimized/progetto7/1/thumb.webp'
    ]

    return prefetchOnHover(projectImages, element)
  }

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-charcoal transition-all duration-500 will-change-transform ${isVisible ? 'fade-in' : 'opacity-0 translate-y-[-20px]'
        }`}
    >
      <div className="max-w-6xl mx-auto pe-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center group transition-transform duration-300 hover:scale-105 will-change-transform"
          aria-label="Home"
        >
          <img
            src="/logo.png"
            alt="INSIDE.FARAOSTUDIO"
            className="h-14 w-auto transition-all duration-300 group-hover:brightness-110 will-change-transform"
          />
        </Link>
        <div className="flex-grow flex justify-center sm:justify-end">
          <nav className="flex gap-4 sm:gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-link transition-all duration-300 hover:text-charcoal will-change-transform ${isActive ? 'text-charcoal font-medium' : 'text-gray700'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/gallery"
              ref={handleGalleryHover}
              className={({ isActive }) =>
                `nav-link transition-all duration-300 hover:text-charcoal will-change-transform ${isActive ? 'text-charcoal font-medium' : 'text-gray700'
                }`
              }
            >
              {t('nav.gallery')}
            </NavLink>
            <NavLink
              to="/projects"
              ref={handleProjectsHover}
              className={({ isActive }) =>
                `nav-link transition-all duration-300 hover:text-charcoal will-change-transform ${isActive ? 'text-charcoal font-medium' : 'text-gray700'
                }`
              }
            >
              {t('nav.projects')}
            </NavLink>
          </nav>
        </div>
        <div className="sm:block sm:ms-4 lg:ms-6">
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}


