"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MediaAtmosphere } from "@/components/media/media-atmosphere"
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs"
import { FilmPosterActionsGlass, FilmPosterMoreMenuGlass, FilmPosterTrailerPlayGlass } from "@/components/movies/film-poster-actions-glass"
import { LogWatchDialog } from "@/components/movies/log-watch-dialog"
import { ConfirmUnwatchDialog } from "@/components/movies/confirm-unwatch-dialog"
import { ShareCardDialog } from "@/components/movies/share-card-dialog"
import { AddToListDialog } from "@/components/movies/add-to-list-dialog"
import { FilmReviewsList } from "@/components/movies/film-reviews-list"
import { FilmExternalRatings } from "@/components/movies/film-external-ratings"
import CreditsList from "@/components/movies/credits"
import { MovieCard } from "@/components/movies/movie-card"
import ImagesList from "@/components/movies/imagesList"
import WatchProviders from "@/components/movies/watchproviders"
import Trailer from "@/components/movies/trailer"
import { formatRewatchLabel, formatWatchedDate } from "@/lib/watched-date"
import { glassWideContainerClass } from "@/lib/page-container"
import { prefetchDiaryArt } from "@/lib/client/diary-dialog-art"
import { useT } from "@/components/providers/i18n-provider"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { FilmDetailViewProps } from "@/components/movies/film-detail-types"
import { formatRuntime } from "@/components/movies/film-detail-types"

