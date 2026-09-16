import type { Movie } from "@/components/movies/film-detail-types"
import type { SeasonEpisode } from "@/components/series/episodes"

export interface SeasonDetail {
  id: number
  name: string
  overview: string
  season_number: number
  air_date: string | null
  poster_path: string | null
  seriesName: string
  seriesBackdrop: string | null
  seriesPosterPath?: string | null
  seriesEpisodeTotal?: number | null
  watchProviders?: Movie["watchProviders"]
  episodes: SeasonEpisode[]
}

export interface SeasonDetailViewProps {
  seriesId: number
  season: SeasonDetail
  seriesPath: string
  seasonProgress: { watched: number; total: number } | null
  onProgressChange: (watched: number, total: number) => void
}
