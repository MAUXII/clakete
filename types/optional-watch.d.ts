declare module "@clakete/watch" {
  export const CLAKETE_WATCH_ENABLED: boolean

  export type ClaketePlayback =
    | { kind: "iframe"; url: string }
    | { kind: "video"; url: string }

  export type UseClaketeWatchOptions = {
    mediaType?: "movie" | "tv"
    season?: number
    episode?: number
  }

  export type ClaketeSeasonEpisode = {
    id: number
    name: string
    episode_number: number
    season_number?: number
    still_path?: string | null
    overview?: string | null
  }

  export function useClaketeWatch(
    mediaId: number,
    enabled: boolean,
    opts?: UseClaketeWatchOptions,
  ): {
    playback: ClaketePlayback | null
    loading: boolean
    available: boolean
  }

  export function ClaketeWatchDialog(props: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    playback: ClaketePlayback | null
  }): null | JSX.Element

  export function ClaketeSeasonWatchDialog(props: {
    open: boolean
    onOpenChange: (open: boolean) => void
    seriesId: number
    seriesName?: string
    seasonNumber: number
    episodes: ClaketeSeasonEpisode[]
    onEpisodePlay?: (episode: ClaketeSeasonEpisode) => void
  }): null | JSX.Element
}

declare module "@clakete/watch/server" {
  export function moviePlaybackOptionsGET(
    request: Request,
    ctx: { params: Promise<{ id: string }> },
  ): Promise<Response>
  export function moviePlaybackGET(
    request: Request,
    ctx: { params: Promise<{ id: string }> },
  ): Promise<Response>
  export function seriesPlaybackOptionsGET(
    request: Request,
    ctx: { params: Promise<{ id: string }> },
  ): Promise<Response>
  export function superflixGenresGET(request: Request): Promise<Response>
  export function superflixMoviesGET(request: Request): Promise<Response>
  export function superflixChannelsGET(request: Request): Promise<Response>
}
