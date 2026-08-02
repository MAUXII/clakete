"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { IoEye, IoEyeOutline } from "react-icons/io5";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClaketeWatchDialog } from "@/components/movies/clakete-watch-dialog";
import { useSubscription } from "@/hooks/use-subscription";
import {
  useClaketeWatch,
  type ClaketePlayback,
} from "@/hooks/use-clakete-watch";
import { useEpisodeInteractions } from "@/hooks/use-episode-interactions";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export interface SeasonEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

type EpisodesListProps = {
  episodes: SeasonEpisode[];
  seriesId: number;
  seasonNumber: number;
  seriesName?: string;
  seriesPosterPath?: string | null;
  /** Total de episódios da série (TMDB). Se completo → marca a série. */
  seriesEpisodeTotal?: number | null;
  onProgressChange?: (watched: number, total: number) => void;
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

export default function EpisodesList({
  episodes,
  seriesId,
  seasonNumber,
  seriesName,
  seriesPosterPath,
  seriesEpisodeTotal,
  onProgressChange,
}: EpisodesListProps) {
  const { t } = useT();
  const { isShining, loading: subscriptionLoading } = useSubscription();
  const canUse = !subscriptionLoading && isShining;

  const { available: seriesAvailable, loading: availabilityLoading } =
    useClaketeWatch(seriesId, canUse, {
      mediaType: "tv",
      season: seasonNumber,
      episode: 1,
    });

  const showWatch = canUse && (availabilityLoading || seriesAvailable);

  const {
    user,
    watchedCount,
    isWatched,
    toggleWatched,
    markWatched,
    setSeasonWatched,
    updatingEpisode,
    updatingSeason,
  } = useEpisodeInteractions(seriesId, seasonNumber, {
    seriesEpisodeTotal,
    seriesTitle: seriesName,
    seriesPosterPath,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [playback, setPlayback] = useState<ClaketePlayback | null>(null);
  const [loadingEpisode, setLoadingEpisode] = useState<number | null>(null);

  const total = episodes.length;
  const allWatched = total > 0 && watchedCount >= total;

  useEffect(() => {
    onProgressChange?.(watchedCount, total);
  }, [watchedCount, total, onProgressChange]);

  const openEpisode = useCallback(
    async (ep: SeasonEpisode) => {
      if (!seriesAvailable) return;
      const title = [
        seriesName,
        `S${seasonNumber}E${ep.episode_number}`,
        ep.name,
      ]
        .filter(Boolean)
        .join(" · ");

      setDialogTitle(title);
      setDialogOpen(true);
      setPlayback(null);
      setLoadingEpisode(ep.episode_number);

      try {
        const next = await fetchEpisodePlayback(
          seriesId,
          seasonNumber,
          ep.episode_number
        );
        setPlayback(next);
        if (next && user) {
          await markWatched(ep.episode_number, ep.id);
        }
      } finally {
        setLoadingEpisode(null);
      }
    },
    [
      seriesAvailable,
      seriesId,
      seasonNumber,
      seriesName,
      user,
      markWatched,
    ]
  );

  const onToggleWatched = useCallback(
    async (ep: SeasonEpisode) => {
      if (!user) {
        toast.error(t("common.signIn"));
        return;
      }
      const next = await toggleWatched(ep.episode_number, ep.id);
      if (next === null) {
        toast.error(t("common.errorGeneric"));
        return;
      }
      toast.success(
        next ? t("watch.markedWatched") : t("watch.unmarkedWatched")
      );
    },
    [user, toggleWatched, t]
  );

  const onToggleSeason = useCallback(async () => {
    if (!user) {
      toast.error(t("common.signIn"));
      return;
    }
    const next = !allWatched;
    const ok = await setSeasonWatched(
      episodes.map((e) => ({ episode_number: e.episode_number, id: e.id })),
      next
    );
    if (!ok) {
      toast.error(t("common.errorGeneric"));
      return;
    }
    toast.success(
      next
        ? t("series.seasonMarkedWatched")
        : t("series.seasonUnmarkedWatched")
    );
  }, [user, allWatched, setSeasonWatched, episodes, t]);

  if (!episodes.length) {
    return (
      <div className="text-muted-foreground">Nenhum episódio encontrado.</div>
    );
  }

  return (
    <>
      {user ? (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm tabular-nums text-muted-foreground">
            {t("series.seasonWatchedProgress", {
              watched: String(watchedCount),
              total: String(total),
            })}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={updatingSeason}
            onClick={() => void onToggleSeason()}
            className="gap-1.5"
          >
            {allWatched ? (
              <IoEye className="size-3.5" aria-hidden />
            ) : (
              <IoEyeOutline className="size-3.5" aria-hidden />
            )}
            {allWatched
              ? t("series.unmarkSeasonWatched")
              : t("series.markSeasonWatched")}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-8">
        {episodes.map((ep) => {
          const watched = isWatched(ep.episode_number);
          return (
            <div
              key={ep.id}
              className="flex flex-col gap-4 border-b border-black/10 pb-8 last:border-b-0 dark:border-white/10 sm:flex-row sm:gap-6"
            >
              <div
                className={cn(
                  "group relative w-full shrink-0 overflow-hidden rounded-md border sm:max-w-[320px] sm:basis-[320px]",
                  watched
                    ? "border-brand/40"
                    : "border-black/20 dark:border-white/20"
                )}
              >
                <div className="relative aspect-video w-full bg-muted-foreground/10">
                  {ep.still_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${ep.still_path}`}
                      alt={ep.name}
                      fill
                      className={cn("object-cover", watched && "opacity-80")}
                    />
                  ) : (
                    <div className="flex h-full min-h-[180px] w-full items-center justify-center font-medium text-2xl text-muted-foreground">
                      ?
                    </div>
                  )}

                  {watched ? (
                    <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground shadow-sm ring-1 ring-border">
                      <IoEye className="size-3 text-brand" aria-hidden />
                      {t("film.watched")}
                    </span>
                  ) : null}

                  {user ? (
                    <button
                      type="button"
                      disabled={updatingEpisode === ep.episode_number}
                      onClick={(e) => {
                        e.stopPropagation();
                        void onToggleWatched(ep);
                      }}
                      className={cn(
                        "absolute bottom-2 right-2 z-10 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-border transition",
                        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
                        watched && "text-brand sm:opacity-100"
                      )}
                      title={
                        watched
                          ? t("film.unmarkWatched")
                          : t("film.markWatched")
                      }
                      aria-label={
                        watched
                          ? t("film.unmarkWatched")
                          : t("film.markWatched")
                      }
                      aria-pressed={watched}
                    >
                      {watched ? (
                        <IoEye className="size-4" aria-hidden />
                      ) : (
                        <IoEyeOutline className="size-4" aria-hidden />
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-muted-foreground/50 text-xs uppercase">
                  Episode {ep.episode_number}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">
                  {ep.name}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  {ep.air_date ?? "—"}
                  {ep.runtime != null && ep.runtime > 0
                    ? ` • ${ep.runtime} min`
                    : ""}
                </p>
                {ep.overview ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {ep.overview}
                  </p>
                ) : null}
                {showWatch && seriesAvailable ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={loadingEpisode === ep.episode_number}
                    onClick={() => void openEpisode(ep)}
                    className="mt-3 gap-1.5"
                  >
                    <Play className="size-3.5 fill-current" aria-hidden />
                    {t("catalog.watchOnClakete")}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {showWatch ? (
        <ClaketeWatchDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={dialogTitle || "Clakete"}
          playback={playback}
        />
      ) : null}
    </>
  );
}
