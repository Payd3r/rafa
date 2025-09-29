import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Root from './Root'
// LanguageProvider spostato in Root per evitare mismatch durante lazy-loading
import './style.css'

// Assicurati che React sia disponibile globalmente
if (typeof window !== 'undefined') {
  (window as any).React = React
}

// Registra il service worker per il caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Lazy con retry per gestire errori di rete/cache temporanei
function lazyWithRetry<T extends React.ComponentType<any>>(importer: () => Promise<{ default: T }>) {
  const MAX_RETRIES = 2
  let retries = 0
  return React.lazy(async () => {
    while (true) {
      try {
        return await importer()
      } catch (e) {
        if (retries >= MAX_RETRIES) throw e
        retries++
        // attende e riprova
        await new Promise(r => setTimeout(r, 300 * retries))
      }
    }
  })
}

const Home = lazyWithRetry(() => import('./pages/Home'))
const Gallery = lazyWithRetry(() => import('./pages/Gallery'))
const Projects = lazyWithRetry(() => import('./pages/Projects'))
const ProjectDetail = lazyWithRetry(() => import('./pages/ProjectDetail'))

function RouteError() {
  return (
    <div className="p-8 text-center">
      <h1 className="h2-title mb-2">Qualcosa è andato storto</h1>
      <p className="text-gray700">Riprova a ricaricare la pagina.</p>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/gallery', element: <Gallery /> },
      { path: '/projects', element: <Projects /> },
      { path: '/projects/:slug', element: <ProjectDetail /> },
    ]
  }
])

const rootElement = document.getElementById('app')!
createRoot(rootElement).render(
  <React.StrictMode>
    <React.Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spin w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray700 animate-pulse">Caricamento…</p>
        </div>
      </div>
    }>
      <RouterProvider router={router} />
    </React.Suspense>
  </React.StrictMode>
)


