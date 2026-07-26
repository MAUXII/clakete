import axios from "axios"

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL =
  process.env.NEXT_PUBLIC_TMDB_BASE_URL || "https://api.themoviedb.org/3"

const TTL_MS = 10 * 60 * 1000
const MAX_ENTRIES = 400

type CacheEntry<T> = { value: T; expiresAt: number }

const movieCastCache = new Map<string, CacheEntry<Set<number>>>()
const personMoviesCache = new Map<string, CacheEntry<Set<number>>>()

function cacheKey(id: number, language: string) {
  return `${id}:${language}`
}

function getCached<T>(
  map: Map<string, CacheEntry<T>>,
  key: string,
): T | null {
  const hit = map.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    map.delete(key)
    return null
  }
  return hit.value
}

function setCached<T>(
  map: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
) {
  if (map.size >= MAX_ENTRIES) {
    const first = map.keys().next().value
    if (first !== undefined) map.delete(first)
  }
  map.set(key, { value, expiresAt: Date.now() + TTL_MS })
}

/** Movie cast person ids (cached per language). */
export async function movieCastIds(
  movieId: number,
  language = "en-US",
): Promise<Set<number>> {
  const key = cacheKey(movieId, language)
  const cached = getCached(movieCastCache, key)
  if (cached) return cached

  const { data } = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits`, {
    params: { api_key: TMDB_API_KEY, language },
  })
  const ids = new Set(
    ((data.cast ?? []) as Array<{ id?: number }>)
      .map((person) => person.id)
      .filter((id): id is number => typeof id === "number"),
  )
  setCached(movieCastCache, key, ids)
  return ids
}

/** Person movie credit ids (cached per language). */
export async function personMovieIds(
  personId: number,
  language = "en-US",
): Promise<Set<number>> {
  const key = cacheKey(personId, language)
  const cached = getCached(personMoviesCache, key)
  if (cached) return cached

  const { data } = await axios.get(
    `${TMDB_BASE_URL}/person/${personId}/movie_credits`,
    { params: { api_key: TMDB_API_KEY, language } },
  )
  const ids = new Set(
    ((data.cast ?? []) as Array<{ id?: number; adult?: boolean }>)
      .filter((m) => m?.id && !m.adult)
      .map((m) => m.id)
      .filter((id): id is number => typeof id === "number"),
  )
  setCached(personMoviesCache, key, ids)
  return ids
}

export function gamesTmdbConfig() {
  return { TMDB_API_KEY, TMDB_BASE_URL }
}