export function FilmDetailGlass({
  movie,
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
  toggleWatched,
  toggleLiked,
  toggleWatchlist,
  logWatch,
  unwatch,
  removeFromDiary,
}: FilmDetailViewProps) {
  const { t } = useT()
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [logWatchOpen, setLogWatchOpen] = useState(false)
  const [unwatchOpen, setUnwatchOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [addToListOpen, setAddToListOpen] = useState(false)

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder.png"
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null
  const runtimeLabel = formatRuntime(movie.runtime)
  const youtubeTrailer = movie.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  )

  const handleWatchClick = async () => {
    const result = await toggleWatched()
    if (result === "needs-unwatch-confirm") {
      setUnwatchOpen(true)
      return
    }
    toast.success(t("watch.markedWatched"))
  }

  const allRecommendedMovies = [
    ...(movie.recommendations?.results || []),
    ...(movie.similar?.results || []),
  ]
  const uniqueRecommendedMovies = Array.from(
    new Map(allRecommendedMovies.map((item) => [item.id, item])).values(),
  )

  return (
    <>
      <MediaAtmosphere coverUrl={backdropUrl || posterUrl} seed={String(movie.id)} />

      <div
        className={cn(
          "relative z-[1] min-h-screen bg-transparent",
          glassWideContainerClass,
          "mt-[calc(var(--ck-nav-h,3.25rem)+var(--clakete-promo-h,0px))] pb-24 pt-6 md:pt-10",
        )}
      >
        <article className="grid w-full gap-8 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start md:gap-10 lg:gap-12">
          {/* Coluna Esquerda: Poster sticky com tamanho completo original (300px) */}
          <aside className="relative mx-auto w-[min(100%,300px)] md:mx-0 md:w-full md:sticky md:top-[calc(var(--ck-nav-h,3.25rem)+1.5rem)]">
            <div className="group relative z-0">
              <img
                src={posterUrl}
                alt={movie.title}
                className="aspect-[2/3] w-full rounded-[14px] object-cover shadow-[0_28px_56px_-18px_rgba(0,0,0,0.9)]"
              />
              {youtubeTrailer ? (
                <FilmPosterTrailerPlayGlass onClick={() => setTrailerOpen(true)} />
              ) : null}
            </div>

            <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} />

            <FilmPosterActionsGlass
              isWatched={isWatched}
              isLiked={isLiked}
              hasReview={Boolean(review?.trim())}
              loading={loading}
              interactionsLoading={interactionsLoading}
              updating={updating}
              onWatchClick={handleWatchClick}
              onLikeClick={toggleLiked}
              onReviewClick={() => {
                void prefetchDiaryArt("movie", movie.id, movie.poster_path)
                setLogWatchOpen(true)
              }}
            />
          </aside>

          {/* Coluna Direita: Informações, Avaliação, Tabs e Reviews */}
          <div className="min-w-0 md:pt-1">
            <Link
              href="/films/discover"
              className="inline-flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t("film.backToCatalog")}</span>
            </Link>

            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className="min-w-0 text-[2rem] font-medium leading-[1.12] tracking-tight text-white md:text-[2.6rem]">
                {movie.title}
              </h1>
              <FilmPosterMoreMenuGlass
                className="mt-1 shrink-0 md:mt-2"
                isInWatchlist={isInWatchlist}
                disabled={loading || interactionsLoading || updating}
                onWatchlistClick={toggleWatchlist}
                onAddToListClick={() => setAddToListOpen(true)}
                onShareClick={() => setShareOpen(true)}
              />
            </div>

            {movie.tagline ? (
              <p className="mt-2 text-sm italic text-white/50">{movie.tagline}</p>
            ) : null}

            <p className="mt-3 text-sm text-white/40">
              {year ? <span>{year}</span> : null}
              {year && movie.director ? <span className="mx-2 text-white/25">·</span> : null}
              {movie.director ? <span>{movie.director}</span> : null}
              {(year || movie.director) && runtimeLabel ? <span className="mx-2 text-white/25">·</span> : null}
              {runtimeLabel ? <span>{runtimeLabel}</span> : null}
            </p>

            {movie.overview ? (
              <p className="mt-6 text-[15px] font-light leading-7 text-white/70 whitespace-pre-wrap">
                {movie.overview}
              </p>
            ) : null}

            {movie.genres && movie.genres.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {movie.genres.map((g) => (
                  <Link
                    key={g.id}
                    href={`/films/discover?genres=${g.id}`}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-6">
              <FilmExternalRatings tmdbId={movie.id} />
            </div>

            {(isWatched || rating) ? (
              <p className="mt-4 text-xs text-white/40">
                {isWatched && formatWatchedDate(watchedDate)
                  ? t("film.watchedOn", { date: formatWatchedDate(watchedDate)! })
                  : isWatched
                    ? t("film.watched")
                    : null}
                {isWatched && rating ? " · " : null}
                {rating ? `Sua nota: ${rating}/10` : null}
                {formatRewatchLabel(rewatchCount) ? ` · ${formatRewatchLabel(rewatchCount)}` : null}
              </p>
            ) : null}

            {review?.trim() ? (
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                  {review}
                </p>
              </div>
            ) : null}

            {/* Tabs de Conteúdo: Elenco, Similares, Recomendações e Fotos */}
            <div className="mt-10 min-w-0 w-full">
              <MagneticTabs
                size="lg"
                glass
                className="mt-glass"
                contentBoxed={false}
                defaultValue="credits"
                items={[
                  {
                    value: "credits",
                    label: t("film.credits"),
                    content: (
                      <div className="pt-6">
                        <CreditsList cast={movie.cast || []} crew={movie.crew || []} />
                      </div>
                    ),
                  },
                  {
                    value: "providers",
                    label: t("catalog.whereToWatch") || "Onde assistir",
                    content: (
                      <div className="pt-6 max-w-xl">
                        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md">
                          <WatchProviders movie={movie} hideHeading omitTrailerButton />
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: "recommended",
                    label: t("film.recommended") || "Recomendados",
                    content: (
                      <div className="pt-6">
                        {uniqueRecommendedMovies.length > 0 ? (
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                            {uniqueRecommendedMovies.map((item) => (
                              <MovieCard key={item.id} movie={item} hideCaption />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-white/40">Nenhuma recomendação disponível.</p>
                        )}
                      </div>
                    ),
                  },
                  {
                    value: "images",
                    label: t("film.images"),
                    content: (
                      <div className="pt-6">
                        <ImagesList movie={movie} />
                      </div>
                    ),
                  },
                ]}
              />
            </div>

            {/* Seção de Reviews / Comentários */}
            <div className="mt-14">
              <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">
                {t("film.recentReviews")}
              </h2>
              <div className="mt-6">
                <FilmReviewsList filmId={movie.id} />
              </div>
            </div>
          </div>
        </article>

        <LogWatchDialog
          open={logWatchOpen}
          onOpenChange={setLogWatchOpen}
          title={movie.title}
          year={movie.release_date?.slice(0, 4) ?? null}
          posterPath={movie.poster_path}
          backdropPath={movie.backdrop_path}
          tmdbId={movie.id}
          mediaType="movie"
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
          title={movie.title}
          loading={updating}
          onConfirm={async () => {
            await unwatch()
            toast.success(t("watch.unmarkedWatched"))
          }}
        />

        <ShareCardDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          fileBase={`clakete-${(movie.original_title || movie.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "film"}`}
          data={{
            title: movie.original_title || movie.title,
            year: movie.release_date ? movie.release_date.slice(0, 4) : null,
            posterUrl: movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : null,
            backdropUrl: movie.backdrop_path
              ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
              : null,
            rating,
            watchedLabel: formatWatchedDate(watchedDate),
            director: movie.director || null,
            caption: t("share.caption"),
            handle: t("share.handle"),
          }}
        />

        <AddToListDialog
          open={addToListOpen}
          onOpenChange={setAddToListOpen}
          movie={movie}
          mediaType="movie"
        />
      </div>
    </>
  )
}
