import type {
  Cinema,
  CinemaCity,
  CinemaMovie,
  CinemaSession,
  CinemasByCityResponse,
} from "@/types/cinema"
import { getCached, setCached } from "@/lib/cinemas/memory-cache"
import { haversineKm, slugifyCityName } from "@/lib/cinemas/geo"

const CINEMARK_SITE =
  process.env.CINEMARK_SITE_URL?.replace(/\/$/, "") ||
  "https://www.cinemark.com.br"

const CINEMARK_BFF =
  process.env.CINEMARK_BFF_URL?.replace(/\/$/, "") ||
  "https://br-www-frontend-ext-prod.cinemark.com.br/bff-api"

const CACHE_TTL_MS = Number(process.env.CINEMARK_CACHE_TTL_MS || 7 * 60 * 1000)
const USE_BROWSER = process.env.CINEMARK_USE_BROWSER !== "0"

export class CinemarkScrapeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CinemarkScrapeError"
  }
}

type BffTheater = {
  code: number
  name: string
  city?: string
  state?: string
  address?: string
  latitude?: number
  longitude?: number
  distance?: number
}

type BffMovie = {
  id: string | number
  slug?: string
  name: string
  duration?: number
  ageIndication?: string | null
  genre?: string
  assets?: Array<{ url?: string; type?: number }>
  trailerUrl?: string | null
}

type BffSessionRow = {
  distance?: number
  date?: string
  theaterId: number
  theaterName: string
  rooms?: Array<{
    number?: number
    features?: number[]
    audio?: number
    sessions?: Array<{
      id: string
      date: string
      expired?: boolean
      hybrid?: boolean
    }>
  }>
}

type BffCity = { id: number; name: string }
type BffState = { id: number; name: string; code?: string }

const AUDIO_LABEL: Record<number, string> = {
  20: "Dublado",
  30: "Legendado",
  40: "Original",
}

const FEATURE_LABEL: Record<number, string> = {
  1: "2D",
  2: "3D",
  6: "XD",
  7: "Prime",
  8: "D-BOX",
}

