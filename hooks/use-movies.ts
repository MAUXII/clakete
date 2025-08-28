import { Movie } from "@/types/movie"
import { useEffect, useState } from "react"

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch('/api/movies?type=popular')
        const data = await response.json()
        setMovies(data.results || [])
      } catch (error) {
        console.error('Erro ao buscar filmes:', error)
        setMovies([])
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  return { movies, loading }
}