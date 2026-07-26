"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  daysInMonth,
  firstWeekdayOfMonth,
  monthLabel,
} from "@/lib/diary"
import { filmHref, seriesHref } from "@/lib/media-href"
import { toLocalDateString } from "@/lib/watched-date"

export type CalendarWatchItem = {
  id: string
  watch_index: number
  tmdb_id: number
  poster_path: string | null
  movie_title: string | null
  release_date?: string | null
  media_type: string | null
  watched_date: string | null
}

function calendarItemHref(item: CalendarWatchItem) {
  return item.media_type === "tv"
    ? seriesHref({ id: item.tmdb_id, name: item.movie_title })
    : filmHref({
        id: item.tmdb_id,
        title: item.movie_title,
        release_date: item.release_date,
      })
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function WatchedCalendar({
  items,
  year,
  monthIndex,
  onMonthChange,
  onSelectDay,
}: {
  items: CalendarWatchItem[]
  year: number
  monthIndex: number
  onMonthChange: (year: number, monthIndex: number) => void
  onSelectDay?: (date: string, dayItems: CalendarWatchItem[]) => void
}) {
  const today = toLocalDateString()
  const totalDays = daysInMonth(year, monthIndex)
  const startPad = firstWeekdayOfMonth(year, monthIndex)

  const byDay = new Map<number, CalendarWatchItem[]>()
  for (const item of items) {
    if (!item.watched_date) continue
    const [y, m, d] = item.watched_date.split("-").map(Number)
    if (y !== year || m !== monthIndex + 1) continue
    const list = byDay.get(d) ?? []
    list.push(item)
    byDay.set(d, list)
  }

  const goPrev = () => {
    if (monthIndex === 0) onMonthChange(year - 1, 11)
    else onMonthChange(year, monthIndex - 1)
  }

  const goNext = () => {
    if (monthIndex === 11) onMonthChange(year + 1, 0)
    else onMonthChange(year, monthIndex + 1)
  }

  const cells: Array<{ day: number | null }> = [
    ...Array.from({ length: startPad }, () => ({ day: null })),
    ...Array.from({ length: totalDays }, (_, i) => ({ day: i + 1 })),
  ]
  while (cells.length % 7 !== 0) cells.push({ day: null })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h3 className="text-sm font-medium text-foreground">
          {monthLabel(year, monthIndex)}
        </h3>
        <button
          type="button"
          onClick={goNext}
          className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell.day == null) {
            return <div key={`empty-${idx}`} className="aspect-square" />
          }

          const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`
          const dayItems = byDay.get(cell.day) ?? []
          const primary = dayItems[0]
          const isToday = dateStr === today
          const href = primary ? calendarItemHref(primary) : null

          const inner = (
            <div
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border border-border bg-muted/80",
                isToday && "ring-1 ring-brand/50",
                dayItems.length === 0 && "opacity-40",
              )}
            >
              <span className="absolute left-1 top-0.5 z-10 text-[10px] font-medium text-muted-foreground drop-shadow">
                {cell.day}
              </span>
              {primary?.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w185${primary.poster_path}`}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : null}
              {dayItems.length > 1 ? (
                <span className="absolute bottom-0.5 right-1 z-10 rounded bg-black/70 px-1 text-[9px] text-white">
                  +{dayItems.length - 1}
                </span>
              ) : null}
            </div>
          )

          if (dayItems.length === 0) {
            return <div key={dateStr}>{inner}</div>
          }

          if (onSelectDay) {
            return (
              <button
                key={dateStr}
                type="button"
                className="text-left"
                onClick={() => onSelectDay(dateStr, dayItems)}
              >
                {inner}
              </button>
            )
          }

          return href ? (
            <Link key={dateStr} href={href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={dateStr}>{inner}</div>
          )
        })}
      </div>
    </div>
  )
}
