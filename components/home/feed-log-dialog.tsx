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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isWatched ? "Log again" : "Log watch"}</DialogTitle>
          <DialogDescription>
            {title
              ? `When did you watch ${title}?`
              : "Pick the date you watched this title."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {isWatched && (previousLabel || rewatchLabel) ? (
            <p className="text-sm text-muted-foreground">
              {previousLabel ? `Last logged ${previousLabel}` : null}
              {previousLabel && rewatchLabel ? " · " : null}
              {rewatchLabel}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>Watch date</Label>
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
              <span>This is a rewatch</span>
            </label>
          ) : null}

          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                checked={shareToFeed}
                onCheckedChange={(v) => setShareToFeed(v === true)}
                disabled={busy}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-foreground">Share to feed</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
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
                      ? "border-[#FF0048]/40 bg-[#FF0048]/10"
                      : "border-border/80 hover:border-border",
                  )}
                >
                  <Users className="size-4 text-[#FF0048]" />
                  <span className="text-xs font-medium">Friends</span>
                  <span className="text-[10px] text-muted-foreground">Followers only</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setVisibility("public")}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                    visibility === "public"
                      ? "border-[#FF0048]/40 bg-[#FF0048]/10"
                      : "border-border/80 hover:border-border",
                  )}
                >
                  <Globe2 className="size-4 text-[#FF0048]" />
                  <span className="text-xs font-medium">Public</span>
                  <span className="text-[10px] text-muted-foreground">Anyone on Clakete</span>
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
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#FF0048] text-white hover:bg-[#e60042]"
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
