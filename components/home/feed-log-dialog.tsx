"use client"

import { useEffect, useState } from "react"
import { CalendarIcon, Globe2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useDesignMode } from "@/hooks/use-design-mode"
import {
  formatRewatchLabel,
  formatWatchedDate,
  parseLocalDateString,
  toLocalDateString,
} from "@/lib/watched-date"

export type FeedVisibility = "friends" | "public"

export type FeedLogDraft = {
  watchedDate: string
  isRewatch: boolean
  shareToFeed: boolean
  visibility: FeedVisibility
}

interface FeedLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  isWatched: boolean
  watchedDate: string | null
  rewatchCount: number
  loading?: boolean
  /** Restore draft when returning from customize. */
  initialDraft?: FeedLogDraft | null
  /** Called when user saves without sharing to feed. */
  onSaveOnly: (payload: FeedLogDraft) => void | Promise<void>
  /** Called when user wants to customize a feed post (Next). */
  onNextToCustomize: (payload: FeedLogDraft) => void
}

export function FeedLogDialog({
  open,
  onOpenChange,
  title,
  isWatched,
  watchedDate,
  rewatchCount,
  loading = false,
  initialDraft = null,
  onSaveOnly,
  onNextToCustomize,
}: FeedLogDialogProps) {
  const [date, setDate] = useState(toLocalDateString())
  const [isRewatch, setIsRewatch] = useState(false)
  const [shareToFeed, setShareToFeed] = useState(false)
  const [visibility, setVisibility] = useState<FeedVisibility>("friends")
  const [saving, setSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setDate(initialDraft?.watchedDate || watchedDate || toLocalDateString())
    setIsRewatch(initialDraft?.isRewatch ?? isWatched)
    setShareToFeed(initialDraft?.shareToFeed ?? false)
    setVisibility(initialDraft?.visibility ?? "friends")
    setCalendarOpen(false)
  }, [open, watchedDate, isWatched, initialDraft])

  const selectedDate = parseLocalDateString(date)
  const today = parseLocalDateString(toLocalDateString())
  const busy = loading || saving
  const dateLabel = formatWatchedDate(date) ?? "Pick a date"
  const previousLabel = formatWatchedDate(watchedDate)
  const rewatchLabel = formatRewatchLabel(rewatchCount)

  const draft = (): FeedLogDraft => ({
    watchedDate: date,
    isRewatch: isWatched && isRewatch,
    shareToFeed,
    visibility,
  })

  const designMode = useDesignMode()
  const isGlass = designMode === "glass"

  const handlePrimary = async () => {
    if (shareToFeed) {
      onNextToCustomize(draft())
      return
    }
    setSaving(true)
    try {
      await onSaveOnly(draft())
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", isGlass && "border-white/10 bg-[#161719]/96 text-white sm:rounded-[20px] backdrop-blur-2xl shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)]")}>
        <DialogHeader>
          <DialogTitle className={cn(isGlass && "text-white font-semibold")}>{isWatched ? "Log again" : "Log watch"}</DialogTitle>
          <DialogDescription className={cn(isGlass && "text-white/50")}>
            {title
              ? `When did you watch ${title}?`
              : "Pick the date you watched this title."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {isWatched && (previousLabel || rewatchLabel) ? (
            <p className={cn("text-sm", isGlass ? "text-white/40" : "text-muted-foreground")}>
              {previousLabel ? `Last logged ${previousLabel}` : null}
              {previousLabel && rewatchLabel ? " · " : null}
              {rewatchLabel}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label className={cn(isGlass && "text-white/60")}>Watch date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && (isGlass ? "text-white/40" : "text-muted-foreground"),
                    isGlass && "rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"
                  )}
                >
                  <CalendarIcon className={cn("mr-2 h-4 w-4", isGlass ? "text-white/50" : "opacity-70")} />
                  {dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className={cn("w-auto p-0", isGlass && "border-white/10 bg-[#161719] text-white")} align="start">
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
              <span className={cn(isGlass && "text-white/80")}>This is a rewatch</span>
            </label>
          ) : null}

          <div className={cn("space-y-3 rounded-xl border p-3", isGlass ? "border-white/10 bg-white/[0.03]" : "border-border/80 bg-muted/20")}>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                checked={shareToFeed}
                onCheckedChange={(v) => setShareToFeed(v === true)}
                disabled={busy}
                className="mt-0.5"
              />
              <span>
                <span className={cn("font-medium", isGlass ? "text-white" : "text-foreground")}>Share to feed</span>
                <span className={cn("mt-0.5 block text-xs", isGlass ? "text-white/40" : "text-muted-foreground")}>
                  Post this log for people who follow you. You&apos;ll pick the photo next.
                </span>
              </span>
            </label>

            {shareToFeed ? (
              <div className="grid grid-cols-2 gap-2 pl-7">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setVisibility("friends")}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                    visibility === "friends"
                      ? "border-brand/40 bg-brand/10"
                      : isGlass ? "border-white/10 hover:border-white/20" : "border-border/80 hover:border-border",
                  )}
                >
                  <Users className="size-4 text-brand" />
                  <span className={cn("text-xs font-medium", isGlass ? "text-white" : "text-foreground")}>Friends</span>
                  <span className={cn("text-[10px]", isGlass ? "text-white/40" : "text-muted-foreground")}>
                    Mutual follows only
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
                      : isGlass ? "border-white/10 hover:border-white/20" : "border-border/80 hover:border-border",
                  )}
                >
                  <Globe2 className="size-4 text-brand" />
                  <span className={cn("text-xs font-medium", isGlass ? "text-white" : "text-foreground")}>Public</span>
                  <span className={cn("text-[10px]", isGlass ? "text-white/40" : "text-muted-foreground")}>Anyone on Clakete</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className={cn(isGlass && "rounded-xl border-white/12 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className={cn(isGlass ? "rounded-xl bg-white px-5 font-semibold text-black hover:bg-white/90" : "bg-brand text-white hover:bg-brand-hover")}
            onClick={() => void handlePrimary()}
            disabled={busy || !date}
          >
            {busy ? "Saving…" : shareToFeed ? "Next" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
