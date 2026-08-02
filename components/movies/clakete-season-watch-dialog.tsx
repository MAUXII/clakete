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

async function fetchEpisodePlayback(
  seriesId: number,
  season: number,
  episode: number
): Promise<ClaketePlayback | null> {
  const res = await fetch(
    `/api/series/${seriesId}/playback-options?season=${season}&episode=${episode}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    ownUrl: string | null;
    iframeSources: { id: string; url: string }[];
  };
  const superflix = data.iframeSources?.find((s) => s.id === "superflix");
  if (superflix?.url) return { kind: "iframe", url: superflix.url };
  const first = data.iframeSources?.[0];
  if (first?.url) return { kind: "iframe", url: first.url };
  if (data.ownUrl) return { kind: "video", url: data.ownUrl };
  return null;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden border-border bg-card p-0 text-foreground",
          picking ? "max-w-md sm:max-w-md" : "max-w-3xl"
        )}
      >
        <DialogHeader className="space-y-1 border-b border-border px-5 py-4 text-left">
          {!picking ? (
            <button
              type="button"
              onClick={backToList}
              className="mb-1 inline-flex w-fit items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3" aria-hidden />
              {t("series.backToEpisodes")}
            </button>
          ) : null}
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {headerMeta}
          </p>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {headerTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {picking
              ? t("series.pickEpisodeToWatch")
              : t("catalog.claketePlayerHint")}
          </DialogDescription>
          {!picking && playback?.kind === "iframe" ? (
            <p className="text-[11px] leading-snug text-muted-foreground/80">
              {t("catalog.claketePlayerAdTip")}
            </p>
          ) : null}
        </DialogHeader>

        {picking ? (
          <div className="custom-scrollbar max-h-[min(58vh,440px)] overflow-y-auto">
            {episodes.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                {t("series.noEpisodes")}
              </p>
            ) : (
              <ul className="divide-y divide-border/70 px-1 py-1">
                {episodes.map((ep) => (
                  <li key={ep.id}>
                    <button
                      type="button"
                      onClick={() => void playEpisode(ep)}
                      className={cn(
                        "group flex w-full items-baseline gap-4 px-4 py-3.5 text-left transition-colors",
                        "hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      )}
                    >
                      <span className="w-7 shrink-0 text-right text-xs tabular-nums text-muted-foreground/70 transition-colors group-hover:text-muted-foreground">
                        {ep.episode_number}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground/90 transition-colors group-hover:text-foreground">
                        {ep.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="bg-black">
            {loading ? (
              <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : playback ? (
              playback.kind === "video" ? (
                <video
                  key={playback.url}
                  className="aspect-video w-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                  src={playback.url}
                  aria-label={`${headerMeta} · ${headerTitle}`}
                />
              ) : (
                <div className="relative aspect-video w-full">
                  <iframe
                    key={playback.url}
                    title={`${headerMeta} · ${headerTitle}`}
                    src={playback.url}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; accelerometer; gyroscope"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
                <p>{t("catalog.claketeUnavailable")}</p>
                <button
                  type="button"
                  onClick={backToList}
                  className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/80 underline-offset-4 hover:underline"
                >
                  {t("series.backToEpisodes")}
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
