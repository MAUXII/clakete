"use client"

import { useEffect, useState } from "react"
import { CalendarIcon } from "lucide-react"
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

interface LogWatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  isWatched: boolean
  watchedDate: string | null
  rewatchCount: number
  loading?: boolean
  onLog: (payload: { watchedDate: string; isRewatch: boolean }) => void | Promise<void>
  onUnwatch?: () => void | Promise<void>
}

export function LogWatchDialog({
  open,
  onOpenChange,
  title,
  isWatched,
  watchedDate,
  rewatchCount,
  loading = false,
  onLog,
  onUnwatch,
}: LogWatchDialogProps) {
  const [date, setDate] = useState(toLocalDateString())
  const [isRewatch, setIsRewatch] = useState(false)
  const [saving, setSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setDate(watchedDate || toLocalDateString())
    setIsRewatch(isWatched)
    setCalendarOpen(false)
  }, [open, watchedDate, isWatched])

  const selectedDate = parseLocalDateString(date)
  const today = parseLocalDateString(toLocalDateString())

  const handleSave = async () => {
    setSaving(true)
    try {
      await onLog({ watchedDate: date, isRewatch: isWatched && isRewatch })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleUnwatch = async () => {
    if (!onUnwatch) return
    setSaving(true)
    try {
      await onUnwatch()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const previousLabel = formatWatchedDate(watchedDate)
  const rewatchLabel = formatRewatchLabel(rewatchCount)
  const busy = loading || saving
  const dateLabel = formatWatchedDate(date) ?? "Pick a date"

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
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {isWatched && onUnwatch ? (
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground sm:mr-auto"
              onClick={() => void handleUnwatch()}
              disabled={busy}
            >
              Remove watched
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
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#FF0048] text-white hover:bg-[#e60042] sm:flex-none"
              onClick={() => void handleSave()}
              disabled={busy || !date}
            >
              {busy ? "Saving…" : isWatched && isRewatch ? "Log rewatch" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
