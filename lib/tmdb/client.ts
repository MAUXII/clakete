const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export interface Movie {
  id: number
  title: string | null
  poster_path: string | null
  release_date: string | null
  overview: string | null
  vote_average: number | null
  backdrop_path: string | null
  genre_ids: number[] | null

}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[]
  runtime: number
  status: string
  tagline: string | null
}

export async function searchMovies(query: string, page = 1) {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      query
    )}&page=${page}&language=en-US`,
    { cache: 'no-store' }
  )
  return response.json()
}

export async function getPopularMovies(page = 1) {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`,
    { cache: 'no-store' }
  )
  return response.json()
}

export async function getMovieDetails(id: number) {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`,
    { cache: 'no-store' }
  )
  return response.json()
}

export const createTMDBClient = () => {
  return {
    getMovieImages: async (movieId: string) => {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${TMDB_API_KEY}`
      )
      return response.json()
    }
  }
} 