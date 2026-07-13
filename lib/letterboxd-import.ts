/**
 * Parse & normalize Letterboxd export CSVs (diary.csv, watched.csv, ratings.csv).
 * Export from Letterboxd: Settings → Import & Export → Export your data.
 */

export type LetterboxdCsvRow = {
  name: string
  year: number | null
  watchedDate: string | null
  /** Letterboxd half-stars 0.5–5 */
  rating: number | null
  isRewatch: boolean
  letterboxdUri: string | null
}

/** One film after collapsing multiple diary logs of the same title+year. */
export type LetterboxdCollapsedEntry = {
  name: string
  year: number | null
  watchedDate: string | null
  rating: number | null
  /** Derived: max(0, logCount - 1) or count of Rewatch=Yes */
  rewatchCount: number
  logCount: number
  letterboxdUri: string | null
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  const pushCell = () => {
    row.push(cell)
    cell = ""
  }
  const pushRow = () => {
    // skip fully empty trailing rows
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = []
      return
    }
    rows.push(row)
    row = []
  }

  const input = text.replace(/^\uFEFF/, "")
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      pushCell()
    } else if (ch === "\r") {
      // ignore; handle \n
    } else if (ch === "\n") {
      pushCell()
      pushRow()
    } else {
      cell += ch
    }
  }

  if (cell.length > 0 || row.length > 0) {
    pushCell()
    pushRow()
  }

  return rows
}

function normHeader(h: string) {
  return h.trim().toLowerCase().replace(/[\s_]+/g, "")
}

function pickCol(headers: string[], ...aliases: string[]): number {
  const wanted = aliases.map(normHeader)
  return headers.findIndex((h) => wanted.includes(normHeader(h)))
}

function parseYear(raw: string): number | null {
  const y = Number(String(raw).trim().slice(0, 4))
  if (!Number.isFinite(y) || y < 1880 || y > 2100) return null
  return y
}

function parseDate(raw: string): string | null {
  const s = String(raw).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return s
}

function parseRating(raw: string): number | null {
  const n = Number(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return null
  // Rating10 → convert
  if (n > 5 && n <= 10) return Math.min(5, Math.round(n) / 2)
  return Math.min(5, Math.max(0.5, n))
}

function parseRewatch(raw: string): boolean {
  const s = String(raw).trim().toLowerCase()
  return s === "yes" || s === "true" || s === "1"
}

/** Strip trailing " (TV)" / year parentheses occasionally present. */
export function cleanLetterboxdTitle(name: string): string {
  return name
    .replace(/\s*\(TV\)\s*$/i, "")
    .replace(/\s*\(\d{4}\)\s*$/, "")
    .trim()
}

/**
 * Parse Letterboxd export CSV text.
 * Accepts diary.csv, watched.csv, ratings.csv header variants.
 */
export function parseLetterboxdCsv(text: string): LetterboxdCsvRow[] {
  const table = parseCsv(text)
  if (table.length < 2) return []

  const headers = table[0]
  const nameIdx = pickCol(headers, "Name", "Title")
  if (nameIdx < 0) {
    throw new Error('CSV missing "Name" or "Title" column (Letterboxd export?)')
  }

  const yearIdx = pickCol(headers, "Year")
  const watchedIdx = pickCol(headers, "Watched Date", "WatchedDate")
  const dateIdx = pickCol(headers, "Date")
  const ratingIdx = pickCol(headers, "Rating", "Rating10")
  const rewatchIdx = pickCol(headers, "Rewatch")
  const uriIdx = pickCol(headers, "Letterboxd URI", "LetterboxdURI", "url")

  const isRating10 =
    ratingIdx >= 0 && normHeader(headers[ratingIdx]) === "rating10"

  const rows: LetterboxdCsvRow[] = []

  for (let i = 1; i < table.length; i++) {
    const cols = table[i]
    const rawName = (cols[nameIdx] ?? "").trim()
    if (!rawName) continue

    const year = yearIdx >= 0 ? parseYear(cols[yearIdx] ?? "") : null
    const watchedDate =
      (watchedIdx >= 0 ? parseDate(cols[watchedIdx] ?? "") : null) ||
      (dateIdx >= 0 ? parseDate(cols[dateIdx] ?? "") : null)

    let rating: number | null = null
    if (ratingIdx >= 0) {
      const raw = cols[ratingIdx] ?? ""
      if (isRating10) {
        const n = Number(String(raw).trim())
        rating = Number.isFinite(n) && n > 0 ? Math.min(5, n / 2) : null
      } else {
        rating = parseRating(raw)
      }
    }

    rows.push({
      name: cleanLetterboxdTitle(rawName),
      year,
      watchedDate,
      rating,
      isRewatch: rewatchIdx >= 0 ? parseRewatch(cols[rewatchIdx] ?? "") : false,
      letterboxdUri: uriIdx >= 0 ? (cols[uriIdx] ?? "").trim() || null : null,
    })
  }

  return rows
}

function entryKey(name: string, year: number | null) {
  return `${name.toLowerCase()}::${year ?? ""}`
}

/** Collapse multiple diary logs of the same film into one Clakete row. */
export function collapseLetterboxdRows(
  rows: LetterboxdCsvRow[],
): LetterboxdCollapsedEntry[] {
  // Preserve first-seen order
  const order: string[] = []
  const groups = new Map<string, LetterboxdCsvRow[]>()

  for (const row of rows) {
    const key = entryKey(row.name, row.year)
    if (!groups.has(key)) {
      groups.set(key, [])
      order.push(key)
    }
    groups.get(key)!.push(row)
  }

  return order.map((key) => {
    const group = groups.get(key)!
    const sorted = [...group].sort((a, b) =>
      (b.watchedDate || "").localeCompare(a.watchedDate || ""),
    )
    const latest = sorted[0]
    const rewatchFlags = group.filter((r) => r.isRewatch).length
    const rewatchCount = Math.max(rewatchFlags, Math.max(0, group.length - 1))

    let rating: number | null = null
    for (const r of sorted) {
      if (r.rating != null) {
        rating = r.rating
        break
      }
    }

    return {
      name: latest.name,
      year: latest.year,
      watchedDate: latest.watchedDate,
      rating,
      rewatchCount,
      logCount: group.length,
      letterboxdUri: latest.letterboxdUri,
    }
  })
}

/** Clakete stores integer 0–5 stars. */
export function letterboxdRatingToClakete(rating: number | null): number {
  if (rating == null || rating <= 0) return 0
  return Math.min(5, Math.max(0, Math.round(rating)))
}

export function detectLetterboxdKind(headers: string[]): "diary" | "watched" | "ratings" | "unknown" {
  const set = new Set(headers.map(normHeader))
  if (set.has("watcheddate") || set.has("rewatch")) return "diary"
  if (set.has("rating") || set.has("rating10")) return "ratings"
  if (set.has("name") || set.has("title")) return "watched"
  return "unknown"
}
