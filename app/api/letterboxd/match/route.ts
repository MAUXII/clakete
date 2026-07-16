import { NextResponse } from "next/server"
import { searchMoviesWithAliases } from "@/lib/tmdb-search"

type MatchRequestItem = {
  name: string
  year?: number | null
}

type TmdbHit = {
  id: number
  title: string
  original_title?: string | null
  poster_path: string | null
  release_date: string
  vote_average: number
  media_type: "movie"
}

function yearOf(date: string | undefined) {
  if (!date || date.length < 4) return null
  const y = Number(date.slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function pickBest(
  results: TmdbHit[],
  name: string,
  year: number | null | undefined,
): TmdbHit | null {
  if (results.length === 0) return null
  const needle = name.trim().toLowerCase()

  const scored = results.map((r) => {
    const title = (r.title || "").toLowerCase()
    const original = (r.original_title || "").toLowerCase()
    const y = yearOf(r.release_date)
    let score = r.vote_average || 0

    if (title === needle || original === needle) score += 100
    else if (
      title.startsWith(needle) ||
      needle.startsWith(title) ||
      original.startsWith(needle) ||
      needle.startsWith(original)
    ) {
      score += 40
    } else if (title.includes(needle) || original.includes(needle)) {
      score += 20
    }

    if (year != null && y != null) {
      if (y === year) score += 80
      else if (Math.abs(y - year) === 1) score += 25
      else score -= Math.min(40, Math.abs(y - year) * 5)
    }

    return { r, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.r ?? null
}

async function searchMovie(query: string): Promise<TmdbHit[]> {
  const rows = await searchMoviesWithAliases({
    query,
    preferredLanguage: "en-US",
    region: "US",
    page: "1",
  })
  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    original_title: m.original_title ?? null,
    poster_path: m.poster_path ?? null,
    release_date: m.release_date ?? "",
    vote_average: m.vote_average ?? 0,
    media_type: "movie" as const,
  }))
}

/**
 * POST { items: [{ name, year? }] }
 * Returns matches aligned by index (null when unmatched).
 * Processes sequentially with a tiny delay to stay under TMDB rate limits.
 */
export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_TMDB_API_KEY) {
      return NextResponse.json(
        { error: "TMDB API key not configured" },
        { status: 500 },
      )
    }

    const body = await request.json()
    const items = Array.isArray(body?.items) ? (body.items as MatchRequestItem[]) : []

    if (items.length === 0) {
      return NextResponse.json({ matches: [] })
    }
    if (items.length > 40) {
      return NextResponse.json(
        { error: "Max 40 items per request" },
        { status: 400 },
      )
    }

    const cache = new Map<string, TmdbHit | null>()
    const matches: Array<{
      tmdbId: number
      title: string
      posterPath: string | null
      releaseDate: string | null
      mediaType: "movie"
    } | null> = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const name = String(item?.name || "").trim()
      const year =
        item?.year != null && Number.isFinite(Number(item.year))
          ? Number(item.year)
          : null

      if (!name) {
        matches.push(null)
        continue
      }

      const cacheKey = `${name.toLowerCase()}::${year ?? ""}`
      if (cache.has(cacheKey)) {
        const hit = cache.get(cacheKey)
        matches.push(
          hit
            ? {
                tmdbId: hit.id,
                title: hit.title,
                posterPath: hit.poster_path,
                releaseDate: hit.release_date || null,
                mediaType: "movie",
              }
            : null,
        )
        continue
      }

      try {
        const results = await searchMovie(name)
        const best = pickBest(results, name, year)
        cache.set(cacheKey, best)
        matches.push(
          best
            ? {
                tmdbId: best.id,
                title: best.title,
                posterPath: best.poster_path,
                releaseDate: best.release_date || null,
                mediaType: "movie",
              }
            : null,
        )
      } catch (e) {
        console.error("[letterboxd-match]", name, e)
        cache.set(cacheKey, null)
        matches.push(null)
      }

      // soft throttle between TMDB calls (each item fans out to ~3 langs)
      if (i < items.length - 1) {
        await new Promise((r) => setTimeout(r, 160))
      }
    }

    return NextResponse.json({ matches })
  } catch (error) {
    console.error("[letterboxd-match]", error)
    return NextResponse.json({ error: "Match failed" }, { status: 500 })
  }
}
