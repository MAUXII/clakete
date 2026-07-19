/**
 * TMDB `/search/movie` and `/search/tv` claim to match alternative titles,
 * but a single `language=` often misses region-specific AKAs. Fan out across
 * common catalog languages and merge by id so e.g. "Fight Club" / "Clube da
 * Luta" / "El club de la lucha" all hit. Display still prefers the user's lang.
 */

import {
  mediaSlugify,
  pickCanonicalTitleSlug,
  pickSlugTitle,
  slugToSearchQuery,
  splitTitleSlug,
  yearFromDate,
} from "@/lib/media-href"

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL =
  process.env.NEXT_PUBLIC_TMDB_BASE_URL || "https://api.themoviedb.org/3"

/**
 * Languages used only for matching titles/AKAs.
 * User preferred first (so display fields win on merge), then a fixed set of
 * high-coverage TMDB locales — independent of watch region.
 */
const SEARCH_ALIAS_LANGUAGES = [
  "en-US",
  "pt-BR",
  "es-ES",
  "fr-FR",
  "de-DE",
  "it-IT",
  "ja-JP",
  "ko-KR",
  "zh-CN",
] as const

/** Always cover user lang + common catalog languages. */
export function searchLanguagesForAliases(preferred: string): string[] {
  const langs = [preferred.trim() || "en-US", ...SEARCH_ALIAS_LANGUAGES]
  const seen = new Set<string>()
  const out: string[] = []
  for (const lang of langs) {
    const key = lang.trim() || "en-US"
    if (seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

export type TmdbMovieSearchHit = {
  id: number
  title: string
  original_title?: string | null
  backdrop_path: string | null
  poster_path: string | null
  release_date: string
  overview: string
  vote_average: number
  popularity?: number
}

export type TmdbTvSearchHit = {
  id: number
  name: string
  original_name?: string | null
  backdrop_path: string | null
  poster_path: string | null
  first_air_date: string
  overview: string
  vote_average: number
  popularity?: number
}

function scoreHit(vote: number | undefined, popularity: number | undefined) {
  return (vote ?? 0) * 10 + (popularity ?? 0)
}

async function fetchSearchJson(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({
    api_key: TMDB_API_KEY || "",
    include_adult: "false",
    ...params,
  })
  const res = await fetch(`${TMDB_BASE_URL}${path}?${qs.toString()}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`TMDB ${path} failed (${res.status})`)
  }
  return res.json() as Promise<{ results?: unknown[] }>
}

/**
 * Search movies in multiple languages and merge — matches original / translated / AKA.
 * Display fields prefer `preferredLanguage` when that language returned the hit.
 */
export async function searchMoviesWithAliases(opts: {
  query: string
  preferredLanguage: string
  region?: string
  page?: string
}): Promise<TmdbMovieSearchHit[]> {
  const languages = searchLanguagesForAliases(opts.preferredLanguage)
  const preferred = languages[0]

  const batches = await Promise.all(
    languages.map(async (language) => {
      // Intentionally omit `region`: matching should be global. Watch region
      // only affects providers / prefs elsewhere; language above only for display.
      const data = await fetchSearchJson("/search/movie", {
        query: opts.query,
        language,
        page: opts.page || "1",
      })
      return { language, rows: Array.isArray(data.results) ? data.results : [] }
    }),
  )

  type Row = {
    id?: number
    title?: string
    original_title?: string | null
    backdrop_path?: string | null
    poster_path?: string | null
    release_date?: string
    overview?: string
    vote_average?: number
    popularity?: number
  }

  const byId = new Map<
    number,
    TmdbMovieSearchHit & { _fromPreferred: boolean; _score: number }
  >()

  for (const { language, rows } of batches) {
    const fromPreferred = language === preferred
    for (const raw of rows as Row[]) {
      if (!raw?.id) continue
      if (!(raw.title || raw.backdrop_path || raw.poster_path)) continue

      const hit: TmdbMovieSearchHit & { _fromPreferred: boolean; _score: number } = {
        id: raw.id,
        title: raw.title || raw.original_title || "",
        original_title: raw.original_title ?? null,
        backdrop_path: raw.backdrop_path ?? null,
        poster_path: raw.poster_path ?? null,
        release_date: raw.release_date || "",
        overview: raw.overview || "",
        vote_average: raw.vote_average ?? 0,
        popularity: raw.popularity,
        _fromPreferred: fromPreferred,
        _score: scoreHit(raw.vote_average, raw.popularity),
      }

      const existing = byId.get(raw.id)
      if (!existing) {
        byId.set(raw.id, hit)
        continue
      }

      // Prefer display fields from the user's language when present.
      if (fromPreferred && !existing._fromPreferred) {
        byId.set(raw.id, {
          ...hit,
          vote_average: Math.max(existing.vote_average, hit.vote_average),
          popularity: Math.max(existing.popularity ?? 0, hit.popularity ?? 0),
          original_title: hit.original_title || existing.original_title,
          _score: Math.max(existing._score, hit._score),
        })
        continue
      }

      if (hit._score > existing._score) {
        byId.set(raw.id, {
          ...existing,
          vote_average: Math.max(existing.vote_average, hit.vote_average),
          popularity: Math.max(existing.popularity ?? 0, hit.popularity ?? 0),
          original_title: existing.original_title || hit.original_title,
          // keep existing preferred display title unless we never had one
          title: existing._fromPreferred ? existing.title : hit.title,
          overview: existing._fromPreferred ? existing.overview : hit.overview || existing.overview,
          _score: hit._score,
        })
      } else {
        existing.vote_average = Math.max(existing.vote_average, hit.vote_average)
        existing.popularity = Math.max(existing.popularity ?? 0, hit.popularity ?? 0)
        existing.original_title = existing.original_title || hit.original_title
        existing._score = Math.max(existing._score, hit._score)
      }
    }
  }

  return Array.from(byId.values())
    .map(({ _fromPreferred: _a, _score: _b, ...rest }) => rest)
    .sort((a, b) => scoreHit(b.vote_average, b.popularity) - scoreHit(a.vote_average, a.popularity))
}

export async function searchTvWithAliases(opts: {
  query: string
  preferredLanguage: string
  page?: string
}): Promise<TmdbTvSearchHit[]> {
  const languages = searchLanguagesForAliases(opts.preferredLanguage)
  const preferred = languages[0]

  const batches = await Promise.all(
    languages.map(async (language) => {
      const data = await fetchSearchJson("/search/tv", {
        query: opts.query,
        language,
        page: opts.page || "1",
      })
      return { language, rows: Array.isArray(data.results) ? data.results : [] }
    }),
  )

  type Row = {
    id?: number
    name?: string
    original_name?: string | null
    backdrop_path?: string | null
    poster_path?: string | null
    first_air_date?: string
    overview?: string
    vote_average?: number
    popularity?: number
  }

  const byId = new Map<
    number,
    TmdbTvSearchHit & { _fromPreferred: boolean; _score: number }
  >()

  for (const { language, rows } of batches) {
    const fromPreferred = language === preferred
    for (const raw of rows as Row[]) {
      if (!raw?.id) continue
      if (!(raw.name || raw.backdrop_path || raw.poster_path)) continue

      const hit: TmdbTvSearchHit & { _fromPreferred: boolean; _score: number } = {
        id: raw.id,
        name: raw.name || raw.original_name || "",
        original_name: raw.original_name ?? null,
        backdrop_path: raw.backdrop_path ?? null,
        poster_path: raw.poster_path ?? null,
        first_air_date: raw.first_air_date || "",
        overview: raw.overview || "",
        vote_average: raw.vote_average ?? 0,
        popularity: raw.popularity,
        _fromPreferred: fromPreferred,
        _score: scoreHit(raw.vote_average, raw.popularity),
      }

      const existing = byId.get(raw.id)
      if (!existing) {
        byId.set(raw.id, hit)
        continue
      }

      if (fromPreferred && !existing._fromPreferred) {
        byId.set(raw.id, {
          ...hit,
          vote_average: Math.max(existing.vote_average, hit.vote_average),
          popularity: Math.max(existing.popularity ?? 0, hit.popularity ?? 0),
          original_name: hit.original_name || existing.original_name,
          _score: Math.max(existing._score, hit._score),
        })
        continue
      }

      if (hit._score > existing._score) {
        byId.set(raw.id, {
          ...existing,
          vote_average: Math.max(existing.vote_average, hit.vote_average),
          popularity: Math.max(existing.popularity ?? 0, hit.popularity ?? 0),
          original_name: existing.original_name || hit.original_name,
          name: existing._fromPreferred ? existing.name : hit.name,
          overview: existing._fromPreferred ? existing.overview : hit.overview || existing.overview,
          _score: hit._score,
        })
      } else {
        existing.vote_average = Math.max(existing.vote_average, hit.vote_average)
        existing.popularity = Math.max(existing.popularity ?? 0, hit.popularity ?? 0)
        existing.original_name = existing.original_name || hit.original_name
        existing._score = Math.max(existing._score, hit._score)
      }
    }
  }

  return Array.from(byId.values())
    .map(({ _fromPreferred: _a, _score: _b, ...rest }) => rest)
    .sort((a, b) => scoreHit(b.vote_average, b.popularity) - scoreHit(a.vote_average, a.popularity))
}

/**
 * Resolve a Letterboxd-style title slug to a TMDB movie id + canonical slug.
 * Supports `dune` (primary) and `dune-1984` (year disambiguation).
 * Requires an exact Latin title/original_title slug match (no fuzzy fallback),
 * so junk queries like `film` can't land on a random popular movie.
 */
export async function resolveMovieBySlug(slug: string): Promise<{
  id: number
  canonicalSlug: string
} | null> {
  const cleaned = slug.trim().toLowerCase()
  if (!cleaned) return null
  const { base, year } = splitTitleSlug(cleaned)
  if (!base || !mediaSlugify(base)) return null
  const query = slugToSearchQuery(base)
  if (!query) return null

  const rows = await searchMoviesWithAliases({
    query,
    preferredLanguage: "en-US",
  })

  const titleMatches = rows.filter((r) => {
    const o = r.original_title ? mediaSlugify(r.original_title) : ""
    const t = r.title ? mediaSlugify(r.title) : ""
    return (o !== "" && o === base) || (t !== "" && t === base)
  })

  if (titleMatches.length === 0) return null

  // Letterboxd assigns a stable short slug to one "primary" title; remakes get
  // `-YYYY`. We approximate primary as highest TMDB popularity (not vote_average
  // — niche films can show inflated 9–10 with almost no votes).
  titleMatches.sort(
    (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  )

  if (year != null) {
    const yearMatches = titleMatches.filter(
      (r) => yearFromDate(r.release_date) === year,
    )
    if (yearMatches.length === 0) return null
    const chosen = yearMatches[0]!
    const primaryId = titleMatches[0]!.id
    const title = pickSlugTitle(chosen.original_title, chosen.title) || base
    const chosenYear = yearFromDate(chosen.release_date)
    const canonicalSlug =
      pickCanonicalTitleSlug({
        title,
        year: chosenYear,
        isPrimary: chosen.id === primaryId,
        hasSiblings: titleMatches.length > 1,
      }) || String(chosen.id)
    return { id: chosen.id, canonicalSlug }
  }

  const chosen = titleMatches[0]!
  const primaryId = titleMatches[0]!.id
  const title = pickSlugTitle(chosen.original_title, chosen.title) || base
  const chosenYear = yearFromDate(chosen.release_date)
  const canonicalSlug =
    pickCanonicalTitleSlug({
      title,
      year: chosenYear,
      isPrimary: chosen.id === primaryId,
      hasSiblings: titleMatches.length > 1,
    }) || String(chosen.id)

  return { id: chosen.id, canonicalSlug }
}

/** @deprecated Prefer resolveMovieBySlug */
export async function resolveMovieIdBySlug(slug: string): Promise<number | null> {
  const hit = await resolveMovieBySlug(slug)
  return hit?.id ?? null
}

/** Resolve a title slug to a TMDB TV id + canonical slug. */
export async function resolveTvBySlug(slug: string): Promise<{
  id: number
  canonicalSlug: string
} | null> {
  const cleaned = slug.trim().toLowerCase()
  if (!cleaned) return null
  const { base, year } = splitTitleSlug(cleaned)
  if (!base || !mediaSlugify(base)) return null
  const query = slugToSearchQuery(base)
  if (!query) return null

  const rows = await searchTvWithAliases({
    query,
    preferredLanguage: "en-US",
  })

  const titleMatches = rows.filter((r) => {
    const o = r.original_name ? mediaSlugify(r.original_name) : ""
    const t = r.name ? mediaSlugify(r.name) : ""
    return (o !== "" && o === base) || (t !== "" && t === base)
  })

  if (titleMatches.length === 0) return null

  titleMatches.sort(
    (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  )

  if (year != null) {
    const yearMatches = titleMatches.filter(
      (r) => yearFromDate(r.first_air_date) === year,
    )
    if (yearMatches.length === 0) return null
    const chosen = yearMatches[0]!
    const primaryId = titleMatches[0]!.id
    const title = pickSlugTitle(chosen.original_name, chosen.name) || base
    const chosenYear = yearFromDate(chosen.first_air_date)
    const canonicalSlug =
      pickCanonicalTitleSlug({
        title,
        year: chosenYear,
        isPrimary: chosen.id === primaryId,
        hasSiblings: titleMatches.length > 1,
      }) || String(chosen.id)
    return { id: chosen.id, canonicalSlug }
  }

  const chosen = titleMatches[0]!
  const primaryId = titleMatches[0]!.id
  const title = pickSlugTitle(chosen.original_name, chosen.name) || base
  const chosenYear = yearFromDate(chosen.first_air_date)
  const canonicalSlug =
    pickCanonicalTitleSlug({
      title,
      year: chosenYear,
      isPrimary: chosen.id === primaryId,
      hasSiblings: titleMatches.length > 1,
    }) || String(chosen.id)

  return { id: chosen.id, canonicalSlug }
}

/** @deprecated Prefer resolveTvBySlug */
export async function resolveTvIdBySlug(slug: string): Promise<number | null> {
  const hit = await resolveTvBySlug(slug)
  return hit?.id ?? null
}
