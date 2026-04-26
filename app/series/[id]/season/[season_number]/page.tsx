"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import EpisodesList, { type SeasonEpisode } from "@/components/series/episodes";

interface SeasonDetail {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  air_date: string | null;
  poster_path: string | null;
  seriesName: string;
  seriesBackdrop: string | null;
  episodes: SeasonEpisode[];
}

export default function SeriesSeasonPage({
  params,
}: {
  params: Promise<{ id: string; season_number: string }>;
}) {
  const { id, season_number } = use(params);
  const [season, setSeason] = useState<SeasonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSeason() {
      try {
        const response = await fetch(`/api/series/${id}/season/${season_number}`);
        const data = await response.json();
        if (response.ok) {
          setSeason(data);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSeason();
  }, [id, season_number]);

  if (loading) {
    return (
      <div className="py-8 mt-20 px-4 w-full max-w-[1280px]">
        <Skeleton className="h-[550px] w-full rounded-lg" />
        <div className="px-8">
          <Skeleton className="-mt-48 aspect-[2/3] w-56 rounded-2xl object-cover" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="py-8 mt-20 px-4 w-full max-w-[1280px]">
        <h1 className="text-2xl font-bold">Temporada não encontrada</h1>
        <Link href={`/series/${id}`} className="mt-4 inline-block text-sm text-muted-foreground underline hover:text-foreground">
          Voltar para a série
        </Link>
      </div>
    );
  }

  const backdropUrl = season.seriesBackdrop
    ? `https://image.tmdb.org/t/p/original${season.seriesBackdrop}`
    : undefined;
  const year = season.air_date?.split("-")[0] ?? "—";

  return (
    <div className="py-8 mt-20 px-4 w-full max-w-[1280px]">
      <div
        className="relative h-[500px] w-full rounded-lg border border-black/20 bg-muted bg-cover bg-center dark:border-white/20"
        style={
          backdropUrl
            ? {
                backgroundImage: `url(${backdropUrl})`,
                backgroundPosition: "center 20%",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="w-full px-8">
        <div className="relative z-10">
          <div className="flex gap-6">
            <div className="relative w-72">
              <div className="sticky top-4">
                {season.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${season.poster_path}`}
                    alt={season.name}
                    className="-mt-36 aspect-[2/3] w-full rounded-2xl object-cover ring-1 ring-black/20 dark:ring-white/20"
                  />
                ) : (
                  <div className="-mt-36 flex aspect-[2/3] w-full items-center justify-center rounded-2xl bg-muted-foreground/10 text-2xl font-medium ring-1 ring-black/20 dark:ring-white/20">
                    ?
                  </div>
                )}
                <div className="mt-4 w-full flex-col">
                  <p className="font-medium text-muted-foreground/50 text-sm uppercase">{year}</p>
                  <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
                  <Link
                    href={`/series/${id}`}
                    className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    ← {season.seriesName}
                  </Link>
                </div>
              </div>
            </div>

            <div className="ml-6 mt-6 flex flex-1 flex-col">
              <h1 className="mb-2 max-w-3xl text-3xl font-bold">
                {season.seriesName} • Season {season.season_number}
              </h1>
              <div className="text-muted-foreground">
                {year} • {season.episodes.length} episodes
              </div>
              {season.overview ? (
                <div className="mt-4">
                  <p className="leading-relaxed text-muted-foreground">{season.overview}</p>
                </div>
              ) : null}

              <div className="mt-8">
                <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Episodes</h2>
                <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
                <EpisodesList episodes={season.episodes} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
