import type { Video } from "@/components/movies/trailer"
import type { TmdbRegionProviders } from "@/lib/locale-prefs"

export interface Movie {
  id: number
  title: string
  original_title?: string | null
  poster_path: string
  backdrop_path: string
  release_date: string
  tagline: string | null
  overview: string
  runtime: number
  images: {
    backdrops: Array<{ file_path: string }>
    posters: Array<{ file_path: string }>
  }
  director: string
  similar: {
    results: Array<{
      title: string
      original_title?: string | null
      poster_path: string
      id: number
      release_date?: string | null
    }>
  }
  recommendations: {
    results: Array<{
      title: string
      original_title?: string | null
      poster_path: string
      id: number
      release_date?: string | null
    }>
  }
  cast: {
    character: string
    name: string
    profile_path: string
    id: number
  }[]
  crew: {
    department: string
    name: string
    profile_path: string
    id: number
    job: string
  }[]
  vote_average: number
  genres: { id: number; name: string }[]
  videos: {
    results: Video[]
  } | null
  watchProviders: {
    results: Record<string, TmdbRegionProviders>
  }
  trailer: {
    key: string
    site: string
    type: string
    name: string
  } | null
}

export interface FilmDetailViewProps {
  movie: Movie
  isWatched: boolean
  isLiked: boolean
  isInWatchlist: boolean
  rating: number | null
  review: string | null
  watchedDate: string | null
  rewatchCount: number
  hasDiaryLogs: boolean
  loading: boolean
  interactionsLoading: boolean
  updating: boolean
  setRating: (rating: number) => Promise<void>
  toggleWatched: () => Promise<string | undefined>
  toggleLiked: () => Promise<void>
  toggleWatchlist: () => Promise<void>
  logWatch: (payload: any) => Promise<void>
  unwatch: () => Promise<void>
  removeFromDiary: () => Promise<void>
  onShareClick: () => void
}

export function formatRuntime(minutes: number) {
  if (!minutes || minutes < 1) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h <= 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}
