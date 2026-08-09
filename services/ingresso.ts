import type {
  Cinema,
  CinemaCity,
  CinemaMovie,
  CinemaSession,
  CinemasByCityResponse,
} from "@/types/cinema"
import { getCached, setCached } from "@/lib/cinemas/memory-cache"
import {
  CITY_CENTROIDS,
  haversineKm,
  nearestCitySlugFromCoords,
  slugifyCityName,
} from "@/lib/cinemas/geo"

/**
 * API de conteúdo do Ingresso.com (BR).
 * Nota: `api.ingresso.com/v1` é checkout; listagens usam `api-content.ingresso.com/v0`.
 */
const INGRESSO_BASE_URL =
  process.env.INGRESSO_API_BASE_URL?.replace(/\/$/, "") ||
  "https://api-content.ingresso.com/v0"

const PARTNERSHIP = process.env.INGRESSO_PARTNERSHIP || "home"
const REQUEST_TIMEOUT_MS = Number(process.env.INGRESSO_TIMEOUT_MS || 12_000)
const CITIES_TTL_MS = 24 * 60 * 60 * 1000
const THEATERS_TTL_MS = 30 * 60 * 1000
const SESSIONS_TTL_MS = 7 * 60 * 1000

export class IngressoApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public path?: string,
  ) {
    super(message)
    this.name = "IngressoApiError"
  }
}

type IngressoCity = {
  id: string
  name: string
  uf: string
  state?: string
  urlKey?: string
  timeZone?: string
  geolocation?: { lat?: number; lng?: number } | null
}

type IngressoState = {
  name: string
  uf: string
  cities: IngressoCity[]
}

type IngressoTheater = {
  id: string
  name: string
  urlKey?: string
  address?: string
  number?: string
  neighborhood?: string
  cityId?: string
  cityName?: string
  uf?: string
  corporation?: string
  siteURL?: string
  telephones?: string[]
  geolocation?: { lat?: number; lng?: number } | null
}

type IngressoSessionDate = {
  localDate?: string
  hour?: string
  dayAndMonth?: string
  year?: string
  isToday?: boolean
}

type IngressoSession = {
  id: string
  price?: number
  room?: string
  type?: string[]
  types?: Array<{ name?: string; alias?: string }>
  date?: IngressoSessionDate
  realDate?: IngressoSessionDate
  siteURL?: string
  enabled?: boolean
}

type IngressoMovie = {
  id: string
  title: string
  originalTitle?: string
  urlKey?: string
  duration?: string | number
  contentRating?: string
  genres?: string[]
  siteURL?: string
  images?: Array<{ url?: string; type?: string }>
  trailers?: Array<{ url?: string; type?: string }>
  rooms?: Array<{
    name?: string
    sessions?: IngressoSession[]
  }>
}

type IngressoDay = {
  date?: string
  isToday?: boolean
  movies?: IngressoMovie[]
}

async function ingressoFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${INGRESSO_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent":
          process.env.INGRESSO_USER_AGENT ||
          "ClaketeCinemas/1.0 (+https://clakete.app)",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new IngressoApiError(
        `Ingresso respondeu ${response.status} em ${path}`,
        response.status,
        path,
      )
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof IngressoApiError) throw error
    if (error instanceof Error && error.name === "AbortError") {
      throw new IngressoApiError(`Timeout ao chamar Ingresso: ${path}`)
    }
    throw new IngressoApiError(
      error instanceof Error ? error.message : "Falha desconhecida no Ingresso",
      undefined,
      path,
    )
  } finally {
    clearTimeout(timer)
  }
}

function normalizeCity(city: IngressoCity, stateName?: string): CinemaCity {
  const slug = city.urlKey || slugifyCityName(city.name)
  const fromApi =
    city.geolocation?.lat != null && city.geolocation?.lng != null
      ? { lat: city.geolocation.lat, lng: city.geolocation.lng }
      : null

  return {
    id: String(city.id),
    name: city.name,
    slug,
    uf: city.uf,
    state: city.state || stateName,
    timezone: city.timeZone,
    geolocation: fromApi || CITY_CENTROIDS[slug] || null,
  }
}

/** Lista todas as cidades disponíveis (agrega UFs). */
export async function listCities(options?: {
  refresh?: boolean
}): Promise<CinemaCity[]> {
  const cacheKey = "ingresso:cities"
  if (!options?.refresh) {
    const cached = getCached<CinemaCity[]>(cacheKey)
    if (cached) return cached
  }

  const states = await ingressoFetch<IngressoState[]>("/states")
  const cities = states.flatMap((state) =>
    (state.cities || []).map((city) => normalizeCity(city, state.name)),
  )

  setCached(cacheKey, cities, CITIES_TTL_MS)
  return cities
}

