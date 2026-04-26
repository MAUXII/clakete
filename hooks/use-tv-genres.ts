import { useEffect, useState } from 'react'

interface Genre {
  id: number
  name: string
}

export function useTvGenres() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGenres() {
      try {
        const response = await fetch('/api/series/genres')
        const data = await response.json()
        setGenres(data.genres)
      } catch (error) {
        console.error('Erro ao buscar gêneros (tv):', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGenres()
  }, [])

  const getGenreNames = (genreIds: number[]) => {
    return genres
      .filter((genre) => genreIds.includes(genre.id))
      .map((genre) => ({ id: genre.id, name: genre.name }))
  }

  return { genres, loading, getGenreNames }
}
