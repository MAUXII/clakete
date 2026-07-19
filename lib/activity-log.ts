import { parseLocalDateString } from "@/lib/watched-date"
import { filmHref, seriesHref } from "@/lib/media-href"

export type ActivityKind =
  | "joined"
  | "watched"
  | "reviewed"
  | "rated"
  | "liked"
  | "watchlist"
  | "list_created"
  | "list_item"
  | "followed"
  | "shared"

export type ActivityEvent = {
  id: string
  kind: ActivityKind
  at: string // ISO or YYYY-MM-DD
  title: string
  href?: string | null
  posterPath?: string | null
  subtitle?: string | null
  rating?: number | null
  rewatchCount?: number
  mediaType?: string | null
  tmdbId?: number | null
}

export function activityDayKey(at: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(at)) return at.slice(0, 10)
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return at.slice(0, 10)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function formatActivityDay(key: string, locale = "en-US"): string {
  const date = parseLocalDateString(key)
  if (Number.isNaN(date.getTime())) return key
  const today = new Date()
  const todayKey = activityDayKey(today.toISOString())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = activityDayKey(yesterday.toISOString())

  if (key === todayKey) return "Today"
  if (key === yesterdayKey) return "Yesterday"

  return date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  })
}

export function formatActivityTime(at: string, locale = "en-US"): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(at)) return ""
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })
}

export function formatActivityRange(
  oldest: string | null,
  newest: string | null,
  locale = "en-US",
): string | null {
  if (!oldest || !newest) return null
  const a = parseLocalDateString(activityDayKey(oldest))
  const b = parseLocalDateString(activityDayKey(newest))
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })
  return `${fmt(a)} → ${fmt(b)}`
}

export function sortActivityEvents(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort((x, y) => {
    const xa = x.at.length === 10 ? `${x.at}T23:59:59` : x.at
    const ya = y.at.length === 10 ? `${y.at}T23:59:59` : y.at
    return ya.localeCompare(xa)
  })
}

export function mediaHref(
  tmdbId: number,
  mediaType: string | null | undefined,
  title?: string | null,
) {
  return mediaType === "tv"
    ? seriesHref({ id: tmdbId, name: title })
    : filmHref({ id: tmdbId, title })
}

export function activityVerb(kind: ActivityKind, rewatchCount = 0): string {
  switch (kind) {
    case "joined":
      return "joined Clakete"
    case "watched":
      return rewatchCount > 0 ? "rewatched" : "watched"
    case "reviewed":
      return "reviewed"
    case "rated":
      return "rated"
    case "liked":
      return "liked"
    case "watchlist":
      return "added to watchlist"
    case "list_created":
      return "created list"
    case "list_item":
      return "added to list"
    case "followed":
      return "followed"
    case "shared":
      return "shared to feed"
    default:
      return "did something"
  }
}
