import type { CinemaMovie, CinemasByCityResponse } from "@/types/cinema"
import { getCached, setCached } from "@/lib/cinemas/memory-cache"
import { slugifyCityName } from "@/lib/cinemas/geo"

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL =
  process.env.NEXT_PUBLIC_TMDB_BASE_URL || "https://api.themoviedb.org/3"
const TMDB_IMG = "https://image.tmdb.org/t/p"

type TmdbHit = {
  id: number
  title?: string
  original_title?: string | null
  poster_path?: string | null
  backdrop_path?: string | null
  popularity?: number
  vote_average?: number
}

type TmdbArt = {
  tmdbId: number
  posterUrl: string | null
  backdropUrl: string | null
}

function normalizeTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function scoreMatch(query: string, hit: TmdbHit): number {
  const q = normalizeTitle(query)
  const title = normalizeTitle(hit.title || "")
  const original = normalizeTitle(hit.original_title || "")
  let score = (hit.popularity ?? 0) + (hit.vote_average ?? 0)

  if (title === q || original === q) score += 1000
  else if (title.startsWith(q) || original.startsWith(q)) score += 400
  else if (title.includes(q) || original.includes(q)) score += 150

  return score
}

async function searchTmdbMovie(query: string): Promise<TmdbArt | null> {
  if (!TMDB_API_KEY || !query.trim()) return null

  const cacheKey = `tmdb-art:${slugifyCityName(query)}`
  const cached = getCached<{ art: TmdbArt | null }>(cacheKey)
  if (cached) return cached.art

  try {
    const qs = new URLSearchParams({
      api_key: TMDB_API_KEY,
      query,
      language: "pt-BR",
      include_adult: "false",
      page: "1",
    })
    const res = await fetch(`${TMDB_BASE_URL}/search/movie?${qs}`, {
      next: { revalidate: 60 * 60 },
    })
    if (!res.ok) {
      setCached(cacheKey, { art: null }, 5 * 60 * 1000)
      return null
    }

    const json = (await res.json()) as { results?: TmdbHit[] }
    const results = json.results || []
    if (!results.length) {
      setCached(cacheKey, { art: null }, 30 * 60 * 1000)
      return null
    }

    const best = [...results].sort(
      (a, b) => scoreMatch(query, b) - scoreMatch(query, a),
    )[0]

    const art: TmdbArt = {
      tmdbId: best.id,
      posterUrl: best.poster_path
        ? `${TMDB_IMG}/w500${best.poster_path}`
        : null,
      backdropUrl: best.backdrop_path
        ? `${TMDB_IMG}/original${best.backdrop_path}`
        : null,
    }

    setCached(cacheKey, { art }, 6 * 60 * 60 * 1000)
    return art
  } catch (error) {
    console.warn("[cinemas/tmdb]", query, error)
    return null
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0

  async function run() {
    while (index < items.length) {
      const current = index++
      results[current] = await worker(items[current])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  )
  return results
}

function uniqueMovies(payload: CinemasByCityResponse): CinemaMovie[] {
  const map = new Map<string, CinemaMovie>()
  for (const cinema of payload.cinemas) {
    for (const movie of cinema.movies) {
      if (!map.has(movie.id)) map.set(movie.id, movie)
    }
  }
  return [...map.values()]
}

/**
 * Troca poster/backdrop das fontes de cinema pelas artes do TMDB.
 * Mantém a arte original só se o match falhar.
 */
export async function enrichCinemasWithTmdb(
  payload: CinemasByCityResponse,
): Promise<CinemasByCityResponse> {
  if (!TMDB_API_KEY) return payload

  const movies = uniqueMovies(payload)
  const artByCinemaMovieId = new Map<string, TmdbArt>()

  await mapPool(movies, 5, async (movie) => {
    const query =
      movie.originalTitle?.trim() ||
      movie.title?.trim() ||
      movie.slug?.replace(/-/g, " ") ||
      ""
    if (!query) return

    let art = await searchTmdbMovie(query)
    if (
      !art &&
      movie.originalTitle &&
      movie.title &&
      normalizeTitle(movie.originalTitle) !== normalizeTitle(movie.title)
    ) {
      art = await searchTmdbMovie(movie.title)
    }
    if (art) artByCinemaMovieId.set(movie.id, art)
  })

  if (artByCinemaMovieId.size === 0) return payload

  return {
    ...payload,
    cinemas: payload.cinemas.map((cinema) => ({
      ...cinema,
      movies: cinema.movies.map((movie) => {
        const art = artByCinemaMovieId.get(movie.id)
        if (!art) return movie
        return {
          ...movie,
          tmdbId: art.tmdbId,
          posterUrl: art.posterUrl || movie.posterUrl,
          backdropUrl: art.backdropUrl || movie.backdropUrl || art.posterUrl,
        }
      }),
    })),
  }
}