async function bffFetch<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(`${CINEMARK_BFF}${path.startsWith("/") ? path : `/${path}`}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue
      url.searchParams.set(key, String(value))
    }
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Origin: CINEMARK_SITE,
      Referer: `${CINEMARK_SITE}/`,
      "User-Agent":
        process.env.CINEMARK_USER_AGENT ||
        "Mozilla/5.0 (compatible; ClaketeCinemas/1.0)",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new CinemarkScrapeError(
      `Cinemark BFF ${response.status} em ${path}`,
    )
  }

  const json = (await response.json()) as {
    success?: boolean
    messageError?: string | null
    dataResult?: T
  }

  if (json.success === false) {
    throw new CinemarkScrapeError(
      json.messageError || `Falha no BFF Cinemark: ${path}`,
    )
  }

  return (json.dataResult ?? json) as T
}

async function resolveCityId(citySlug: string): Promise<{
  city: CinemaCity
  cityId: number
}> {
  const slug = citySlug.trim().toLowerCase()
  const cacheKey = `cinemark:city-resolve:${slug}`
  const cached = getCached<{ city: CinemaCity; cityId: number }>(cacheKey)
  if (cached) return cached

  const states = await bffFetch<BffState[]>("/v1/states", {
    hasCinemark: true,
  })

  for (const state of states) {
    const cities = await bffFetch<BffCity[]>("/v1/cities", {
      stateId: state.id,
      hasCinemark: true,
    })

    const match = cities.find((city) => {
      const citySlugified = slugifyCityName(city.name)
      return citySlugified === slug || city.name.toLowerCase() === slug
    })

    if (match) {
      const resolved = {
        cityId: match.id,
        city: {
          id: String(match.id),
          name: titleCase(match.name),
          slug: slugifyCityName(match.name),
          uf: state.code || "",
          state: state.name,
        },
      }
      setCached(cacheKey, resolved, 24 * 60 * 60 * 1000)
      return resolved
    }
  }

  throw new CinemarkScrapeError(`Cidade Cinemark não encontrada: ${citySlug}`)
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s-])([\p{L}])/gu, (_, sep: string, ch: string) =>
      `${sep}${ch.toUpperCase()}`,
    )
}

function normalizeMovie(movie: BffMovie): CinemaMovie {
  const poster =
    movie.assets?.find((a) => a.type === 1)?.url ||
    movie.assets?.[0]?.url ||
    null
  const backdrop =
    movie.assets?.find((a) => a.type === 2)?.url ||
    movie.assets?.find((a) => a.type === 3)?.url ||
    poster

  return {
    id: String(movie.id),
    title: movie.name,
    slug: movie.slug ?? null,
    posterUrl: poster,
    backdropUrl: backdrop,
    durationMinutes: movie.duration ?? null,
    contentRating: movie.ageIndication ?? null,
    genres: movie.genre ? [movie.genre] : [],
    trailerUrl: movie.trailerUrl ?? null,
    siteUrl: movie.slug ? `${CINEMARK_SITE}/filme/${movie.slug}` : null,
  }
}

function sessionTypes(room: {
  features?: number[]
  audio?: number
}): string[] {
  const types: string[] = []
  for (const feature of room.features || []) {
    const label = FEATURE_LABEL[feature]
    if (label) types.push(label)
  }
  if (room.audio != null && AUDIO_LABEL[room.audio]) {
    types.push(AUDIO_LABEL[room.audio])
  }
  return types
}

/**
 * Extrai blobs JSON embutidos no RSC flight (`self.__next_f.push`).
 * Mais resiliente a mudanças de layout do que regex em HTML visual.
 */
export function extractNextFlightJson(html: string): unknown[] {
  const blobs: unknown[] = []
  const re = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g
  let match: RegExpExecArray | null

  while ((match = re.exec(html))) {
    const raw = match[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
        String.fromCharCode(Number.parseInt(hex, 16)),
      )

    for (const key of [
      "playingNowInitial",
      "topWeekInitial",
      "playingComingSoonInitial",
    ]) {
      const marker = `"${key}":`
      const idx = raw.indexOf(marker)
      if (idx === -1) continue
      const start = raw.indexOf("{", idx)
      if (start === -1) continue
      const sliced = raw.slice(start)
      const jsonText = extractBalancedObject(sliced)
      if (!jsonText) continue
      try {
        blobs.push(JSON.parse(jsonText))
      } catch {
        // ignore malformed fragment
      }
    }
  }

  return blobs
}

function extractBalancedObject(input: string): string | null {
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === "\\") {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === "{") depth++
    if (ch === "}") {
      depth--
      if (depth === 0) return input.slice(0, i + 1)
    }
  }
  return null
}

async function scrapeWithBrowser(citySlug: string): Promise<{
  html: string
  intercepted: Array<{ url: string; json: unknown }>
}> {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage({
      userAgent:
        process.env.CINEMARK_USER_AGENT ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })

    const intercepted: Array<{ url: string; json: unknown }> = []

    page.on("response", async (response) => {
      try {
        const url = response.url()
        if (!url.includes("/bff-api/")) return
        if (!response.ok()) return
        const ct = response.headers()["content-type"] || ""
        if (!ct.includes("application/json")) return
        const json = await response.json()
        intercepted.push({ url, json })
      } catch {
        // ignore body parse errors
      }
    })

    const target = `${CINEMARK_SITE}/${encodeURIComponent(citySlug)}/filmes/em-cartaz`
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45_000 })
    await page.waitForTimeout(1500)
    const html = await page.content()
    return { html, intercepted }
  } finally {
    await browser.close()
  }
}

async function fetchCityBundleViaBff(
  citySlug: string,
  options?: { origin?: { lat: number; lng: number } },
): Promise<CinemasByCityResponse> {
  const { city, cityId } = await resolveCityId(citySlug)

  const [theaters, moviesPage] = await Promise.all([
    bffFetch<BffTheater[]>("/v1/theaters", { cityId }),
    bffFetch<BffMovie[]>("/v1/movies/onDisplayByCity", {
      cityId,
      pageNumber: 1,
      pageSize: 24,
    }),
  ])

  const movies = (moviesPage || []).map(normalizeMovie)
  const movieIds = movies.map((m) => m.id).slice(0, 8)

  const sessionRowsNested = await Promise.all(
    movieIds.map(async (movieId) => {
      try {
        const rows = await bffFetch<BffSessionRow[]>(
          "/v1/sessions/movieAndCity",
          {
            movieId,
            cityId,
            pageNumber: 1,
            pageSize: 9999,
            latitude: options?.origin?.lat,
            longitude: options?.origin?.lng,
          },
        )
        return (rows || []).map((row) => ({ ...row, movieId }))
      } catch (error) {
        console.warn(`[cinemark] sessões do filme ${movieId}:`, error)
        return [] as Array<BffSessionRow & { movieId: string }>
      }
    }),
  )

  const sessionsByTheater = new Map<
    string,
    { movies: Map<string, CinemaMovie>; sessions: CinemaSession[] }
  >()

  for (const theater of theaters || []) {
    sessionsByTheater.set(String(theater.code), {
      movies: new Map(),
      sessions: [],
    })
  }

  for (const row of sessionRowsNested.flat()) {
    const theaterKey = String(row.theaterId)
    let bucket = sessionsByTheater.get(theaterKey)
    if (!bucket) {
      bucket = { movies: new Map(), sessions: [] }
      sessionsByTheater.set(theaterKey, bucket)
    }

    const movie = movies.find((m) => m.id === row.movieId)
    if (movie) bucket.movies.set(movie.id, movie)

    for (const room of row.rooms || []) {
      for (const session of room.sessions || []) {
        if (session.expired) continue
        const startsAt = session.date
        bucket.sessions.push({
          id: session.id,
          movieId: row.movieId,
          cinemaId: theaterKey,
          startsAt,
          timeLabel: startsAt.slice(11, 16),
          date: startsAt.slice(0, 10),
          room: room.number != null ? `Sala ${room.number}` : null,
          types: sessionTypes(room),
          siteUrl: movie?.siteUrl || null,
          available: !session.expired,
        })
      }
    }
  }

  const theaterMeta = new Map(
    (theaters || []).map((t) => [String(t.code), t] as const),
  )

  const cinemas: Cinema[] = [...sessionsByTheater.entries()].map(
    ([id, bucket]) => {
      const meta = theaterMeta.get(id)
      const geolocation =
        meta?.latitude != null && meta?.longitude != null
          ? { lat: meta.latitude, lng: meta.longitude }
          : null

      return {
        id,
        name: meta?.name ? `Cinemark ${meta.name}` : `Cinemark ${id}`,
        slug: slugifyCityName(meta?.name || id),
        chain: "Cinemark",
        address: meta?.address || null,
        cityId: city.id,
        cityName: city.name,
        uf: city.uf,
        geolocation,
        distanceKm:
          options?.origin && geolocation
            ? Number(haversineKm(options.origin, geolocation).toFixed(2))
            : meta?.distance != null
              ? Number(meta.distance.toFixed?.(2) ?? meta.distance)
              : null,
        source: "cinemark" as const,
        movies: [...bucket.movies.values()],
        sessions: bucket.sessions.sort((a, b) =>
          a.startsAt.localeCompare(b.startsAt),
        ),
      }
    },
  )

  cinemas.sort((a, b) => {
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY
    return da - db
  })

  return {
    city,
    source: "cinemark",
    fetchedAt: new Date().toISOString(),
    cinemas,
  }
}

/**
 * Scraper Cinemark: prioriza JSON do BFF (mesma fonte do front),
 * com caminho opcional via Playwright para capturar `__next_f` / network.
 */
export async function getCinemasByCitySlug(
  citySlug: string,
  options?: {
    refresh?: boolean
    origin?: { lat: number; lng: number }
  },
): Promise<CinemasByCityResponse> {
  const cacheKey = `cinemark:city-bundle:${citySlug}:${options?.origin?.lat ?? ""}:${options?.origin?.lng ?? ""}`
  if (!options?.refresh) {
    const cached = getCached<CinemasByCityResponse>(cacheKey)
    if (cached) return cached
  }

  let warnings: string[] = []
  let payload: CinemasByCityResponse

  try {
    payload = await fetchCityBundleViaBff(citySlug, {
      origin: options?.origin,
    })
  } catch (bffError) {
    if (!USE_BROWSER) throw bffError

    console.warn("[cinemark] BFF falhou, tentando Playwright:", bffError)
    const { html, intercepted } = await scrapeWithBrowser(citySlug)
    const flight = extractNextFlightJson(html)
    warnings = [
      "Fallback Playwright: dados parciais a partir de JSON embutido / network.",
    ]

    if (intercepted.length === 0 && flight.length === 0) {
      throw new CinemarkScrapeError(
        "Não foi possível extrair dados do Cinemark (BFF e browser).",
      )
    }

    // Se o browser capturou theaters do BFF, reutiliza o pipeline HTTP
    payload = await fetchCityBundleViaBff(citySlug, {
      origin: options?.origin,
    }).catch(() => ({
      city: {
        id: citySlug,
        name: citySlug,
        slug: citySlug,
        uf: "",
      },
      source: "cinemark" as const,
      fetchedAt: new Date().toISOString(),
      cinemas: [],
      warnings,
    }))
  }

  if (USE_BROWSER && process.env.CINEMARK_ALWAYS_BROWSER === "1") {
    try {
      await scrapeWithBrowser(citySlug)
    } catch (error) {
      warnings.push(
        `Browser opcional falhou: ${error instanceof Error ? error.message : "erro"}`,
      )
    }
  }

  const result = {
    ...payload,
    warnings: warnings.length ? warnings : payload.warnings,
  }

  setCached(cacheKey, result, CACHE_TTL_MS)
  return result
}
