import { useEffect, useState } from "react"
import { useLocalePrefs } from "@/hooks/use-locale-prefs"

interface Genre {
  id: number;
  name: string;
}

export function useGenres() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const { tmdbLanguage, loading: localeLoading } = useLocalePrefs()

  useEffect(() => {
    if (localeLoading) return

    async function fetchGenres() {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/movies/genres?language=${encodeURIComponent(tmdbLanguage)}`,
        )
        const data = await response.json()
        setGenres(data.genres)
      } catch (error) {
        console.error('Erro ao buscar gêneros:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchGenres()
  }, [tmdbLanguage, localeLoading])

  const getGenreNames = (genreIds: number[]) => {
    return genres
      .filter(genre => genreIds.includes(genre.id))
      .map(genre => ({ id: genre.id, name: genre.name }))
  }

  return { genres, loading, getGenreNames }
}
