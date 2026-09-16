"use client"

import { useState, type ReactNode, type CSSProperties } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FilmActions } from "@/components/movies/film-actions"
import { LogWatchDialog } from "@/components/movies/log-watch-dialog"
import { ConfirmUnwatchDialog } from "@/components/movies/confirm-unwatch-dialog"
import { ShareCardDialog } from "@/components/movies/share-card-dialog"
import { StarRating } from "@/components/movies/star-rating"
import { FilmReviewsList } from "@/components/movies/film-reviews-list"
import { formatRewatchLabel, formatWatchedDate } from "@/lib/watched-date"
import { MediaDetailTabs } from "@/components/ui/media-detail-tabs"
import WatchProviders from "@/components/movies/watchproviders"
import Trailer from "@/components/movies/trailer"
import { FaPlay } from "react-icons/fa6"
import SimilarSeriesList from "@/components/series/similar"
import RecommendedSeriesList from "@/components/series/recommendations"
import SeasonsList from "@/components/series/seasons"
import CreditsList from "@/components/series/credits"
import ImagesList from "@/components/movies/imagesList"
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useT } from "@/components/providers/i18n-provider"
import { prefetchDiaryArt } from "@/lib/client/diary-dialog-art"
import { toast } from "sonner"
import { FilmExternalRatings } from "@/components/movies/film-external-ratings"
import type { Movie } from "@/components/movies/film-detail-types"
import type { SeriesDetailViewProps } from "@/components/series/series-detail-types"
import { formatRuntime } from "@/components/series/series-detail-types"

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{children}</h2>
      <div className="h-px min-w-0 flex-1 bg-muted" aria-hidden />
    </div>
  )
}

const SERIES_LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)"
const SERIES_POSTER_ALIGN_MARGIN = `max(-5rem, calc(min(92vw, 304px) * 0.75 + 8rem - ${SERIES_LETTERBOX_HEIGHT}))`
const SERIES_POSTER_STICKY_TOP =
  "lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)_+_4.5rem_+_var(--clakete-promo-h,0px)_+_1.5rem)] xl:top-[calc(env(safe-area-inset-top,0px)_+_4.5rem_+_var(--clakete-promo-h,0px)_+_1.5rem)]"

