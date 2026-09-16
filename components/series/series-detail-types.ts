import type { Video } from "@/components/movies/trailer"
import type { TmdbRegionProviders } from "@/lib/locale-prefs"

export interface Season {
  id: number
  name: string
  poster_path: string | null
  season_number: number
  episode_count: number
  air_date: string | null
  overview?: string
}

export interface SeriesDetail {
  id: number
  title: string
  name: string
  original_name?: string | null
  poster_path: string
  backdrop_path: string
  release_date: string
  first_air_date: string
  tagline: string | null
  overview: string
  runtime: number
  number_of_seasons: number
  seasons: Season[]
  images: {
    backdrops: Array<{ file_path: string }>
    posters: Array<{ file_path: string }>
  }
  director: string
  similar: {
    results: Array<{ name: string; poster_path: string; id: number; vote_average?: number }>
  }
  recommendations: {
    results: Array<{ name: string; poster_path: string; id: number; vote_average?: number }>
  }
  cast: { character: string; name: string; profile_path: string; id: number }[]
  crew: { department: string; name: string; profile_path: string; id: number; job: string }[]
  vote_average: number
  genres: { id: number; name: string }[]
  videos: { results: Video[] } | null
  watchProviders: {
    results: Record<string, TmdbRegionProviders>
  }
}

export interface SeriesDetailViewProps {
  series: SeriesDetail
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
}

export function formatRuntime(minutes: number) {
  if (!minutes || minutes < 1) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h <= 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}
