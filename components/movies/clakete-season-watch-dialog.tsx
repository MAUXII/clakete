"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ClaketePlayback } from "@/hooks/use-clakete-watch";
import { useT } from "@/components/providers/i18n-provider";
import {
  CLAKETE_PLAYER_FRAME,
  ClaketePlayerShell,
} from "@/components/movies/clakete-player-shell";
import { useDesignMode } from "@/hooks/use-design-mode";

export type ClaketeSeasonEpisode = {
  id: number;
  episode_number: number;
  name: string;
};

type ClaketeSeasonWatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: number;
  seasonNumber: number;
  seriesName?: string;
  episodes: ClaketeSeasonEpisode[];
  onEpisodePlay?: (episode: ClaketeSeasonEpisode) => void;
};

function episodeCacheKey(seriesId: number, season: number, episode: number) {
  return `clakete:playback:v1:tv:${seriesId}:${season}:${episode}`;
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

async function fetchEpisodePlayback(
  seriesId: number,
  season: number,
  episode: number
): Promise<ClaketePlayback | null> {
  const key = episodeCacheKey(seriesId, season, episode);
  const cached = readCachedPlayback(key);
  if (cached) return cached;

  const res = await fetch(
    `/api/series/${seriesId}/playback-options?season=${season}&episode=${episode}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    ownUrl: string | null;
    iframeSources: { id: string; url: string }[];
  };
  const superflix = data.iframeSources?.find((s) => s.id === "superflix");
  let next: ClaketePlayback | null = null;
  if (superflix?.url) next = { kind: "iframe", url: superflix.url };
  else {
    const first = data.iframeSources?.[0];
    if (first?.url) next = { kind: "iframe", url: first.url };
    else if (data.ownUrl) next = { kind: "video", url: data.ownUrl };
  }
  if (next) writeCachedPlayback(key, next);
  return next;
}

export function ClaketeSeasonWatchDialog({
  open,
  onOpenChange,
  seriesId,
  seasonNumber,
  seriesName,
  episodes,
  onEpisodePlay,
}: ClaketeSeasonWatchDialogProps) {
  const { t } = useT();
  const designMode = useDesignMode();
  const isGlass = designMode === "glass";
  const [selected, setSelected] = useState<ClaketeSeasonEpisode | null>(null);
  const [playback, setPlayback] = useState<ClaketePlayback | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setPlayback(null);
      setLoading(false);
    }
  }, [open]);

  const playEpisode = useCallback(
    async (ep: ClaketeSeasonEpisode) => {
      setSelected(ep);
      setPlayback(null);
      setLoading(true);
      try {
        const next = await fetchEpisodePlayback(
          seriesId,
          seasonNumber,
          ep.episode_number
        );
        setPlayback(next);
        if (next) onEpisodePlay?.(ep);
      } finally {
        setLoading(false);
      }
    },
    [seriesId, seasonNumber, onEpisodePlay]
  );

  const backToList = () => {
    setSelected(null);
    setPlayback(null);
  };

  const picking = !selected;
  const headerTitle = selected
    ? selected.name
    : seriesName?.trim() || "Clakete";
  const headerMeta = selected
    ? `S${seasonNumber}E${selected.episode_number}`
    : `Season ${seasonNumber}`;

  if (picking) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          "gap-0 overflow-hidden p-0",
          isGlass
            ? "border-white/10 bg-[#161719]/96 text-white sm:rounded-[24px] backdrop-blur-2xl shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)] sm:max-w-md"
            : "border-border bg-card text-foreground sm:max-w-md sm:rounded-2xl"
        )}>
          <DialogHeader className={cn("space-y-1 border-b px-5 py-4 text-left", isGlass ? "border-white/10" : "border-border")}>
            <p className={cn("text-[10px] font-medium uppercase tracking-[0.22em]", isGlass ? "text-white/40" : "text-muted-foreground")}>
              {headerMeta}
            </p>
            <DialogTitle className={cn("text-lg font-semibold tracking-tight", isGlass && "text-white")}>
              {headerTitle}
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isGlass ? "text-white/50" : "text-muted-foreground")}>
              {t("series.pickEpisodeToWatch")}
            </DialogDescription>
          </DialogHeader>
          <div className="custom-scrollbar max-h-[min(58vh,440px)] overflow-y-auto">
            {episodes.length === 0 ? (
              <p className={cn("px-5 py-10 text-center text-sm", isGlass ? "text-white/40" : "text-muted-foreground")}>
                {t("series.noEpisodes")}
              </p>
            ) : (
              <ul className={cn("divide-y px-1 py-1", isGlass ? "divide-white/[0.08]" : "divide-border/70")}>
                {episodes.map((ep) => (
                  <li key={ep.id}>
                    <button
                      type="button"
                      onClick={() => void playEpisode(ep)}
                      className={cn(
                        "group flex w-full items-baseline gap-4 px-4 py-3.5 text-left transition-colors",
                        isGlass
                          ? "hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none"
                          : "hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      )}
                    >
                      <span className={cn(
                        "w-7 shrink-0 text-right text-xs tabular-nums transition-colors",
                        isGlass ? "text-white/40 group-hover:text-white/80" : "text-muted-foreground/70 group-hover:text-muted-foreground"
                      )}>
                        {ep.episode_number}
                      </span>
                      <span className={cn(
                        "min-w-0 flex-1 truncate text-sm transition-colors",
                        isGlass ? "text-white/90 group-hover:text-white" : "text-foreground/90 group-hover:text-foreground"
                      )}>
                        {ep.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ClaketePlayerShell
      open={open}
      onOpenChange={onOpenChange}
      title={headerTitle}
      eyebrow={headerMeta}
      description={t("catalog.claketePlayerHint")}
      tip={playback?.kind === "iframe" ? t("catalog.claketePlayerAdTip") : null}
      confirmLeave={Boolean(playback) || loading}
      headerStart={
        <button
          type="button"
          onClick={backToList}
          aria-label={t("series.backToEpisodes")}
          className="inline-flex size-9 items-center justify-center rounded-full bg-black/35 text-white/80 backdrop-blur-md transition hover:bg-black/55 hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
      }
    >
      {loading ? (
        <div
          className={cn(
            CLAKETE_PLAYER_FRAME,
            "flex items-center justify-center text-sm text-white/40",
          )}
        >
          {t("common.loading")}
        </div>
      ) : playback ? (
        playback.kind === "video" ? (
          <video
            key={playback.url}
            className={cn(CLAKETE_PLAYER_FRAME, "object-contain")}
            controls
            playsInline
            preload="auto"
            src={playback.url}
            aria-label={`${headerMeta} · ${headerTitle}`}
          />
        ) : (
          <div className={cn("relative", CLAKETE_PLAYER_FRAME)}>
            <iframe
              key={playback.url}
              title={`${headerMeta} · ${headerTitle}`}
              src={playback.url}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen *; gyroscope; picture-in-picture *; web-share"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )
      ) : (
        <div
          className={cn(
            CLAKETE_PLAYER_FRAME,
            "flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-white/40",
          )}
        >
          <p>{t("catalog.claketeUnavailable")}</p>
          <button
            type="button"
            onClick={backToList}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 underline-offset-4 hover:underline"
          >
            {t("series.backToEpisodes")}
          </button>
        </div>
      )}
    </ClaketePlayerShell>
  );
}
