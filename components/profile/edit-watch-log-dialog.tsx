"use client"

import { useEffect, useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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

export type EditWatchLogPayload = {
  watchedDate: string
  rewatchCount: number
}

interface EditWatchLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  watchedDate: string | null
  rewatchCount: number
  loading?: boolean
  onSave: (payload: EditWatchLogPayload) => void | Promise<void>
  onUnwatch?: () => void | Promise<void>
}

export function EditWatchLogDialog({
  open,
  onOpenChange,
  title,
  watchedDate,
  rewatchCount,
  loading = false,
  onSave,
  onUnwatch,
}: EditWatchLogDialogProps) {
  const [date, setDate] = useState(toLocalDateString())
  const [rewatches, setRewatches] = useState(0)
  const [saving, setSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setDate(watchedDate || toLocalDateString())
    setRewatches(Math.max(0, rewatchCount))
    setCalendarOpen(false)
  }, [open, watchedDate, rewatchCount])

  const selectedDate = parseLocalDateString(date)
  const today = parseLocalDateString(toLocalDateString())
  const busy = loading || saving
  const dateLabel = formatWatchedDate(date) ?? "Pick a date"
  const rewatchHint = formatRewatchLabel(rewatches)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        watchedDate: date,
        rewatchCount: Math.max(0, Math.floor(rewatches)),
      })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit watch log</DialogTitle>
          <DialogDescription>
            {title
              ? `Update when you watched ${title}.`
              : "Update the watch date and rewatch count."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
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

          <div className="space-y-2">
            <Label htmlFor="rewatch-count">Rewatch count</Label>
            <Input
              id="rewatch-count"
              type="number"
              min={0}
              max={999}
              value={rewatches}
              disabled={busy}
              onChange={(e) => setRewatches(Number(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              {rewatchHint
                ? `Shown as “${rewatchHint}”.`
                : "0 = first watch (not a rewatch)."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {onUnwatch ? (
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
              className="flex-1 bg-brand text-white hover:bg-brand-hover sm:flex-none"
              onClick={() => void handleSave()}
              disabled={busy || !date}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
