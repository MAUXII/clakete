"use client"

import { type ReactNode, type CSSProperties } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import EpisodesList from "@/components/series/episodes"
import WatchProviders from "@/components/movies/watchproviders"
import type { Movie } from "@/components/movies/film-detail-types"
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell"
import { cn } from "@/lib/utils"
import { useT } from "@/components/providers/i18n-provider"
import { useEpisodeInteractions } from "@/hooks/use-episode-interactions"
import type { SeasonDetailViewProps, SeasonDetail } from "@/components/series/season-detail-types"

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{children}</h2>
      <div className="h-px min-w-0 flex-1 bg-muted" aria-hidden />
    </div>
  )
}

function SeasonWatchProviders({
  seriesId,
  season,
}: {
  seriesId: number
  season: SeasonDetail
}) {
  const { markWatched } = useEpisodeInteractions(
    seriesId,
    season.season_number,
    {
      seriesEpisodeTotal: season.seriesEpisodeTotal,
      seriesTitle: season.seriesName,
      seriesPosterPath: season.seriesPosterPath ?? season.poster_path,
    }
  )

  const movieCompat = {
    id: seriesId,
    title: season.seriesName,
    poster_path: season.seriesPosterPath ?? season.poster_path ?? "",
    backdrop_path: season.seriesBackdrop ?? "",
    release_date: season.air_date ?? "",
    tagline: null,
    overview: season.overview,
    runtime: 0,
    images: { backdrops: [], posters: [] },
    director: "",
    similar: { results: [] },
    recommendations: { results: [] },
    videos: { results: [] },
    genres: [],
    watchProviders: season.watchProviders,
  } as unknown as Movie

  return (
    <WatchProviders
      movie={movieCompat}
      hideHeading
      omitTrailerButton
      mediaType="tv"
      seasonNumber={season.season_number}
      episodes={season.episodes.map((ep) => ({
        id: ep.id,
        episode_number: ep.episode_number,
        name: ep.name,
      }))}
      onClaketeEpisodePlay={(ep) => {
        void markWatched(ep.episode_number, ep.id)
      }}
    />
  )
}

const SEASON_LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)"
const SEASON_POSTER_ALIGN_MARGIN = `max(-5rem, calc(min(92vw, 304px) * 0.75 + 8rem - ${SEASON_LETTERBOX_HEIGHT}))`
const SEASON_POSTER_STICKY_TOP =
  "lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)_+_4.5rem_+_var(--clakete-promo-h,0px)_+_1.5rem)] xl:top-[calc(env(safe-area-inset-top,0px)_+_4.5rem_+_var(--clakete-promo-h,0px)_+_1.5rem)]"

export function SeasonDetailClassic({
  seriesId,
  season,
  seriesPath,
  seasonProgress,
  onProgressChange,
}: SeasonDetailViewProps) {
  const { t } = useT()

  const backdropUrl = season.seriesBackdrop
    ? `https://image.tmdb.org/t/p/original${season.seriesBackdrop}`
    : null
  const posterUrl = season.poster_path
    ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
    : null
  const year = season.air_date?.split("-")[0]
  const episodeCount = season.episodes.length
  const metaLine = [year, `${episodeCount} episode${episodeCount === 1 ? "" : "s"}`].filter(Boolean).join(" · ")

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-background">
      <FilmsCatalogShell>
        <div
          className="pointer-events-none mt-[calc(3.75rem+var(--clakete-promo-h,0px))] relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-background"
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
            className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0.18)_0%,transparent_38%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/10"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background))_0%,hsl(var(--background)/0.55)_32%,transparent_62%)]"
            aria-hidden
          />
          <img
            src="/noise.avif"
            alt=""
            className="pointer-events-none absolute inset-0 z-[4] h-full w-full object-cover opacity-[0.02]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 flex flex-col gap-12 pt-2 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
          <aside
            className={cn(
              "z-20 mx-auto w-full max-w-[260px] shrink-0 self-start sm:max-w-[280px] lg:mx-0 lg:max-w-[304px]",
              SEASON_POSTER_STICKY_TOP,
            )}
            style={{ marginTop: `calc((${SEASON_POSTER_ALIGN_MARGIN}) - 9rem)` }}
          >
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-card">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={season.name}
                      className="absolute inset-0 block h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted text-3xl font-medium text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
                <div className="border-t border-border">
                  <SeasonWatchProviders
                    seriesId={seriesId}
                    season={season}
                  />
                </div>
              </div>
              <nav aria-label="Breadcrumb" className="px-0.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Series</p>
                <ol className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] leading-snug">
                  <li className="min-w-0">
                    <Link
                      href={seriesPath}
                      className="font-medium text-foreground transition-colors hover:text-foreground"
                    >
                      {season.seriesName}
                    </Link>
                  </li>
                  <li className="select-none font-normal text-muted-foreground" aria-hidden>
                    &gt;
                  </li>
                  <li className="font-normal text-muted-foreground" aria-current="page">
                    Season {season.season_number}
                  </li>
                </ol>
              </nav>
            </div>
          </aside>

          <div className="mt-6 flex min-w-0 flex-1 flex-col gap-12 sm:mt-8 lg:mt-8 lg:max-w-none">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12 xl:gap-16">
              <header className="min-w-0 max-w-xl space-y-2">
                <p className="text-pretty text-sm text-muted-foreground">{season.seriesName}</p>
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Season {season.season_number}
                </h1>
                {season.name && season.name !== `Season ${season.season_number}` ? (
                  <p className="text-pretty text-sm leading-snug text-muted-foreground sm:text-[0.9375rem]">{season.name}</p>
                ) : null}
                {seasonProgress && seasonProgress.total > 0 ? (
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {t("series.seasonWatchedProgress", {
                      watched: seasonProgress.watched,
                      total: seasonProgress.total,
                    })}
                  </p>
                ) : null}
              </header>

              {metaLine ? (
                <div className="w-full shrink-0 border-t border-border pt-6 text-sm tabular-nums text-muted-foreground sm:w-auto lg:border-t-0 lg:pt-1 lg:text-right">
                  {metaLine}
                </div>
              ) : null}
            </div>

            {season.overview ? (
              <div className="-mt-2 flex flex-col gap-4">
                <SectionLabel>Overview</SectionLabel>
                <p className="max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] lg:max-w-4xl">
                  {season.overview}
                </p>
              </div>
            ) : null}

            <div className={cn(season.overview ? "" : "-mt-2")}>
              <div className="flex flex-col gap-6">
                <SectionLabel>Episodes</SectionLabel>
                <EpisodesList
                  episodes={season.episodes}
                  seriesId={seriesId}
                  seasonNumber={season.season_number}
                  seriesName={season.seriesName}
                  seriesPosterPath={season.seriesPosterPath ?? season.poster_path}
                  seriesEpisodeTotal={season.seriesEpisodeTotal}
                  onProgressChange={onProgressChange}
                />
              </div>
            </div>
          </div>
        </div>
      </FilmsCatalogShell>
    </div>
  )
}
