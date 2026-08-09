"use client";

import { useEffect, useState } from "react";

export type ClaketePlayback =
  | { kind: "iframe"; url: string }
  | { kind: "video"; url: string };

type PlaybackOptionsResponse = {
  ownUrl: string | null;
  iframeSources: { id: string; label: string; url: string }[];
};

export type UseClaketeWatchOptions = {
  mediaType?: "movie" | "tv";
  season?: number;
  episode?: number;
};

function resolveClaketePlayback(data: PlaybackOptionsResponse): ClaketePlayback | null {
  const superflix = data.iframeSources.find((s) => s.id === "superflix");
  if (superflix?.url) return { kind: "iframe", url: superflix.url };

  const iframe = data.iframeSources[0];
  if (iframe?.url) return { kind: "iframe", url: iframe.url };

  if (data.ownUrl) return { kind: "video", url: data.ownUrl };

  return null;
}

function cacheKey(
  mediaType: string,
  mediaId: number,
  season: number,
  episode: number
) {
  return `clakete:playback:v1:${mediaType}:${mediaId}:${season}:${episode}`;
}

function readCachedPlayback(key: string): ClaketePlayback | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClaketePlayback;
    if (
      (parsed.kind === "iframe" || parsed.kind === "video") &&
      typeof parsed.url === "string" &&
      parsed.url.length > 0
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeCachedPlayback(key: string, playback: ClaketePlayback) {
  try {
    sessionStorage.setItem(key, JSON.stringify(playback));
  } catch {
    // ignore
  }
}

/** Playback Clakete (SuperFlix / CDN) — só busca quando `enabled` (assinantes). */
export function useClaketeWatch(
  mediaId: number,
  enabled: boolean,
  opts: UseClaketeWatchOptions = {}
) {
  const mediaType = opts.mediaType ?? "movie";
  const season = opts.season ?? 1;
  const episode = opts.episode ?? 1;
  const [playback, setPlayback] = useState<ClaketePlayback | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !mediaId) {
      setPlayback(null);
      return;
    }

    const key = cacheKey(mediaType, mediaId, season, episode);
    const cached = readCachedPlayback(key);
    if (cached) {
      setPlayback(cached);
      setLoading(false);
    }

    let cancelled = false;
    if (!cached) setLoading(true);

    const url =
      mediaType === "tv"
        ? `/api/series/${mediaId}/playback-options?season=${season}&episode=${episode}`
        : `/api/movies/${mediaId}/playback-options`;

    void fetch(url)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as PlaybackOptionsResponse;
      })
      .then((data) => {
        if (cancelled || !data) return;
        const next = resolveClaketePlayback(data);
        setPlayback(next);
        if (next) writeCachedPlayback(key, next);
      })
      .catch(() => {
        if (!cancelled && !cached) setPlayback(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mediaId, enabled, mediaType, season, episode]);

  return { playback, loading, available: Boolean(playback) };
}
