import axios from "axios"

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

// Cache em memória para evitar chamadas repetidas
const movieDirectorCache = new Map<number, string>()
const seriesDirectorCache = new Map<number, string>()

/**
 * Busca o diretor de um filme pelo TMDB id com cache em memória.
 */
export async function getMovieDirector(movieId: number): Promise<string | null> {
  if (movieDirectorCache.has(movieId)) {
    return movieDirectorCache.get(movieId) || null
  }

  if (!TMDB_API_KEY) return null

  try {
    const res = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits`, {
      params: { api_key: TMDB_API_KEY },
      timeout: 3000,
    })
    const director = res.data?.crew?.find(
      (person: { job: string }) => person.job === "Director"
    )?.name as string | undefined

    const result = director || ""
    movieDirectorCache.set(movieId, result)
    return result || null
  } catch {
    return null
  }
}

/**
 * Enriquece uma lista de filmes do TMDB anexando `director` em paralelo.
 */
export async function enrichMoviesWithDirectors<T extends { id: number; director?: string | null }>(
  movies: T[]
): Promise<(T & { director?: string | null })[]> {
  if (!Array.isArray(movies) || movies.length === 0) return movies

  const enriched = await Promise.all(
    movies.map(async (movie) => {
      if (movie.director) return movie
      try {
        const director = await getMovieDirector(movie.id)
        return { ...movie, director: director || null }
      } catch {
        return movie
      }
    })
  )

  return enriched
}

/**
 * Busca criador ou diretor de uma série pelo TMDB id com cache em memória.
 */
export async function getSeriesCreatorOrDirector(seriesId: number): Promise<string | null> {
  if (seriesDirectorCache.has(seriesId)) {
    return seriesDirectorCache.get(seriesId) || null
  }

  if (!TMDB_API_KEY) return null

  try {
    const res = await axios.get(`${TMDB_BASE_URL}/tv/${seriesId}`, {
      params: { api_key: TMDB_API_KEY },
      timeout: 3000,
    })
    const data = res.data
    const creator = data?.created_by?.[0]?.name as string | undefined
    const director = data?.credits?.crew?.find(
      (person: { job: string }) => person.job === "Director" || person.job === "Creator"
    )?.name as string | undefined

    const result = creator || director || ""
    seriesDirectorCache.set(seriesId, result)
    return result || null
  } catch {
    return null
  }
}

/**
 * Enriquece uma lista de séries do TMDB anexando `director` (criador/diretor) em paralelo.
 */
export async function enrichSeriesWithCreators<T extends { id: number; director?: string | null }>(
  seriesList: T[]
): Promise<(T & { director?: string | null })[]> {
  if (!Array.isArray(seriesList) || seriesList.length === 0) return seriesList

  const enriched = await Promise.all(
    seriesList.map(async (show) => {
      if (show.director) return show
      try {
        const director = await getSeriesCreatorOrDirector(show.id)
        return { ...show, director: director || null }
      } catch {
        return show
      }
    })
  )

  return enriched
}