export async function findCityBySlug(
  citySlug: string,
): Promise<CinemaCity | null> {
  const slug = citySlug.trim().toLowerCase()
  const cities = await listCities()
  return (
    cities.find((city) => city.slug === slug) ||
    cities.find((city) => slugifyCityName(city.name) === slug) ||
    null
  )
}

export async function findNearestCity(
  lat: number,
  lng: number,
): Promise<CinemaCity | null> {
  const cities = await listCities()
  const withGeo = cities.filter((c) => c.geolocation)

  if (withGeo.length > 0) {
    let best: CinemaCity | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (const city of withGeo) {
      const distance = haversineKm({ lat, lng }, city.geolocation!)
      if (distance < bestDistance) {
        bestDistance = distance
        best = city
      }
    }
    if (best) return best
  }

  const fallbackSlug = nearestCitySlugFromCoords(lat, lng)
  return findCityBySlug(fallbackSlug)
}

export async function listTheatersByCityId(
  cityId: string,
  options?: { refresh?: boolean; partnership?: string },
): Promise<IngressoTheater[]> {
  const partnership = options?.partnership || PARTNERSHIP
  const cacheKey = `ingresso:theaters:${cityId}:${partnership}`
  if (!options?.refresh) {
    const cached = getCached<IngressoTheater[]>(cacheKey)
    if (cached) return cached
  }

  const payload = await ingressoFetch<{ items?: IngressoTheater[] } | IngressoTheater[]>(
    `/theaters/city/${encodeURIComponent(cityId)}/partnership/${encodeURIComponent(partnership)}`,
  )

  const theaters = Array.isArray(payload) ? payload : payload.items || []
  setCached(cacheKey, theaters, THEATERS_TTL_MS)
  return theaters
}

export async function listSessionsByTheater(
  cityId: string,
  theaterId: string,
  options?: { refresh?: boolean; partnership?: string },
): Promise<IngressoDay[]> {
  const partnership = options?.partnership || PARTNERSHIP
  const cacheKey = `ingresso:sessions:${cityId}:${theaterId}:${partnership}`
  if (!options?.refresh) {
    const cached = getCached<IngressoDay[]>(cacheKey)
    if (cached) return cached
  }

  const days = await ingressoFetch<IngressoDay[]>(
    `/sessions/city/${encodeURIComponent(cityId)}/theater/${encodeURIComponent(theaterId)}/partnership/${encodeURIComponent(partnership)}`,
  )

  setCached(cacheKey, days, SESSIONS_TTL_MS)
  return Array.isArray(days) ? days : []
}

function pickPoster(images?: Array<{ url?: string; type?: string }>): string | null {
  if (!images?.length) return null
  const portrait = images.find((img) => img.type === "PosterPortrait")
  return portrait?.url || images[0]?.url || null
}

function pickBackdrop(images?: Array<{ url?: string; type?: string }>): string | null {
  if (!images?.length) return null
  const horizontal = images.find((img) => img.type === "PosterHorizontal")
  return horizontal?.url || null
}

function normalizeMovie(movie: IngressoMovie): CinemaMovie {
  const durationRaw =
    typeof movie.duration === "string"
      ? Number.parseInt(movie.duration, 10)
      : movie.duration

  return {
    id: String(movie.id),
    title: movie.title,
    originalTitle: movie.originalTitle ?? null,
    slug: movie.urlKey ?? null,
    posterUrl: pickPoster(movie.images),
    backdropUrl: pickBackdrop(movie.images),
    durationMinutes: Number.isFinite(durationRaw) ? Number(durationRaw) : null,
    contentRating: movie.contentRating ?? null,
    genres: movie.genres || [],
    trailerUrl: movie.trailers?.[0]?.url ?? null,
    siteUrl: movie.siteURL ?? null,
  }
}

function sessionTypes(session: IngressoSession): string[] {
  if (session.types?.length) {
    return session.types
      .map((t) => t.alias || t.name)
      .filter((v): v is string => Boolean(v))
  }
  return session.type || []
}

