import { useTheme } from '../contexts/ThemeContext'
import { useHoverAnimation } from '../hooks/useAnimation'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { ref, isHovered } = useHoverAnimation()

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={toggleTheme}
      className="h-10 w-10 inline-flex items-center justify-center border border-charcoal dark:border-white bg-transparent dark:bg-transparent hover:bg-charcoal dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'dark' ? (
        // Icona Sole - quando tema è scuro (clic passa a chiaro)
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
          className={`transition-transform duration-300 ${isHovered ? 'rotate-45' : ''}`}
        >
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/>
          <path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/>
          <path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/>
          <path d="m19.07 4.93-1.41 1.41"/>
        </svg>
      ) : (
        // Icona Luna - quando tema è chiaro (clic passa a scuro)
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
          className={`transition-transform duration-300 ${isHovered ? 'rotate-12' : ''}`}
        >
          <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>
        </svg>
      )}
    </button>
  )
}

