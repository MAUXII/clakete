/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Parse YYYY-MM-DD as local midnight. */
export function parseLocalDateString(value: string): Date {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function formatWatchedDate(
  value: string | null | undefined,
  locale = "en-US",
): string | null {
  if (!value) return null
  const date = parseLocalDateString(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatRewatchLabel(count: number): string | null {
  if (count <= 0) return null
  return count === 1 ? "1 rewatch" : `${count} rewatches`
}
