"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaketeWatchDialog } from "@/components/movies/clakete-watch-dialog";
import { useSubscription } from "@/hooks/use-subscription";
import {
  useClaketeWatch,
  type ClaketePlayback,
} from "@/hooks/use-clakete-watch";
import { useT } from "@/components/providers/i18n-provider";

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
}: EpisodesListProps) {
  const { t } = useT();
  const { isShining, loading: subscriptionLoading } = useSubscription();
  const canUse = !subscriptionLoading && isShining;

  // Uma checagem de catálogo por temporada (S{n}E1); botões só se a série estiver disponível.
  const { available: seriesAvailable, loading: availabilityLoading } =
    useClaketeWatch(seriesId, canUse, {
      mediaType: "tv",
      season: seasonNumber,
      episode: 1,
    });

  const showWatch = canUse && (availabilityLoading || seriesAvailable);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [playback, setPlayback] = useState<ClaketePlayback | null>(null);
  const [loadingEpisode, setLoadingEpisode] = useState<number | null>(null);

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
      } finally {
        setLoadingEpisode(null);
      }
    },
    [seriesAvailable, seriesId, seasonNumber, seriesName]
  );

  if (!episodes.length) {
    return <div className="text-muted-foreground">Nenhum episódio encontrado.</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {episodes.map((ep) => (
          <div
            key={ep.id}
            className="flex flex-col gap-4 border-b border-black/10 pb-8 last:border-b-0 dark:border-white/10 sm:flex-row sm:gap-6"
          >
            <div className="relative w-full shrink-0 overflow-hidden rounded-md border border-black/20 dark:border-white/20 sm:max-w-[320px] sm:basis-[320px]">
              <div className="relative aspect-video w-full bg-muted-foreground/10">
                {ep.still_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${ep.still_path}`}
                    alt={ep.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[180px] w-full items-center justify-center font-medium text-2xl text-muted-foreground">
                    ?
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-muted-foreground/50 text-xs uppercase">
                Episode {ep.episode_number}
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">{ep.name}</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                {ep.air_date ?? "—"}
                {ep.runtime != null && ep.runtime > 0 ? ` • ${ep.runtime} min` : ""}
                {typeof ep.vote_average === "number" && ep.vote_average > 0
                  ? ` • ${ep.vote_average.toFixed(1)} ★`
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
        ))}
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
