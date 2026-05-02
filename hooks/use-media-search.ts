import { useEffect, useState } from "react"
import { Movie } from "@/lib/tmdb/client"

export interface SeriesSearchResult {
  id: number
  name: string
  first_air_date?: string
  backdrop_path?: string | null
  poster_path?: string | null
  overview?: string
}

export function useMediaSearch(debouncedQuery: string, enabled: boolean) {
  const [filmResults, setFilmResults] = useState<Movie[]>([])
  const [seriesResults, setSeriesResults] = useState<SeriesSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const fetchResults = async () => {
      setLoading(true)
      try {
        let filmsEndpoint = ""
        let seriesEndpoint = ""
        if (debouncedQuery.trim().length === 0) {
          filmsEndpoint = "/api/movies?type=top_rated"
          seriesEndpoint = "/api/series?type=top_rated"
        } else {
          filmsEndpoint = `/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`
          seriesEndpoint = `/api/series/search?q=${encodeURIComponent(debouncedQuery)}`
        }

        const [filmsResponse, seriesResponse] = await Promise.all([
          fetch(filmsEndpoint),
          fetch(seriesEndpoint),
        ])
        const [filmsData, seriesData] = await Promise.all([filmsResponse.json(), seriesResponse.json()])

        setFilmResults(filmsData.results ? filmsData.results.slice(0, 8) : [])
        setSeriesResults(seriesData.results ? seriesData.results.slice(0, 8) : [])
      } catch (error) {
        console.error("Erro ao buscar resultados:", error)
        setFilmResults([])
        setSeriesResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery, enabled])

  return { filmResults, seriesResults, loading }
}
