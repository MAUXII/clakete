import { Series } from '@/types/series'
import { useEffect, useState } from 'react'

export function useSeries() {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSeries() {
      try {
        const response = await fetch('/api/series?type=popular')
        const data = await response.json()
        setSeries(data.results || [])
      } catch (error) {
        console.error('Erro ao buscar séries:', error)
        setSeries([])
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [])

  return { series, loading }
}
