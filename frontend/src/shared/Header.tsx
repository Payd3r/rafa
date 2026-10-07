import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from './hooks/useTranslation'
import { LanguageToggle } from './components/LanguageToggle'
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
            <a
              href="https://www.instagram.com/inside.faraostudio/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 w-10 inline-flex items-center justify-center border border-charcoal dark:border-white bg-transparent dark:bg-transparent hover:bg-charcoal dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
          <div className="h-10 w-10 flex items-center justify-center">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  )
}


