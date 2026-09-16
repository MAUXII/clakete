"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { IoEye, IoEyeOutline } from "react-icons/io5";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEpisodeInteractions } from "@/hooks/use-episode-interactions";
import { useT } from "@/components/providers/i18n-provider";
import { useDesignMode } from "@/hooks/use-design-mode";
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
  seriesEpisodeTotal?: number | null;
  onProgressChange?: (watched: number, total: number) => void;
};

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

  const {
    user,
    watchedCount,
    isWatched,
    toggleWatched,
    setSeasonWatched,
    updatingEpisode,
    updatingSeason,
  } = useEpisodeInteractions(seriesId, seasonNumber, {
    seriesEpisodeTotal,
    seriesTitle: seriesName,
    seriesPosterPath,
  });

  const total = episodes.length;
  const allWatched = total > 0 && watchedCount >= total;

  useEffect(() => {
    onProgressChange?.(watchedCount, total);
  }, [watchedCount, total, onProgressChange]);

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

  const designMode = useDesignMode();
  const isGlass = designMode === "glass";

  if (!episodes.length) {
    return (
      <div className={cn(isGlass ? "text-white/40" : "text-muted-foreground")}>{t("series.noEpisodes")}</div>
    );
  }

  return (
    <>
      {!isGlass && user ? (
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

      <div className="flex flex-col gap-5 sm:gap-6">
        {episodes.map((ep) => {
          const watched = isWatched(ep.episode_number);
          return (
            <div
              key={ep.id}
              className={cn(
                "flex flex-col gap-4 sm:flex-row sm:gap-6",
                isGlass && "rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm transition-all duration-200 hover:border-white/15 hover:bg-white/[0.04]"
              )}
            >
              <div
                className={cn(
                  "group relative w-full shrink-0 self-start overflow-hidden sm:max-w-[300px] sm:basis-[300px]",
                  isGlass
                    ? cn("rounded-[12px] ring-1 transition-all", watched ? "ring-brand/50" : "ring-white/10")
                    : cn("rounded-md border", watched ? "border-brand/40" : "border-black/20 dark:border-white/20")
                )}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted-foreground/10">
                  {ep.still_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${ep.still_path}`}
                      alt={ep.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 300px"
                      className={cn(
                        "object-cover object-center",
                        watched && "opacity-80"
                      )}
                    />
                  ) : (
                    <div className="flex h-full min-h-[160px] w-full items-center justify-center font-medium text-2xl text-muted-foreground">
                      ?
                    </div>
                  )}

                  {watched ? (
                    <span
                      className={cn(
                        "pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide shadow-sm ring-1",
                        isGlass
                          ? "bg-black/75 text-white ring-white/15 backdrop-blur-md"
                          : "bg-background/90 text-foreground ring-border"
                      )}
                    >
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
                        "absolute bottom-2 right-2 z-10 flex size-9 items-center justify-center rounded-full shadow-sm ring-1 transition",
                        isGlass
                          ? "bg-black/70 text-white ring-white/15 backdrop-blur-md hover:bg-black/90 hover:scale-105 active:scale-95"
                          : "bg-background/90 text-foreground ring-border",
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
                <p className={cn("font-medium text-xs uppercase tracking-wider", isGlass ? "text-brand" : "text-muted-foreground/50")}>
                  Episode {ep.episode_number}
                </p>
                <h3 className={cn("mt-1 text-lg font-semibold tracking-tight", isGlass ? "text-white" : "text-foreground")}>
                  {ep.name}
                </h3>
                <p className={cn("mt-1.5 text-xs", isGlass ? "text-white/40" : "text-muted-foreground")}>
                  {ep.air_date ?? "—"}
                  {ep.runtime != null && ep.runtime > 0
                    ? ` • ${ep.runtime} min`
                    : ""}
                </p>
                {ep.overview ? (
                  <p className={cn("mt-2.5 line-clamp-3 text-sm leading-relaxed", isGlass ? "font-light text-white/70" : "text-muted-foreground")}>
                    {ep.overview}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
