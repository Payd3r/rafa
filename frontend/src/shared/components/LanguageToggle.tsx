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
      className="h-10 w-10 inline-flex items-center justify-center border border-charcoal dark:border-white bg-transparent dark:bg-transparent hover:bg-charcoal dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
      aria-label={`Switch to ${language === 'it' ? 'English' : 'Italiano'}`}
    >
      <span className="text-sm font-bold">
        {language === 'it' ? 'EN' : 'IT'}
      </span>
    </button>
  )
}
