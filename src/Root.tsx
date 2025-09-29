import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { LanguageProvider } from './shared/contexts/LanguageContext'

export default function Root() {
  const location = useLocation()

  useEffect(() => {
    // Scrolla all'inizio ad ogni cambio di percorso
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  )
}


