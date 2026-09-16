"use client";

/** Stub público: sem playback Clakete no showcase. */
export const CLAKETE_WATCH_ENABLED = false;

export type ClaketePlayback =
  | { kind: "iframe"; url: string }
  | { kind: "video"; url: string };

export type UseClaketeWatchOptions = {
  mediaType?: "movie" | "tv";
  season?: number;
  episode?: number;
};

export type ClaketeSeasonEpisode = {
  id: number;
  name: string;
  episode_number: number;
  season_number?: number;
  still_path?: string | null;
  overview?: string | null;
};

export function useClaketeWatch(
  _mediaId: number,
  _enabled: boolean,
  _opts: UseClaketeWatchOptions = {},
) {
  return {
    playback: null as ClaketePlayback | null,
    loading: false,
    available: false,
  };
}

export function ClaketeWatchDialog(_props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  playback: ClaketePlayback | null;
}) {
  return null;
}

export function ClaketeSeasonWatchDialog(_props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: number;
  seriesTitle: string;
  seasonNumber: number;
  episodes: ClaketeSeasonEpisode[];
  onEpisodePlay?: (episode: ClaketeSeasonEpisode) => void;
}) {
  return null;
}