function normalizeSessions(
  cinemaId: string,
  movie: IngressoMovie,
  dayFallback?: string,
): CinemaSession[] {
  const sessions: CinemaSession[] = []

  for (const room of movie.rooms || []) {
    for (const session of room.sessions || []) {
      const dateInfo = session.realDate || session.date
      const startsAt = dateInfo?.localDate
      if (!startsAt) continue

      const date = startsAt.slice(0, 10) || dayFallback || ""
      sessions.push({
        id: String(session.id),
        movieId: String(movie.id),
        cinemaId,
        startsAt,
        timeLabel: dateInfo?.hour || startsAt.slice(11, 16),
        date,
        room: session.room || room.name || null,
        types: sessionTypes(session),
        price: typeof session.price === "number" ? session.price : null,
        siteUrl: session.siteURL || movie.siteURL || null,
        available: session.enabled ?? true,
      })
    }
  }

  return sessions
}

function normalizeTheater(
  theater: IngressoTheater,
  movies: CinemaMovie[],
  sessions: CinemaSession[],
): Cinema {
  const addressParts = [theater.address, theater.number].filter(Boolean)
  return {
    id: String(theater.id),
    name: theater.name,
    slug: theater.urlKey || slugifyCityName(theater.name),
    chain: theater.corporation || null,
    address: addressParts.join(", ") || null,
    neighborhood: theater.neighborhood || null,
    cityId: theater.cityId ? String(theater.cityId) : null,
    cityName: theater.cityName || null,
    uf: theater.uf || null,
    geolocation:
      theater.geolocation?.lat != null && theater.geolocation?.lng != null
        ? { lat: theater.geolocation.lat, lng: theater.geolocation.lng }
        : null,
    phone: theater.telephones?.[0] || null,
    siteUrl: theater.siteURL || null,
    source: "ingresso",
    movies,
    sessions,
  }
}

/**
 * Agrega cinemas + filmes + sessões de uma cidade via Ingresso.
 * Limita sessões ao dia de hoje (ou ao primeiro dia disponível).
 */
export async function getCinemasByCitySlug(
  citySlug: string,
  options?: {
    refresh?: boolean
    maxTheaters?: number
    origin?: { lat: number; lng: number }
  },
): Promise<CinemasByCityResponse> {
  const city = await findCityBySlug(citySlug)
  if (!city) {
    throw new IngressoApiError(`Cidade não encontrada: ${citySlug}`, 404)
  }

  const cacheKey = `ingresso:city-bundle:${city.id}`
  if (!options?.refresh) {
    const cached = getCached<CinemasByCityResponse>(cacheKey)
    if (cached) {
      return attachDistances(cached, options?.origin)
    }
  }

  const theaters = await listTheatersByCityId(city.id, {
    refresh: options?.refresh,
  })
  const limit = options?.maxTheaters ?? 25
  const selected = theaters.slice(0, limit)

  const cinemas: Cinema[] = []

  // Sessões em paralelo com concorrência limitada
  const concurrency = 4
  for (let i = 0; i < selected.length; i += concurrency) {
    const batch = selected.slice(i, i + concurrency)
    const results = await Promise.all(
      batch.map(async (theater) => {
        try {
          const days = await listSessionsByTheater(city.id, theater.id, {
            refresh: options?.refresh,
          })
          const day =
            days.find((d) => d.isToday) ||
            days.find((d) => Boolean(d.movies?.length)) ||
            days[0]

          const movieMap = new Map<string, CinemaMovie>()
          const sessions: CinemaSession[] = []

          for (const movie of day?.movies || []) {
            const normalized = normalizeMovie(movie)
            movieMap.set(normalized.id, normalized)
            sessions.push(
              ...normalizeSessions(String(theater.id), movie, day?.date),
            )
          }

          return normalizeTheater(
            theater,
            [...movieMap.values()],
            sessions.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
          )
        } catch (error) {
          console.warn(
            `[ingresso] falha ao buscar sessões do cinema ${theater.id}:`,
            error,
          )
          return normalizeTheater(theater, [], [])
        }
      }),
    )
    cinemas.push(...results)
  }

  const payload: CinemasByCityResponse = {
    city,
    source: "ingresso",
    fetchedAt: new Date().toISOString(),
    cinemas,
  }

  setCached(cacheKey, payload, SESSIONS_TTL_MS)
  return attachDistances(payload, options?.origin)
}

function attachDistances(
  payload: CinemasByCityResponse,
  origin?: { lat: number; lng: number },
): CinemasByCityResponse {
  if (!origin) return payload

  const cinemas = payload.cinemas
    .map((cinema) => {
      if (!cinema.geolocation) return cinema
      return {
        ...cinema,
        distanceKm: Number(
          haversineKm(origin, cinema.geolocation).toFixed(2),
        ),
      }
    })
    .sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY
      return da - db
    })

  return { ...payload, cinemas }
}
