"use client";

import { useEffect, useState, use, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EpisodesList, { type SeasonEpisode } from "@/components/series/episodes";
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell";
import { cn } from "@/lib/utils";

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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">{children}</h2>
      <div className="h-px min-w-0 flex-1 bg-white/[0.08]" aria-hidden />
    </div>
  );
}

const SEASON_LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)";
const SEASON_POSTER_ALIGN_MARGIN = `max(-5rem, calc(min(92vw, 304px) * 0.75 + 8rem - ${SEASON_LETTERBOX_HEIGHT}))`;

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
      <div className="min-h-screen w-full overflow-x-clip bg-[#09090B]">
        <FilmsCatalogShell>
          <div
            className="relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#09090B]"
            style={{ height: SEASON_LETTERBOX_HEIGHT }}
            aria-hidden
          />
          <div className="relative z-10 mt-0 flex flex-col gap-12 px-5 pt-2 sm:px-8 lg:flex-row lg:items-start lg:gap-16 lg:px-10 xl:gap-20">
            <div
              className="mx-auto flex w-full max-w-[260px] shrink-0 flex-col gap-3 self-start sm:max-w-[280px] lg:mx-0 lg:max-w-[304px]"
              style={{ marginTop: SEASON_POSTER_ALIGN_MARGIN }}
            >
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="-mt-36 aspect-[2/3] w-full rounded-2xl" />
            </div>
            <div className="min-w-0 flex-1 space-y-6 pt-1">
              <div className="space-y-3">
                <Skeleton className="h-9 w-[min(100%,420px)]" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </FilmsCatalogShell>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-[#09090B]">
        <FilmsCatalogShell>
          <h1 className="text-2xl font-semibold tracking-tight">Season not found</h1>
          <Link
            href={`/series/${id}`}
            className="-mt-10 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to series
          </Link>
        </FilmsCatalogShell>
      </div>
    );
  }

  const backdropUrl = season.seriesBackdrop
    ? `https://image.tmdb.org/t/p/original${season.seriesBackdrop}`
    : null;
  const posterUrl = season.poster_path
    ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
    : null;
  const year = season.air_date?.split("-")[0];
  const episodeCount = season.episodes.length;
  const metaLine = [year, `${episodeCount} episode${episodeCount === 1 ? "" : "s"}`].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#09090B]">
      <FilmsCatalogShell>
        <div
          className="pointer-events-none -mt-16 relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#09090B]"
          style={{ height: SEASON_LETTERBOX_HEIGHT }}
          aria-hidden
        >
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.06),transparent_55%)]" />
          )}
          <div
            className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.18)_0%,transparent_38%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/10"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(to_top,#09090B_0%,#09090B_0%,rgba(9,9,11,0.55)_32%,transparent_62%)]"
            aria-hidden
          />
          <img
            src="/noise.avif"
            alt=""
            className="pointer-events-none absolute inset-0 z-[4] h-full w-full object-cover opacity-[0.02]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 flex flex-col gap-12 pt-2 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
          <aside
            className="sticky top-[calc(env(safe-area-inset-top,0px)+14rem)] z-20 mx-auto w-full max-w-[260px] shrink-0 self-start sm:max-w-[280px] lg:mx-0 lg:max-w-[304px]"
            style={{ marginTop: SEASON_POSTER_ALIGN_MARGIN }}
          >
            <div className="flex flex-col gap-4">
              <div className="-mt-36 overflow-hidden rounded-2xl border border-white/[0.1] bg-zinc-950">
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={season.name}
                      className="absolute inset-0 block h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-3xl font-medium text-zinc-600">
                      ?
                    </div>
                  )}
                </div>
              </div>
              <nav aria-label="Breadcrumb" className="px-0.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">Series</p>
                <ol className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] leading-snug">
                  <li className="min-w-0">
                    <Link
                      href={`/series/${id}`}
                      className="font-medium text-zinc-200 transition-colors hover:text-white"
                    >
                      {season.seriesName}
                    </Link>
                  </li>
                  <li className="select-none font-normal text-zinc-600" aria-hidden>
                    &gt;
                  </li>
                  <li className="font-normal text-zinc-500" aria-current="page">
                    Season {season.season_number}
                  </li>
                </ol>
              </nav>
            </div>
          </aside>

          <div className="mt-6 flex min-w-0 flex-1 flex-col gap-12 sm:mt-8 lg:mt-8 lg:max-w-none">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12 xl:gap-16">
              <header className="min-w-0 max-w-xl space-y-2">
                <p className="text-pretty text-sm text-zinc-500">{season.seriesName}</p>
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Season {season.season_number}
                </h1>
                {season.name && season.name !== `Season ${season.season_number}` ? (
                  <p className="text-pretty text-sm leading-snug text-zinc-500 sm:text-[0.9375rem]">{season.name}</p>
                ) : null}
              </header>

              {metaLine ? (
                <div className="w-full shrink-0 border-t border-white/[0.08] pt-6 text-sm tabular-nums text-zinc-400 sm:w-auto lg:border-t-0 lg:pt-1 lg:text-right">
                  {metaLine}
                </div>
              ) : null}
            </div>

            {season.overview ? (
              <div className="-mt-2 flex flex-col gap-4">
                <SectionLabel>Overview</SectionLabel>
                <p className="max-w-3xl text-pretty text-sm leading-relaxed text-zinc-500 sm:text-[0.9375rem] lg:max-w-4xl">
                  {season.overview}
                </p>
              </div>
            ) : null}

            <div className={cn(season.overview ? "" : "-mt-2")}>
              <div className="flex flex-col gap-6">
                <SectionLabel>Episodes</SectionLabel>
                <EpisodesList episodes={season.episodes} />
              </div>
            </div>
          </div>
        </div>
      </FilmsCatalogShell>
    </div>
  );
}
