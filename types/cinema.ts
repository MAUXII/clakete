/** Fonte agregada de dados de cinema. */
export type CinemaSource = "ingresso" | "cinemark"

export interface GeoPoint {
  lat: number
  lng: number
}

export interface CinemaCity {
  id: string
  name: string
  slug: string
  uf: string
  state?: string
  timezone?: string
  geolocation?: GeoPoint | null
}

export interface CinemaMovie {
  id: string
  title: string
  originalTitle?: string | null
  slug?: string | null
  /** ID no TMDB quando o match for encontrado. */
  tmdbId?: number | null
  posterUrl?: string | null
  /** Backdrop / wide — preferencialmente TMDB. */
  backdropUrl?: string | null
  durationMinutes?: number | null
  contentRating?: string | null
  genres?: string[]
  trailerUrl?: string | null
  siteUrl?: string | null
}

export interface CinemaSession {
  id: string
  movieId: string
  cinemaId: string
  startsAt: string
  timeLabel: string
  date: string
  room?: string | null
  types: string[]
  price?: number | null
  siteUrl?: string | null
  available?: boolean | null
}

export interface Cinema {
  id: string
  name: string
  slug: string
  chain?: string | null
  address?: string | null
  neighborhood?: string | null
  cityId?: string | null
  cityName?: string | null
  uf?: string | null
  geolocation?: GeoPoint | null
  phone?: string | null
  siteUrl?: string | null
  distanceKm?: number | null
  source: CinemaSource
  movies: CinemaMovie[]
  sessions: CinemaSession[]
}

export interface CinemasByCityResponse {
  city: CinemaCity
  source: CinemaSource
  fetchedAt: string
  cinemas: Cinema[]
  warnings?: string[]
}
