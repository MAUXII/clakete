"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { IoEyeOutline, IoEye, IoHeartOutline, IoHeart } from "react-icons/io5"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useFilmInteractions } from "@/hooks/use-film-interactions"
import { useMediaCardHref } from "@/hooks/use-media-card-href"
import { LogWatchDialog } from "@/components/movies/log-watch-dialog"
import { ConfirmUnwatchDialog } from "@/components/movies/confirm-unwatch-dialog"
import { PosterActionsMenu } from "@/components/movies/poster-actions-menu"
import { useT } from "@/components/providers/i18n-provider"

interface SeriesCardProps {
  series?: {
    id?: number
    name: string
    original_name?: string | null
    poster_path: string | null
    backdrop_path?: string | null
    vote_average?: number
    first_air_date?: string | null
  }
  externalid?: number
  href?: string | null
  variant?: "default" | "nav-fill"
  extraActions?: ReactNode
}

export function SeriesCard({
  series: show,
  externalid,
  href: hrefOverride,
  variant = "default",
  extraActions,
}: SeriesCardProps) {
  const { t } = useT()
  const seriesId = externalid ?? show?.id ?? 0
  const href = useMediaCardHref({
    kind: "tv",
    id: seriesId,
    hrefOverride,
    original_name: show?.original_name,
    name: show?.name,
    first_air_date: show?.first_air_date,
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
    seriesId || 0,
    show?.poster_path || undefined,
    show?.name,
    show?.first_air_date ?? undefined,
    "tv",
    show?.original_name,
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

  const isNavFill = variant === "nav-fill"
  const year = show?.first_air_date?.slice(0, 4) ?? null

  const renderCard = () => {
    const cardInner = (
      <div
        className={cn(
          "relative w-full overflow-hidden border-[1px] border-black/15 shadow-black/5 shadow-sm dark:border-white/15 dark:shadow-white/5",
          isNavFill
            ? "aspect-auto h-full flex-1 rounded-xl bg-muted"
            : "aspect-[2/3] h-full rounded-[5px]",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {show?.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
            alt={show?.name || "Series poster"}
            className={cn(
              "object-cover transition-all",
              isNavFill ? "absolute inset-0 h-full w-full" : "h-full w-full",
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted-foreground/10 text-2xl font-medium">
            ?
          </div>
        )}

        {show?.vote_average ? (
          <div className="absolute bottom-2 right-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Badge variant="secondary" className="rounded-sm font-medium text-brand">
              {show.vote_average.toFixed(1)} ★
            </Badge>
          </div>
        ) : null}

        <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleWatch}
            className={`rounded-md border p-2 transition-colors ${
              localWatched
                ? "border-brand/20 bg-[#280F16] text-brand hover:bg-[#280F16]"
                : "border-transparent bg-secondary text-secondary-foreground hover:border-brand/20 hover:bg-[#280F16] hover:text-brand"
            }`}
            title={localWatched ? t("film.unmarkWatched") : t("film.markWatched")}
          >
            {localWatched ? <IoEye className="h-4 w-4" /> : <IoEyeOutline className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleLike}
            className={`rounded-md border p-2 transition-colors ${
              localLiked
                ? "border-brand/20 bg-[#280F16] text-brand hover:bg-[#280F16]"
                : "border-transparent bg-secondary text-secondary-foreground hover:border-brand/20 hover:bg-[#280F16] hover:text-brand"
            }`}
            title={localLiked ? t("film.liked") : t("film.like")}
          >
            {localLiked ? <IoHeart className="h-4 w-4" /> : <IoHeartOutline className="h-4 w-4" />}
          </button>
          <PosterActionsMenu
            mediaType="tv"
            tmdbId={seriesId}
            title={show?.name}
            releaseDate={show?.first_air_date}
            posterPath={show?.poster_path}
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
            "group flex flex-col gap-2 transition-transform duration-300",
            isNavFill && "h-full w-full",
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
          "group flex flex-col gap-2 transition-transform duration-300",
          isNavFill && "h-full w-full",
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
        title={show?.name}
        year={year}
        posterPath={show?.poster_path}
        backdropPath={show?.backdrop_path}
        tmdbId={seriesId || undefined}
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
        title={show?.name}
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
