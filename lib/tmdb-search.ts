/**
 * TMDB `/search/movie` and `/search/tv` claim to match alternative titles,
 * but a single `language=` often misses region-specific AKAs. Fan out across a
 * few languages and merge by id so e.g. "Fight Club" / "Clube da Luta" both hit.
 */

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL =
  process.env.NEXT_PUBLIC_TMDB_BASE_URL || "https://api.themoviedb.org/3"

/** Always cover user lang + English + Portuguese (Clakete BR-first). */
export function searchLanguagesForAliases(preferred: string): string[] {
  const langs = [preferred, "en-US", "pt-BR"]
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
      const data = await fetchSearchJson("/search/movie", {
        query: opts.query,
        language,
        page: opts.page || "1",
        ...(opts.region ? { region: opts.region } : {}),
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
