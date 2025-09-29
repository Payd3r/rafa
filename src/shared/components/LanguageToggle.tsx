import { useTranslation } from '../hooks/useTranslation'
import { useHoverAnimation } from '../hooks/useAnimation'

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation()
  const { ref, isHovered } = useHoverAnimation()

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it')
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={toggleLanguage}
      className="px-3 py-2 border border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
      aria-label={`Switch to ${language === 'it' ? 'English' : 'Italiano'}`}
    >
      <span className="text-sm font-medium">
        {language === 'it' ? 'EN' : 'IT'}
      </span>
    </button>
  )
}
