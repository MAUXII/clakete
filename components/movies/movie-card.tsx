"use client"

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Movie } from '@/types/movie'
import { Badge } from "@/components/ui/badge"
import { useFilmInteractions } from '@/hooks/use-film-interactions'
import { IoEyeOutline, IoEye } from "react-icons/io5"
import { IoHeartOutline, IoHeart } from "react-icons/io5"
import { toast } from 'sonner'
import { useState, useEffect, type ReactNode } from 'react'
import { useMediaCardHref } from '@/hooks/use-media-card-href'
import { LogWatchDialog } from '@/components/movies/log-watch-dialog'
import { ConfirmUnwatchDialog } from '@/components/movies/confirm-unwatch-dialog'
import { PosterActionsMenu } from '@/components/movies/poster-actions-menu'
import { useT } from '@/components/providers/i18n-provider'

interface MovieCardProps {
  movie?:{
    id?: number;
    title: string;
    original_title?: string | null;
    poster_path: string | null;
    backdrop_path?: string | null;
    vote_average?: number;
    release_date?: string | null;
  }
  externalid?: number
 
  /** Override link target (e.g. profile diary log URL). */
  href?: string | null
  variant?: 'default' | 'nav-fill'
  /** Extra buttons rendered under eye/heart on poster hover (e.g. edit menu). */
  extraActions?: ReactNode
}

export function MovieCard({ movie, externalid, href: hrefOverride, variant = 'default', extraActions }: MovieCardProps) {
  const { t } = useT()
  const filmId = externalid || movie?.id || 0
  const href = useMediaCardHref({
    kind: 'movie',
    id: filmId,
    hrefOverride,
    original_title: movie?.original_title,
    title: movie?.title,
    release_date: movie?.release_date,
  })
  const {
    isWatched,
    isLiked,
    isInWatchlist,
    rating,
    review,
    watchedDate,
    rewatchCount,
    hasDiaryLogs,
    logWatch,
    removeFromDiary,
    unwatch,
    toggleWatched,
    toggleLiked,
    toggleWatchlist,
    updating,
  } = useFilmInteractions(
    filmId || 0,
    movie?.poster_path || undefined,
    movie?.title,
    movie?.release_date ?? undefined,
    "movie",
    movie?.original_title,
  )
  const [localWatched, setLocalWatched] = useState(isWatched)
  const [localLiked, setLocalLiked] = useState(isLiked)
  const [logWatchOpen, setLogWatchOpen] = useState(false)
  const [unwatchOpen, setUnwatchOpen] = useState(false)

  useEffect(() => {
    setLocalWatched(isWatched)
    setLocalLiked(isLiked)
  }, [isWatched, isLiked])

  const handleWatch = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (updating) return

    const result = await toggleWatched()
    if (result === "needs-unwatch-confirm") {
      setUnwatchOpen(true)
      return
    }
    setLocalWatched(true)
    toast.success(t("watch.markedWatched"))
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (updating) return
    setLocalLiked(!localLiked)
    void toggleLiked()
    toast.success(
      localLiked ? t("watch.removedFromFavorites") : t("watch.addedToFavorites"),
    )
  }

  const isNavFill = variant === 'nav-fill'
  const year = movie?.release_date?.slice(0, 4) ?? null

  const renderCard = () => {
    const cardInner = (
      <div
        className={cn(
          'relative w-full overflow-hidden border-[1px] border-black/15 shadow-black/5 dark:border-white/15 dark:shadow-white/5 shadow-sm',
          isNavFill
            ? 'h-full flex-1 rounded-xl aspect-auto bg-muted'
            : 'h-full rounded-[5px] aspect-[2/3]',
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {movie?.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie?.title || 'Movie poster'}
            className={cn(
              'object-cover transition-all',
              isNavFill ? 'absolute inset-0 h-full w-full' : 'h-full w-full',
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted-foreground/10 text-2xl font-medium">
            ?
          </div>
        )}
        
        {movie?.vote_average ? (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge variant="secondary" className="font-medium text-brand rounded-sm">
              {movie.vote_average.toFixed(1)} ★
            </Badge>
          </div>
        ) : null}
        <div className="absolute flex-col top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            onClick={handleWatch}
            className={`p-2 rounded-md border transition-colors ${
              localWatched 
                ? "bg-[#280F16] text-brand border-brand/20 hover:bg-[#280F16]" 
                : "bg-secondary text-secondary-foreground border-transparent hover:bg-[#280F16] hover:text-brand hover:border-brand/20"
            }`}
            title={localWatched ? t("film.unmarkWatched") : t("film.markWatched")}
          >
            {localWatched ? <IoEye className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleLike}
            className={`p-2 rounded-md border transition-colors ${
              localLiked 
                ? "bg-[#280F16] text-brand border-brand/20 hover:bg-[#280F16]" 
                : "bg-secondary text-secondary-foreground border-transparent hover:bg-[#280F16] hover:text-brand hover:border-brand/20"
            }`}
            title={localLiked ? t("film.liked") : t("film.like")}
          >
            {localLiked ? <IoHeart className="w-4 h-4" /> : <IoHeartOutline className="w-4 h-4" />}
          </button>
          <PosterActionsMenu
            mediaType="movie"
            tmdbId={filmId}
            title={movie?.title}
            releaseDate={movie?.release_date}
            posterPath={movie?.poster_path}
            isInWatchlist={isInWatchlist}
            disabled={updating}
            onLogToDiary={() => setLogWatchOpen(true)}
            onToggleWatchlist={() => void toggleWatchlist()}
          />
          {extraActions}
        </div>
      </div>
    )

    if (!href) {
      return (
        <div
          className={cn(
            'group flex flex-col gap-2 transition-transform duration-300',
            isNavFill && 'h-full w-full',
          )}
        >
          {cardInner}
        </div>
      )
    }

    return (
      <Link
        href={href}
        className={cn(
          'group flex flex-col gap-2 transition-transform duration-300',
          isNavFill && 'h-full w-full',
        )}
      >
        {cardInner}
      </Link>
    )
  }

  return (
    <>
      {renderCard()}
      <LogWatchDialog
        open={logWatchOpen}
        onOpenChange={setLogWatchOpen}
        title={movie?.title}
        year={year}
        posterPath={movie?.poster_path}
        backdropPath={movie?.backdrop_path}
        tmdbId={filmId || undefined}
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
          setLocalWatched(true)
          setLocalLiked(payload.isLiked)
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
        title={movie?.title}
        loading={updating}
        onConfirm={async () => {
          await unwatch()
          setLocalWatched(false)
          setLocalLiked(false)
          toast.success(t("watch.unmarkedWatched"))
        }}
      />
    </>
  )
}
