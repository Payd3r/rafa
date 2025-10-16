import { useState, useEffect } from 'react'
import type { Project } from '../types'

/**
 * Hook per caricare progetti da /projects.json
 * Aggiorna automaticamente quando il file cambia
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await fetch('/projects.json')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setProjects(data)
        setError(null)
      } catch (err) {
        console.error('Errore caricamento progetti:', err)
        setError(err instanceof Error ? err : new Error('Errore sconosciuto'))
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return { projects, loading, error }
}

