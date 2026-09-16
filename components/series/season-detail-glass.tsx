"use client"

import { useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Tv, CheckCircle2 } from "lucide-react"
import { IoEye, IoEyeOutline } from "react-icons/io5"
import { toast } from "sonner"
import { MediaAtmosphere } from "@/components/media/media-atmosphere"
import { glassWideContainerClass } from "@/lib/page-container"
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass"
import EpisodesList from "@/components/series/episodes"
import WatchProviders from "@/components/movies/watchproviders"
import type { Movie } from "@/components/movies/film-detail-types"
import { cn } from "@/lib/utils"
import { useT } from "@/components/providers/i18n-provider"
import { useEpisodeInteractions } from "@/hooks/use-episode-interactions"
import type { SeasonDetailViewProps, SeasonDetail } from "@/components/series/season-detail-types"

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

export function SeasonDetailGlass({
  seriesId,
  season,
  seriesPath,
  seasonProgress,
  onProgressChange,
}: SeasonDetailViewProps) {
  const { t } = useT()

  const {
    user,
    watchedCount,
    setSeasonWatched,
    updatingSeason,
  } = useEpisodeInteractions(seriesId, season.season_number, {
    seriesEpisodeTotal: season.seriesEpisodeTotal,
    seriesTitle: season.seriesName,
    seriesPosterPath: season.seriesPosterPath ?? season.poster_path,
  })

  const total = season.episodes.length
  const allWatched = total > 0 && watchedCount >= total
  const percent = total > 0 ? Math.round((watchedCount / total) * 100) : 0

  const onToggleSeason = useCallback(async () => {
    if (!user) {
      toast.error(t("common.signIn"))
      return
    }
    const next = !allWatched
    const ok = await setSeasonWatched(
      season.episodes.map((e) => ({ episode_number: e.episode_number, id: e.id })),
      next
    )
    if (!ok) {
      toast.error(t("common.errorGeneric"))
      return
    }
    toast.success(
      next
        ? t("series.seasonMarkedWatched")
        : t("series.seasonUnmarkedWatched")
    )
  }, [user, allWatched, setSeasonWatched, season.episodes, t])

  const backdropUrl = season.seriesBackdrop
    ? `https://image.tmdb.org/t/p/original${season.seriesBackdrop}`
    : null
  const posterUrl = season.poster_path
    ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
    : season.seriesPosterPath
      ? `https://image.tmdb.org/t/p/w500${season.seriesPosterPath}`
      : null

  const year = season.air_date?.split("-")[0]
  const seasonDisplayName =
    season.name && season.name !== `Season ${season.season_number}`
      ? season.name
      : `Temporada ${season.season_number}`

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-background">
      <MediaAtmosphere
        coverUrl={backdropUrl || posterUrl}
        seed={`series-${seriesId}-season-${season.season_number}`}
      />

      <div
        className={cn(
          glassWideContainerClass,
          "relative z-10 mt-[calc(var(--ck-nav-h,3.25rem)+var(--clakete-promo-h,0px))] pb-24 pt-6 md:pt-10"
        )}
      >
        <article className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr] md:gap-10 lg:grid-cols-[300px_1fr] lg:gap-12">
          {/* Left Column: Sticky Poster + Actions */}
          <div className="flex flex-col items-center gap-4 md:items-start">
            <div className="w-full max-w-[280px] self-center md:max-w-none md:self-auto lg:sticky lg:top-[calc(var(--ck-nav-h,3.25rem)+var(--clakete-promo-h,0px)+1.5rem)]">
              {/* Poster */}
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[14px] bg-white/[0.04] shadow-[0_28px_56px_-18px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={seasonDisplayName}
                    fill
                    sizes="(max-width: 768px) 280px, 300px"
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-medium text-white/20">
                    ?
                  </div>
                )}
              </div>

              {/* Action Buttons Column */}
              <div className="mt-4 flex w-full flex-col gap-3">
                {/* Main Watch Season Button */}
                <button
                  type="button"
                  disabled={updatingSeason}
                  onClick={() => void onToggleSeason()}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-5 py-3.5 text-[15px] font-medium tracking-[-0.01em] transition duration-150 disabled:opacity-50",
                    allWatched
                      ? "bg-brand text-white shadow-[0_12px_24px_-8px_rgba(229,9,20,0.5)] hover:bg-brand/90"
                      : "bg-white text-black shadow-[0_12px_24px_-8px_rgba(255,255,255,0.25)] hover:bg-white/90 active:scale-[0.99]"
                  )}
                >
                  {allWatched ? (
                    <IoEye className="h-4.5 w-4.5 shrink-0" />
                  ) : (
                    <IoEyeOutline className="h-4.5 w-4.5 shrink-0" />
                  )}
                  <span>
                    {allWatched
                      ? t("series.unmarkSeasonWatched")
                      : t("series.markSeasonWatched")}
                  </span>
                </button>

                {/* Season Providers (Onde assistir) */}
                {season.watchProviders ? (
                  <LiquidGlass
                    className="rounded-[14px] p-4 text-xs shadow-sm"
                    blur={8}
                  >
                    <div className="mb-2 flex items-center gap-2 font-medium text-white/70">
                      <Tv className="h-3.5 w-3.5 text-white/50" />
                      <span>Onde assistir</span>
                    </div>
                    <SeasonWatchProviders seriesId={seriesId} season={season} />
                  </LiquidGlass>
                ) : null}

                {/* Back to series link */}
                <Link
                  href={seriesPath}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-white/70 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar para {season.seriesName}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Info & Episodes */}
          <div className="flex min-w-0 flex-col pt-1">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Link
                href={seriesPath}
                className="transition hover:text-white"
              >
                {season.seriesName}
              </Link>
              <span>/</span>
              <span className="text-white/80">Temporada {season.season_number}</span>
            </div>

            {/* Title */}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {seasonDisplayName}
            </h1>

            {/* Meta Line */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/50">
              {year ? <span>{year}</span> : null}
              {year && total > 0 ? <span>·</span> : null}
              {total > 0 ? (
                <span>
                  {total} {total === 1 ? "episódio" : "episódios"}
                </span>
              ) : null}
              {total > 0 ? <span>·</span> : null}
              <span className="inline-flex items-center gap-1.5 font-medium text-white/80">
                {allWatched ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                ) : null}
                {watchedCount} de {total} assistidos ({percent}%)
              </span>
            </div>

            {/* Progress Bar */}
            {total > 0 ? (
              <div className="mt-3.5 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            ) : null}

            {/* Overview / Synopsis */}
            {season.overview ? (
              <div className="mt-6 border-t border-white/[0.08] pt-6">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Sinopse
                </h2>
                <p className="mt-2 text-[15px] font-light leading-7 text-white/70">
                  {season.overview}
                </p>
              </div>
            ) : null}

            {/* Episodes List Section */}
            <div className="mt-8 border-t border-white/[0.08] pt-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Episódios
                </h2>
                <span className="text-xs text-white/40">
                  {total} {total === 1 ? "episódio disponível" : "episódios disponíveis"}
                </span>
              </div>

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
        </article>
      </div>
    </div>
  )
}
