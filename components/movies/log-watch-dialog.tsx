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
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useUser } from "@supabase/auth-helpers-react"
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass"
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
import { useDesignMode } from "@/hooks/use-design-mode"
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
  initialRating?: number | null
  initialReview?: string | null
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
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"
  const [date, setDate] = useState(toLocalDateString())
  const [isRewatch, setIsRewatch] = useState(false)
  const [rating, setRating] = useState(initialRating ?? 0)
  const [review, setReview] = useState(initialReview ?? "")
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
    setRating(initialRating ?? 0)
    setReview(initialReview ?? "")
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
  const user = useUser()

  if (isGlass) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-[260] bg-black/60 backdrop-blur-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) onOpenChange(false);
            }}
          >
            <div className="mx-auto flex min-h-full w-full max-w-[var(--ck-glass-max-width-wide,1060px)] flex-col px-5 pb-20 pt-8 sm:px-8">
              {/* Header com Fechar e Salvar estilo Leitour */}
              <div className="mb-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                >
                  {t("common.cancel") || "Fechar"}
                </button>
                <div className="flex items-center gap-3">
                  {hasDiaryLogs && onRemoveFromDiary ? (
                    <button
                      type="button"
                      onClick={() => void handleRemove()}
                      disabled={busy}
                      className="rounded-xl px-4 py-2 text-sm text-white/40 transition hover:text-red-400"
                    >
                      {t("watch.removeFromDiary")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy || !date}
                    onClick={() => void handleSave()}
                    className="rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
                  >
                    {busy
                      ? t("common.loading")
                      : isWatched && isRewatch
                        ? t("watch.logRewatch")
                        : t("watch.saveToDiary")}
                  </button>
                </div>
              </div>

              <DialogTitle className="sr-only">
                {isWatched && isRewatch
                  ? t("watch.logDialogTitleAgain")
                  : t("watch.logDialogTitle")}
              </DialogTitle>

              <div className="grid w-full gap-10 md:grid-cols-[minmax(0,280px)_1fr] md:items-start">
                {/* Coluna Esquerda: Pôster */}
                <aside className="relative mx-auto w-[min(100%,260px)] md:mx-0 md:w-full">
                  <div className="relative z-0 aspect-[2/3] w-full overflow-hidden rounded-[14px] bg-white/[0.06] shadow-[0_28px_56px_-18px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                    {sideSrc ? (
                      <img
                        src={sideSrc}
                        alt={title || ""}
                        className="h-full w-full object-cover"
                      />
                    ) : posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${posterPath}`}
                        alt={title || ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/30 text-3xl font-light">
                        ?
                      </div>
                    )}
                  </div>
                </aside>

                {/* Coluna Direita: Formulário */}
                <div className="flex min-w-0 flex-col gap-6">
                  {user ? (
                    <LiquidGlass className="rounded-full self-start">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-white/70">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[10px] font-semibold text-white/80">
                          {(user.user_metadata?.display_name || user.user_metadata?.username || "U").charAt(0).toUpperCase()}
                        </span>
                        @{user.user_metadata?.username || user.email?.split("@")[0] || "você"}
                      </div>
                    </LiquidGlass>
                  ) : null}

                  <div>
                    <h2 className="text-3xl font-medium tracking-tight text-white md:text-4xl">
                      {title}
                    </h2>
                    <p className="mt-2 text-sm text-white/40">
                      {year ? year : null}
                      {year && (previousLabel || rewatchLabel) ? " · " : null}
                      {previousLabel ? t("watch.lastLogged", { date: previousLabel }) : null}
                      {previousLabel && rewatchLabel ? " · " : null}
                      {rewatchLabel}
                    </p>
                  </div>

                  {/* Nota */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.08em] text-white/35">
                      {t("watch.ratingOptional")}
                    </span>
                    <div className="flex items-center gap-3">
                      <StarRating initialRating={rating} onRate={setRating} size="lg" filledClassName="text-brand" />
                      {rating > 0 ? (
                        <span className="text-sm font-medium text-white/80">
                          {rating} / 10
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Review */}
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.08em] text-white/35">
                      {t("watch.reviewOptional")}
                    </span>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={5}
                      placeholder={t("watch.reviewPlaceholder")}
                      className="w-full resize-none border-0 bg-transparent pb-3 text-[15px] font-light leading-7 text-white/80 outline-none placeholder:text-white/25 focus:ring-0"
                    />
                  </label>

                  {/* Ações e Opções rápidas: Data, Like, Reassistido */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.08]">
                    {/* Popover de data */}
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/[0.08]"
                        >
                          <CalendarIcon className="size-3.5 text-white/50" />
                          {dateLabel}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-white/10 bg-[#161719] text-white" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(d) => {
                            if (d) {
                              setDate(toLocalDateString(d));
                              setCalendarOpen(false);
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Curtir */}
                    <button
                      type="button"
                      onClick={() => setLiked((v) => !v)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition",
                        liked
                          ? "border-brand/40 bg-brand/15 text-brand"
                          : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                      )}
                    >
                      {liked ? <IoHeart className="size-3.5 text-brand" /> : <IoHeartOutline className="size-3.5" />}
                      {t("watch.likeTitle")}
                    </button>

                    {/* Reassistido */}
                    {isWatched ? (
                      <button
                        type="button"
                        onClick={() => setIsRewatch((v) => !v)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition",
                          isRewatch
                            ? "border-white/30 bg-white/15 text-white"
                            : "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white"
                        )}
                      >
                        {isRewatch ? "✓ Reassistido" : "Marcar como reassistido"}
                      </button>
                    ) : null}
                  </div>

                  {/* Compartilhar no Feed */}
                  {canShareToFeed ? (
                    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-white">{t("watch.shareToFeed")}</span>
                          <span className="block text-xs text-white/40">{t("watch.shareToFeedHint")}</span>
                        </div>
                        <Checkbox
                          checked={shareToFeed}
                          onCheckedChange={(v) => setShareToFeed(v === true)}
                        />
                      </label>
                      {shareToFeed ? (
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setVisibility("friends")}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 rounded-xl border py-2 text-xs transition",
                              visibility === "friends"
                                ? "border-brand/40 bg-brand/10 text-brand"
                                : "border-white/10 text-white/50 hover:border-white/20"
                            )}
                          >
                            <Users className="size-3.5" />
                            {t("watch.visibilityFriends")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setVisibility("public")}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 rounded-xl border py-2 text-xs transition",
                              visibility === "public"
                                ? "border-brand/40 bg-brand/10 text-brand"
                                : "border-white/10 text-white/50 hover:border-white/20"
                            )}
                          >
                            <Globe2 className="size-3.5" />
                            {t("watch.visibilityPublic")}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("gap-0 overflow-hidden p-0 sm:max-w-[680px]", isGlass && "border-white/10 sm:rounded-[20px]")}>
        <DialogHeader className={cn("space-y-1 border-b px-5 py-4 text-left", isGlass ? "border-white/10" : "border-border")}>
          <DialogTitle>
            {isWatched && isRewatch
              ? t("watch.logDialogTitleAgain")
              : t("watch.logDialogTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[min(80vh,720px)] flex-col overflow-y-auto sm:flex-row">
          {sideSrc || artLoading ? (
            <>
              <div className={cn("relative h-40 w-full shrink-0 overflow-hidden border-b bg-muted sm:hidden", isGlass ? "border-white/10" : "border-border")}>
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
                      className={cn(
                        "absolute inset-0",
                        isGlass
                          ? "bg-gradient-to-t from-[#161719]/95 via-[#161719]/40 to-transparent"
                          : "bg-gradient-to-t from-background/80 to-transparent"
                      )}
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
                      className={cn(
                        "absolute inset-0",
                        isGlass
                          ? "bg-gradient-to-r from-transparent via-[#161719]/40 to-[#161719]"
                          : "bg-gradient-to-r from-transparent via-background/35 to-background"
                      )}
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
                isGlass && "rounded-xl",
                liked
                  ? "border-brand/30 bg-brand/10 text-brand"
                  : isGlass
                    ? "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
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

            <div className={cn(
              "space-y-3 rounded-xl border p-3",
              isGlass
                ? "border-white/10 bg-white/[0.03]"
                : "border-border/80 bg-muted/20"
            )}>
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
                  <span className={cn("font-medium", isGlass ? "text-white" : "text-foreground")}>
                    {t("watch.shareToFeed")}
                  </span>
                  <span className={cn("mt-0.5 block text-xs", isGlass ? "text-white/45" : "text-muted-foreground")}>
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
                      isGlass && "rounded-xl",
                      visibility === "friends"
                        ? "border-brand/40 bg-brand/10"
                        : isGlass
                          ? "border-white/10 bg-white/[0.03] hover:border-white/20"
                          : "border-border/80 hover:border-border",
                    )}
                  >
                    <Users className="size-4 text-brand" />
                    <span className="text-xs font-medium">
                      {t("watch.visibilityFriends")}
                    </span>
                    <span className={cn("text-[10px]", isGlass ? "text-white/40" : "text-muted-foreground")}>
                      {t("watch.visibilityFriendsHint")}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setVisibility("public")}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                      isGlass && "rounded-xl",
                      visibility === "public"
                        ? "border-brand/40 bg-brand/10"
                        : isGlass
                          ? "border-white/10 bg-white/[0.03] hover:border-white/20"
                          : "border-border/80 hover:border-border",
                    )}
                  >
                    <Globe2 className="size-4 text-brand" />
                    <span className="text-xs font-medium">
                      {t("watch.visibilityPublic")}
                    </span>
                    <span className={cn("text-[10px]", isGlass ? "text-white/40" : "text-muted-foreground")}>
                      {t("watch.visibilityPublicHint")}
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter className={cn(
          "flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:justify-between",
          isGlass ? "border-white/10" : "border-border"
        )}>
          {hasDiaryLogs && onRemoveFromDiary ? (
            <Button
              type="button"
              variant="ghost"
              className={cn("sm:mr-auto", isGlass ? "text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl" : "text-muted-foreground")}
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
              className={cn(
                "flex-1 sm:flex-none",
                isGlass && "border-white/12 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white rounded-xl"
              )}
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className={cn(
                "flex-1 bg-brand text-white hover:bg-brand-hover sm:flex-none",
                isGlass && "rounded-xl shadow-[0_8px_20px_-6px_rgba(255,0,72,0.4)]"
              )}
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
