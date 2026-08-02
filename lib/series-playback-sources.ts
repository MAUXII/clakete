/**
 * Playback de séries via SuperFlix (`/serie/{tmdb}/{season}/{episode}`).
 */

import {
  buildSeriesPlayerUrl,
  getSeriesCatalogSet,
} from "@/lib/superflix";
import type { IframePlaybackSource } from "@/lib/film-playback-sources";

/**
 * Resolve fonte SuperFlix para um episódio.
 * Se o catálogo estiver indisponível, faz fallback otimista pelo TMDB id.
 */
export async function resolveSuperflixSeriesEpisodeSource(
  tmdbId: number,
  season: number,
  episode: number
): Promise<IframePlaybackSource | null> {
  if (process.env.SUPERFLIX_ENABLED === "false") return null;
  if (!Number.isFinite(tmdbId) || tmdbId < 1) return null;
  if (!Number.isFinite(season) || season < 0) return null;
  if (!Number.isFinite(episode) || episode < 1) return null;

  const id = String(tmdbId);
  let inCatalog: boolean | null = null;

  try {
    const set = await getSeriesCatalogSet();
    inCatalog = set.has(id.toLowerCase());
  } catch {
    inCatalog = null;
  }

  if (inCatalog === false) return null;

  return {
    id: "superflix",
    label: "SuperFlix",
    url: buildSeriesPlayerUrl(tmdbId, season, episode),
  };
}

export async function mergeSeriesEpisodeIframeSources(
  tmdbId: number,
  season: number,
  episode: number
): Promise<IframePlaybackSource[]> {
  const superflix = await resolveSuperflixSeriesEpisodeSource(
    tmdbId,
    season,
    episode
  );
  return superflix ? [superflix] : [];
}
