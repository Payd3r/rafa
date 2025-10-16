import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from './hooks/useTranslation'
import { LanguageToggle } from './components/LanguageToggle'
import { ThemeToggle } from './components/ThemeToggle'
import { useAnimation } from './hooks/useAnimation'

export function Header() {
  const { t } = useTranslation()
  const { ref: headerRef, isVisible } = useAnimation({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-charcoal dark:border-white transition-all duration-500 will-change-transform ${isVisible ? 'fade-in' : 'opacity-0 translate-y-[-20px]'
        }`}
    >
      <div className="max-w-6xl mx-auto pe-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center group transition-transform duration-300 hover:scale-105 will-change-transform"
          aria-label="Home"
        >
          {/* Light: logo standard; Dark: logo bianco */}
          <img
            src="/logo.png"
            alt="INSIDE.FARAOSTUDIO"
            className="h-14 w-auto transition-all duration-300 group-hover:brightness-110 will-change-transform dark:hidden"
          />
          <img
            src="/logo-white.png"
            alt="INSIDE.FARAOSTUDIO"
            className="hidden dark:block h-14 w-auto transition-all duration-300 group-hover:brightness-110 will-change-transform"
          />
        </Link>
        <div className="flex-grow flex justify-center sm:justify-end">
          <nav className="flex gap-4 sm:gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-link transition-all duration-300 hover:text-charcoal dark:hover:text-white will-change-transform ${isActive ? 'text-charcoal dark:text-white font-medium' : 'text-gray700 dark:text-gray-300'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/gallery"
              className={({ isActive }) =>
                `nav-link transition-all duration-300 hover:text-charcoal dark:hover:text-white will-change-transform ${isActive ? 'text-charcoal dark:text-white font-medium' : 'text-gray700 dark:text-gray-300'
                }`
              }
            >
              {t('nav.gallery')}
            </NavLink>
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                `nav-link transition-all duration-300 hover:text-charcoal dark:hover:text-white will-change-transform ${isActive ? 'text-charcoal dark:text-white font-medium' : 'text-gray700 dark:text-gray-300'
                }`
              }
            >
              {t('nav.projects')}
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:ms-4 lg:ms-6">
          {/* Bottoni header: dimensioni uniformi */}
          <div className="h-10 w-10 flex items-center justify-center">
            <ThemeToggle />
          </div>
          <div className="h-10 w-10 flex items-center justify-center">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  )
}


