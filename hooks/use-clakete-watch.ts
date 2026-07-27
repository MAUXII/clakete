"use client";

import { useEffect, useState } from "react";

export type ClaketePlayback =
  | { kind: "iframe"; url: string }
  | { kind: "video"; url: string };

type PlaybackOptionsResponse = {
  ownUrl: string | null;
  iframeSources: { id: string; label: string; url: string }[];
};

function resolveClaketePlayback(data: PlaybackOptionsResponse): ClaketePlayback | null {
  const superflix = data.iframeSources.find((s) => s.id === "superflix");
  if (superflix?.url) return { kind: "iframe", url: superflix.url };

  const iframe = data.iframeSources[0];
  if (iframe?.url) return { kind: "iframe", url: iframe.url };

  if (data.ownUrl) return { kind: "video", url: data.ownUrl };

  return null;
}

/** Playback Clakete (SuperFlix / CDN) — só busca para assinantes. */
export function useClaketeWatch(filmId: number, enabled: boolean) {
  const [playback, setPlayback] = useState<ClaketePlayback | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !filmId) {
      setPlayback(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetch(`/api/movies/${filmId}/playback-options`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as PlaybackOptionsResponse;
      })
      .then((data) => {
        if (cancelled || !data) return;
        setPlayback(resolveClaketePlayback(data));
      })
      .catch(() => {
        if (!cancelled) setPlayback(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filmId, enabled]);

  return { playback, loading, available: Boolean(playback) };
}
