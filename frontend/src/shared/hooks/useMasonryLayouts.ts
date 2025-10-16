import { useState, useEffect } from 'react'

type RowItem = { index: number; ratio: number }
type Row = { height: number; items: RowItem[] }

export type MasonryLayout = Row[]
export type BreakpointLayouts = Record<string, MasonryLayout>
export type MasonryLayoutsData = Record<string, BreakpointLayouts>

/**
 * Hook per caricare i layout masonry pre-calcolati da /masonryLayouts.json
 */
export function useMasonryLayouts() {
  const [layouts, setLayouts] = useState<MasonryLayoutsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/masonryLayouts.json')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setLayouts(data)
      } catch (err) {
        console.warn('Layout pre-calcolati non disponibili, verrà usato il calcolo dinamico:', err)
        setLayouts(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLayouts()
  }, [])

  return { layouts, loading }
}

