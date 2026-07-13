import { parseLocalDateString } from "@/lib/watched-date"

export type DiaryExportRow = {
  title: string
  releaseDate: string | null
  watchedDate: string | null
  createdAt: string | null
  rating: number | null
  rewatchCount: number
  mediaType: string | null
  tmdbId: number
}

/** Letterboxd diary.csv headers (import-compatible). */
export const LETTERBOXD_DIARY_HEADERS = [
  "Date",
  "Name",
  "Year",
  "Letterboxd URI",
  "Rating",
  "Rewatch",
  "Tags",
  "Watched Date",
] as const

function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function yearFromRelease(releaseDate: string | null): string {
  if (!releaseDate) return ""
  const y = releaseDate.slice(0, 4)
  return /^\d{4}$/.test(y) ? y : ""
}

/** Letterboxd ratings are half-stars 0.5–5; Clakete stores 0–5 integer stars. */
function letterboxdRating(rating: number | null): string {
  if (rating == null || rating <= 0) return ""
  return String(Math.min(5, Math.max(0.5, rating)))
}

function loggedDate(row: DiaryExportRow): string {
  if (row.watchedDate) return row.watchedDate
  if (row.createdAt) return row.createdAt.slice(0, 10)
  return ""
}

/**
 * Build Letterboxd-compatible diary.csv.
 * Films and series are included; series get " (TV)" suffix so imports stay clear.
 */
export function buildLetterboxdDiaryCsv(rows: DiaryExportRow[]): string {
  const lines = [LETTERBOXD_DIARY_HEADERS.join(",")]

  const sorted = [...rows].sort((a, b) => {
    const da = a.watchedDate || a.createdAt || ""
    const db = b.watchedDate || b.createdAt || ""
    return db.localeCompare(da)
  })

  for (const row of sorted) {
    const isTv = row.mediaType === "tv"
    const name = `${row.title || "Untitled"}${isTv ? " (TV)" : ""}`
    const watched = row.watchedDate || loggedDate(row)
    const cells = [
      loggedDate(row),
      escapeCsv(name),
      yearFromRelease(row.releaseDate),
      "", // Letterboxd URI — not applicable
      letterboxdRating(row.rating),
      row.rewatchCount > 0 ? "Yes" : "",
      "",
      watched,
    ]
    lines.push(cells.join(","))
  }

  return lines.join("\n") + "\n"
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function diaryMonthKey(watchedDate: string | null): string | null {
  if (!watchedDate || watchedDate.length < 7) return null
  return watchedDate.slice(0, 7) // YYYY-MM
}

export function diaryYear(watchedDate: string | null): number | null {
  if (!watchedDate || watchedDate.length < 4) return null
  const y = Number(watchedDate.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function firstWeekdayOfMonth(year: number, monthIndex: number) {
  // 0 = Sunday
  return new Date(year, monthIndex, 1).getDay()
}

export function monthLabel(year: number, monthIndex: number, locale = "en-US") {
  return new Date(year, monthIndex, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  })
}

export function isSameDay(a: string | null, b: string) {
  return Boolean(a && a === b)
}

export { parseLocalDateString }
