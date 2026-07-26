"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, Globe2, Users } from "lucide-react"
import { IoHeart, IoHeartOutline } from "react-icons/io5"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/movies/star-rating"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useT } from "@/components/providers/i18n-provider"
import {
  type DiaryArtPick,
  prefetchDiaryArt,
  tmdbOriginalUrl,
} from "@/lib/client/diary-dialog-art"
import { cn } from "@/lib/utils"
import {
  formatRewatchLabel,
  formatWatchedDate,
  parseLocalDateString,
  toLocalDateString,
} from "@/lib/watched-date"

interface LogWatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  year?: string | null
  posterPath?: string | null
  backdropPath?: string | null
  tmdbId?: number
  mediaType?: "movie" | "tv"
  isWatched: boolean
  isLiked?: boolean
  watchedDate: string | null
  rewatchCount: number
  hasDiaryLogs?: boolean
  initialRating?: number
  initialReview?: string
  loading?: boolean
  onLog: (payload: {
    watchedDate: string
    isRewatch: boolean
    rating: number
    review: string
    isLiked: boolean
    shareToFeed: boolean
    visibility?: "friends" | "public"
  }) => void | Promise<void>
  onRemoveFromDiary?: () => void | Promise<void>
}

export function LogWatchDialog({
  open,
  onOpenChange,
  title,
  year,
  posterPath,
  backdropPath,
  tmdbId,
  mediaType = "movie",
  isWatched,
  isLiked = false,
  watchedDate,
  rewatchCount,
  hasDiaryLogs = false,
  initialRating = 0,
  initialReview = "",
  loading = false,
  onLog,
  onRemoveFromDiary,
}: LogWatchDialogProps) {
  const { t } = useT()
  const [date, setDate] = useState(toLocalDateString())
  const [isRewatch, setIsRewatch] = useState(false)
  const [rating, setRating] = useState(initialRating)
  const [review, setReview] = useState(initialReview)
  const [liked, setLiked] = useState(isLiked)
  const [shareToFeed, setShareToFeed] = useState(false)
  const [visibility, setVisibility] = useState<"friends" | "public">("friends")
  const [saving, setSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [art, setArt] = useState<DiaryArtPick | null>(null)
  const [artLoading, setArtLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setDate(watchedDate || toLocalDateString())
    setIsRewatch(isWatched)
    setRating(initialRating)
    setReview(initialReview)
    setLiked(isLiked)
    setShareToFeed(false)
    setVisibility("friends")
    setCalendarOpen(false)
  }, [open, watchedDate, isWatched, initialRating, initialReview, isLiked])

  useEffect(() => {
    if (!open) {
      setArt(null)
      setArtLoading(false)
      return
    }

    let cancelled = false
    const fallback: DiaryArtPick | null = posterPath
      ? { path: posterPath, kind: "poster" }
      : backdropPath
        ? { path: backdropPath, kind: "backdrop" }
        : null

    setArt(null)
    setArtLoading(true)

    const reveal = async (pick: DiaryArtPick | null) => {
      const final = pick ?? fallback
      if (!final) {
        if (!cancelled) {
          setArt(null)
          setArtLoading(false)
        }
        return
      }
      // Decode before paint so we never flash poster → alternate art
      await new Promise<void>((resolve) => {
        const img = new window.Image()
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = tmdbOriginalUrl(final.path)
      })
      if (cancelled) return
      setArt(final)
      setArtLoading(false)
    }

    if (!tmdbId) {
      void reveal(fallback)
      return () => {
        cancelled = true
      }
    }

    void prefetchDiaryArt(mediaType, tmdbId, posterPath).then((pick) => {
      if (cancelled) return
      void reveal(pick)
    })

    return () => {
      cancelled = true
    }
  }, [open, tmdbId, mediaType, posterPath, backdropPath])

  const selectedDate = parseLocalDateString(date)
  const today = parseLocalDateString(toLocalDateString())

  const handleSave = async () => {
    setSaving(true)
    try {
      const trimmed = review.trim()
      await onLog({
        watchedDate: date,
        isRewatch: isWatched && isRewatch,
        rating,
        review: trimmed,
        isLiked: liked,
        shareToFeed: shareToFeed && Boolean(trimmed),
        visibility: shareToFeed && trimmed ? visibility : undefined,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!onRemoveFromDiary) return
    setSaving(true)
    try {
      await onRemoveFromDiary()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const previousLabel = formatWatchedDate(watchedDate)
  const rewatchLabel = formatRewatchLabel(rewatchCount)
  const busy = loading || saving
  const dateLabel = formatWatchedDate(date) ?? t("watch.watchDate")
  const displayTitle = title
    ? year
      ? `${title} (${year})`
      : title
    : null
  const canShareToFeed = Boolean(review.trim())

  const sideSrc = art ? tmdbOriginalUrl(art.path) : null
  const sideIsBackdrop = art?.kind === "backdrop"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[680px]">
        <DialogHeader className="space-y-1 border-b border-border px-5 py-4 text-left">
          <DialogTitle>
            {isWatched && isRewatch
              ? t("watch.logDialogTitleAgain")
              : t("watch.logDialogTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[min(80vh,720px)] flex-col overflow-y-auto sm:flex-row">
          {sideSrc || artLoading ? (
            <>
              <div className="relative h-40 w-full shrink-0 overflow-hidden border-b border-border bg-muted sm:hidden">
                {sideSrc ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- original TMDB quality */}
                    <img
                      src={sideSrc}
                      alt={title || ""}
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      decoding="async"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"
                    />
                  </>
                ) : (
                  <Skeleton
                    className="absolute inset-0 h-full w-full rounded-none bg-muted-foreground/15"
                    aria-label={t("common.loading")}
                  />
                )}
              </div>
              <div className="relative hidden w-[220px] shrink-0 self-stretch overflow-hidden bg-muted sm:block md:w-[240px]">
                {sideSrc ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- original TMDB quality */}
                    <img
                      src={sideSrc}
                      alt={title || ""}
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover",
                        sideIsBackdrop ? "object-[center_20%]" : "object-center",
                      )}
                      decoding="async"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-background/35 to-background"
                    />
                  </>
                ) : (
                  <Skeleton
                    className="h-full min-h-[280px] w-full rounded-none bg-muted-foreground/15"
                    aria-label={t("common.loading")}
                  />
                )}
              </div>
            </>
          ) : null}

          <div className="min-w-0 flex-1 space-y-4 px-5 py-4">
            {displayTitle ? (
              <p className="text-base font-semibold text-foreground sm:pt-1">
                {displayTitle}
              </p>
            ) : null}

            {isWatched && (previousLabel || rewatchLabel) ? (
              <p className="text-sm text-muted-foreground">
                {previousLabel
                  ? t("watch.lastLogged", { date: previousLabel })
                  : null}
                {previousLabel && rewatchLabel ? " · " : null}
                {rewatchLabel}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label>{t("watch.watchDate")}</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {dateLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={selectedDate}
                    defaultMonth={selectedDate}
                    startMonth={new Date(1950, 0)}
                    endMonth={today}
                    onSelect={(next) => {
                      if (!next) return
                      setDate(toLocalDateString(next))
                      setCalendarOpen(false)
                    }}
                    disabled={{ after: today }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {isWatched ? (
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={isRewatch}
                  onCheckedChange={(v) => setIsRewatch(v === true)}
                  disabled={busy}
                />
                <span>{t("watch.isRewatch")}</span>
              </label>
            ) : null}

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("watch.ratingOptional")}
              </Label>
              <StarRating initialRating={rating} onRate={setRating} size="md" />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="log-watch-review"
                className="text-muted-foreground"
              >
                {t("watch.reviewOptional")}
              </Label>
              <Textarea
                id="log-watch-review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={t("watch.reviewPlaceholder")}
                disabled={busy}
                rows={4}
                className="resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              disabled={busy}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                liked
                  ? "border-brand/30 bg-brand/10 text-brand"
                  : "border-border text-muted-foreground hover:border-brand/30 hover:text-foreground",
              )}
            >
              {liked ? (
                <IoHeart className="h-4 w-4" />
              ) : (
                <IoHeartOutline className="h-4 w-4" />
              )}
              {t("watch.likeTitle")}
            </button>

            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
              <label
                className={cn(
                  "flex items-start gap-3 text-sm",
                  canShareToFeed
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60",
                )}
              >
                <Checkbox
                  checked={shareToFeed && canShareToFeed}
                  onCheckedChange={(v) => setShareToFeed(v === true)}
                  disabled={busy || !canShareToFeed}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-foreground">
                    {t("watch.shareToFeed")}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("watch.shareToFeedHint")}
                  </span>
                </span>
              </label>

              {shareToFeed && canShareToFeed ? (
                <div className="grid grid-cols-2 gap-2 pl-7">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setVisibility("friends")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                      visibility === "friends"
                        ? "border-brand/40 bg-brand/10"
                        : "border-border/80 hover:border-border",
                    )}
                  >
                    <Users className="size-4 text-brand" />
                    <span className="text-xs font-medium">
                      {t("watch.visibilityFriends")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("watch.visibilityFriendsHint")}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setVisibility("public")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                      visibility === "public"
                        ? "border-brand/40 bg-brand/10"
                        : "border-border/80 hover:border-border",
                    )}
                  >
                    <Globe2 className="size-4 text-brand" />
                    <span className="text-xs font-medium">
                      {t("watch.visibilityPublic")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("watch.visibilityPublicHint")}
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-between">
          {hasDiaryLogs && onRemoveFromDiary ? (
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground sm:mr-auto"
              onClick={() => void handleRemove()}
              disabled={busy}
            >
              {t("watch.removeFromDiary")}
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-brand text-white hover:bg-brand-hover sm:flex-none"
              onClick={() => void handleSave()}
              disabled={busy || !date}
            >
              {busy
                ? t("common.loading")
                : isWatched && isRewatch
                  ? t("watch.logRewatch")
                  : t("watch.saveToDiary")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