export function SeriesDetailClassic({
  series,
  isWatched,
  isLiked,
  isInWatchlist,
  rating,
  review,
  watchedDate,
  rewatchCount,
  hasDiaryLogs,
  loading,
  interactionsLoading,
  updating,
  setRating,
  toggleWatched,
  toggleLiked,
  toggleWatchlist,
  logWatch,
  unwatch,
  removeFromDiary,
}: SeriesDetailViewProps) {
  const { t } = useT()
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [logWatchOpen, setLogWatchOpen] = useState(false)
  const [unwatchOpen, setUnwatchOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [posterTrailerHover, setPosterTrailerHover] = useState(false)
  const [trailerBtnFocused, setTrailerBtnFocused] = useState(false)

  const displayTitle = series.title || series.name || ""
  const backdropUrl = series.backdrop_path
    ? `https://image.tmdb.org/t/p/original${series.backdrop_path}`
    : null
  const posterUrl = series.poster_path
    ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
    : "/placeholder.png"
  const year = series.first_air_date?.split("-")[0] || series.release_date?.split("-")[0]
  const seasonsLabel =
    series.number_of_seasons > 0 ? `${series.number_of_seasons} season${series.number_of_seasons === 1 ? "" : "s"}` : null
  const runtimeLabel = formatRuntime(series.runtime)
  const metaLine = [year, seasonsLabel, runtimeLabel].filter(Boolean).join(" · ")
  const youtubeTrailer = series.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  )
  const trailerPosterUiActive = posterTrailerHover || trailerBtnFocused
  const movieCompat = series as unknown as Movie

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-background">
      <FilmsCatalogShell>
        <div
          className="pointer-events-none mt-[calc(3.75rem+var(--clakete-promo-h,0px))] relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-background"
          style={{ height: SERIES_LETTERBOX_HEIGHT }}
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
              "z-20 w-full shrink-0 self-start -mt-20 sm:-mt-24 lg:mx-0 lg:max-w-[304px] lg:[margin-top:calc(var(--poster-mt)_-_9rem)]",
              SERIES_POSTER_STICKY_TOP,
            )}
            style={{ "--poster-mt": SERIES_POSTER_ALIGN_MARGIN } as CSSProperties}
          >
            <div className="flex flex-col gap-3">
              <Link
                href="/series/discover"
                className="pointer-events-auto inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:hidden"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                {t("film.backToCatalog")}
              </Link>
              {/* Mobile: poster left + title/meta right. Desktop: poster only. */}
              <div className="flex items-end gap-4 lg:block">
                <div className="w-[44%] max-w-[210px] shrink-0 lg:w-full lg:max-w-none">
                  <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div
                      className="relative aspect-[2/3] w-full overflow-hidden bg-card"
                      onMouseEnter={() => {
                        if (youtubeTrailer) setPosterTrailerHover(true)
                      }}
                      onMouseLeave={() => setPosterTrailerHover(false)}
                    >
                      <img
                        src={posterUrl}
                        alt={displayTitle}
                        className="absolute inset-0 block h-full w-full object-cover"
                      />
                      {youtubeTrailer ? (
                        <motion.button
                          type="button"
                          aria-label="Watch trailer"
                          initial={false}
                          animate={{
                            opacity: trailerPosterUiActive ? 1 : 0,
                          }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          style={{ pointerEvents: trailerPosterUiActive ? "auto" : "none" }}
                          className={cn(
                            "absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/10",
                            "outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          )}
                          onClick={() => setTrailerOpen(true)}
                          onFocus={() => setTrailerBtnFocused(true)}
                          onBlur={() => setTrailerBtnFocused(false)}
                        >
                          <motion.span
                            className={cn(
                              "pointer-events-none inline-flex origin-center items-center gap-3 rounded-full border border-border",
                              "bg-muted/50 px-1.5 py-1.5 pl-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-border",
                            )}
                            initial={false}
                            animate={
                              trailerPosterUiActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }
                            }
                            transition={{
                              duration: 0.4,
                              opacity: { duration: 0.4 },
                              scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
                            }}
                            whileTap={{ scale: 0.94 }}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                              <FaPlay className="ml-0.5 h-3.5 w-3.5" aria-hidden />
                            </span>
                            <span className="pr-4 text-sm font-medium tracking-tight text-foreground">
                              {t("film.trailer")}
                            </span>
                          </motion.span>
                        </motion.button>
                      ) : null}
                    </div>
                    <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movieCompat} />
                    <div className="hidden border-t border-border lg:block">
                      <WatchProviders movie={movieCompat} hideHeading omitTrailerButton mediaType="tv" />
                    </div>
                  </div>
                </div>
                {/* Mobile-only meta beside the poster */}
                <div className="min-w-0 flex-1 space-y-2 pb-1 lg:hidden">
                  <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
                    {displayTitle}
                  </h1>
                  {series.tagline ? (
                    <p className="text-pretty text-xs leading-snug text-muted-foreground">{series.tagline}</p>
                  ) : null}
                  {series.director ? (
                    <p className="text-xs text-muted-foreground">
                      <span className="text-foreground">{t("film.createdBy")}</span> {series.director}
                    </p>
                  ) : null}
                  {metaLine ? (
                    <p className="text-xs tabular-nums text-muted-foreground">{metaLine}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>

          <div className="mt-6 flex min-w-0 flex-1 flex-col gap-12 sm:mt-8 lg:mt-8 lg:max-w-none">
            <div className="hidden flex-col gap-8 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-12 xl:gap-16">
              <header className="min-w-0 max-w-xl space-y-4">
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {displayTitle}
                </h1>
                {series.tagline ? (
                  <p className="text-pretty text-sm leading-snug text-muted-foreground sm:text-[0.9375rem]">{series.tagline}</p>
                ) : null}
                {series.director ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground">{t("film.createdBy")}</span> {series.director}
                  </p>
                ) : null}
              </header>

              {metaLine ? (
                <div className="flex w-full shrink-0 flex-col items-start gap-2 border-t border-border pt-6 sm:w-auto lg:items-end lg:border-t-0 lg:pt-1">
                  <p className="text-sm tabular-nums text-muted-foreground lg:text-right">
                    {metaLine}
                  </p>
                </div>
              ) : null}
            </div>

            {(series.overview || (series.genres && series.genres.length > 0)) ? (
              <div className="-mt-2 flex flex-col gap-4">
                {series.overview ? (
                  <div>
                    <SectionLabel>{t("film.overview")}</SectionLabel>
                    <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] lg:max-w-4xl">
                      {series.overview}
                    </p>
                  </div>
                ) : null}
                {series.genres && series.genres.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {series.genres.map((genre) => (
                      <Link
                        key={genre.id}
                        href={`/series/discover?genres=${genre.id}`}
                        className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-muted ring-1 ring-brand-muted/35 transition-colors hover:bg-brand/18 hover:ring-brand/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {genre.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <FilmExternalRatings tmdbId={series.id} mediaType="show" />

            <section aria-label="Your rating and actions">
              <div className="flex flex-col gap-8">
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <StarRating
                    initialRating={rating}
                    onRate={setRating}
                    readonly={loading || interactionsLoading || updating}
                  />
                  <FilmActions
                    filmId={series.id}
                    isWatched={isWatched}
                    isLiked={isLiked}
                    isInWatchlist={isInWatchlist}
                    onWatchClick={async () => {
                      const result = await toggleWatched()
                      if (result === "needs-unwatch-confirm") {
                        setUnwatchOpen(true)
                        return
                      }
                      toast.success(t("watch.markedWatched"))
                    }}
                    onLogDiaryClick={() => {
                      void prefetchDiaryArt("tv", series.id, series.poster_path)
                      setLogWatchOpen(true)
                    }}
                    onLikeClick={toggleLiked}
                    onWatchlistClick={toggleWatchlist}
                    onShareClick={() => setShareOpen(true)}
                    loading={loading || interactionsLoading}
                    updating={updating}
                  />
                </div>
                {isWatched && (watchedDate || rewatchCount > 0) ? (
                  <p className="-mt-4 text-sm text-muted-foreground">
                    {formatWatchedDate(watchedDate)
                      ? t("film.watchedOn", { date: formatWatchedDate(watchedDate)! })
                      : t("film.watched")}
                    {formatRewatchLabel(rewatchCount)
                      ? ` · ${formatRewatchLabel(rewatchCount)}`
                      : null}
                  </p>
                ) : null}
                {review?.trim() ? (
                  <div className="rounded-md border border-border bg-muted/50 p-4">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {review}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <LogWatchDialog
              open={logWatchOpen}
              onOpenChange={setLogWatchOpen}
              title={displayTitle}
              year={(series.release_date || series.first_air_date)?.slice(0, 4) ?? null}
              posterPath={series.poster_path}
              backdropPath={series.backdrop_path}
              tmdbId={series.id}
              mediaType="tv"
              isWatched={isWatched}
              isLiked={isLiked}
              watchedDate={watchedDate}
              rewatchCount={rewatchCount}
              hasDiaryLogs={hasDiaryLogs}
              initialRating={rating}
              initialReview={review}
              loading={updating}
              onLog={async (payload) => {
                await logWatch(payload)
                toast.success(
                  payload.shareToFeed
                    ? t("watch.sharedToFeed")
                    : isWatched && payload.isRewatch
                      ? t("watch.rewatchSaved")
                      : t("watch.savedToDiary"),
                )
              }}
              onRemoveFromDiary={hasDiaryLogs ? removeFromDiary : undefined}
            />

            <ConfirmUnwatchDialog
              open={unwatchOpen}
              onOpenChange={setUnwatchOpen}
              title={displayTitle}
              loading={updating}
              onConfirm={async () => {
                await unwatch()
                toast.success(t("watch.unmarkedWatched"))
              }}
            />

            <ShareCardDialog
              open={shareOpen}
              onOpenChange={setShareOpen}
              fileBase={`clakete-${(series.original_name || displayTitle).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "series"}`}
              data={{
                title: series.original_name || displayTitle,
                year: (series.first_air_date || series.release_date)
                  ? (series.first_air_date || series.release_date).slice(0, 4)
                  : null,
                posterUrl: series.poster_path
                  ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                  : null,
                backdropUrl: series.backdrop_path
                  ? `https://image.tmdb.org/t/p/w1280${series.backdrop_path}`
                  : null,
                rating,
                watchedLabel: formatWatchedDate(watchedDate),
                director: series.director || null,
                caption: t("share.caption"),
                handle: t("share.handle"),
              }}
            />

            <MediaDetailTabs
              columns={5}
              defaultValue="credits"
              tabs={[
                {
                  value: "credits",
                  label: t("film.credits"),
                  content: (
                    <CreditsList
                      cast={series.cast || []}
                      crew={series.crew || []}
                    />
                  ),
                },
                {
                  value: "seasons",
                  label: t("film.seasons"),
                  content: (
                    <SeasonsList
                      seriesId={series.id}
                      seriesName={series.name || series.title}
                      seriesOriginalName={series.original_name}
                      seriesFirstAirDate={
                        series.first_air_date || series.release_date
                      }
                      seasons={series.seasons || []}
                    />
                  ),
                },
                {
                  value: "similar",
                  label: t("film.similar"),
                  content: <SimilarSeriesList series={series} />,
                },
                {
                  value: "recommended",
                  label: t("film.recommended"),
                  content: <RecommendedSeriesList series={series} />,
                },
                {
                  value: "images",
                  label: t("film.images"),
                  content: <ImagesList movie={series as never} />,
                },
              ]}
            />

            {/* Mobile-only watch providers, just before reviews */}
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/40 lg:hidden">
              <WatchProviders movie={movieCompat} hideHeading omitTrailerButton mediaType="tv" />
            </div>

            <div>
              <SectionLabel>{t("film.recentReviews")}</SectionLabel>
              <div className="mt-6">
                <FilmReviewsList filmId={series.id} mediaType="tv" />
              </div>
            </div>
          </div>
        </div>
      </FilmsCatalogShell>
    </div>
  )
}
