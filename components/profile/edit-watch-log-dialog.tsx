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
import { useT } from "@/components/providers/i18n-provider"
import { useDesignMode } from "@/hooks/use-design-mode"

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
  const { t } = useT()
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"
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
  const dateLabel = formatWatchedDate(date) ?? t("profile.pickDate")
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
      <DialogContent className={cn("sm:max-w-md", isGlass && "border-white/10 bg-[#161719]/96 text-white sm:rounded-[20px] backdrop-blur-2xl shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)]")}>
        <DialogHeader>
          <DialogTitle className={cn(isGlass && "text-white font-semibold")}>{t("profile.editWatchLog")}</DialogTitle>
          <DialogDescription className={cn(isGlass && "text-white/50")}>
            {title
              ? t("profile.updateWatchDateNamed", { title })
              : t("profile.updateWatchDate")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
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

          <div className="space-y-2">
            <Label htmlFor="rewatch-count" className={cn(isGlass && "text-white/60")}>Rewatch count</Label>
            <Input
              id="rewatch-count"
              type="number"
              min={0}
              max={999}
              value={rewatches}
              disabled={busy}
              onChange={(e) => setRewatches(Number(e.target.value) || 0)}
              className={cn(isGlass && "rounded-xl border-white/10 bg-white/[0.04] text-white")}
            />
            <p className={cn("text-xs", isGlass ? "text-white/40" : "text-muted-foreground")}>
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
              className={cn(isGlass ? "text-white/40 hover:text-red-400 hover:bg-transparent" : "text-muted-foreground", "sm:mr-auto")}
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
              className={cn("flex-1 sm:flex-none", isGlass && "rounded-xl border-white/12 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white")}
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className={cn("flex-1 sm:flex-none", isGlass ? "rounded-xl bg-white px-5 font-semibold text-black hover:bg-white/90" : "bg-brand text-white hover:bg-brand-hover")}
              onClick={() => void handleSave()}
              disabled={busy || !date}
            >
              {busy ? t("profile.saving") : t("common.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
