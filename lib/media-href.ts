/**
 * Letterboxd-style media URLs:
 * - `/film/the-iron-giant` when the title is unique / is the primary namesake
 * - `/film/dune-2021` / `/film/film-2000` when another title shares the slug
 *
 * Letterboxd stores fixed LID↔slug mappings. We approximate that on TMDB by:
 * resolving exact Latin title matches and giving the short slug to the most
 * popular one; others keep `-YYYY`.
 *
 * Slugs use Latin characters only. CJK / non-latin `original_title` falls back
 * to the localized English title so we never collapse everything to a broken
 * placeholder slug.
 *
 * Legacy still works and redirects:
 * - `/film/10386`
 * - `/film/the-iron-giant-10386` (old slug-id form)
 */

import { slugify as listSlugify } from "@/lib/list-slug"

/**
 * Latin slug for URLs. Empty when the title has no a-z0-9 characters
 * (e.g. 鬼滅の刃) — callers must fall back to another title or numeric id.
 */
export function mediaSlugify(title: string): string {
  const s = listSlugify(title)
  // listSlugify returns "lista" for empty input — never reuse that in film URLs.
  if (!s || s === "lista") return ""
  return s
}

export type MediaHrefInput = {
  id: number | string
  /** Prefer original/English title; falls back to localized title. */
  original_title?: string | null
  title?: string | null
  name?: string | null
  original_name?: string | null
  release_date?: string | null
  first_air_date?: string | null
  /**
   * When true (default), append `-YYYY` if a year is known so remakes don't
   * collide in links. The detail page then strips the year when the title is
   * unique / is the primary (most popular) match — Letterboxd-style.
   */
  preferYear?: boolean
}

/** Prefer the first title that produces a real Latin slug. */
export function pickSlugTitle(
  ...candidates: Array<string | null | undefined>
): string {
  const cleaned = candidates
    .map((c) => c?.trim() || "")
    .filter(Boolean)
  for (const t of cleaned) {
    if (mediaSlugify(t)) return t
  }
  return cleaned[0] || ""
}

function resolveTitle(input: MediaHrefInput, kind: "movie" | "tv"): string {
  if (kind === "tv") {
    return pickSlugTitle(
      input.original_name,
      input.name,
      input.original_title,
      input.title,
    )
  }
  return pickSlugTitle(
    input.original_title,
    input.title,
    input.original_name,
    input.name,
  )
}

/** Extract YYYY from `2001-01-01` / `2001`. */
export function yearFromDate(date: string | null | undefined): number | null {
  if (!date) return null
  const m = String(date).trim().match(/^(\d{4})/)
  if (!m) return null
  const y = Number(m[1])
  if (y < 1900 || y > 2099) return null
  return y
}

/**
 * Split `dune-2021` → `{ base: "dune", year: 2021 }`.
 * Only trailing `-YYYY` (1900–2099) counts as a year (not TMDB ids).
 */
export function splitTitleSlug(slug: string): { base: string; year: number | null } {
  const cleaned = slug.trim().toLowerCase()
  const m = cleaned.match(/^(.*)-((?:19|20)\d{2})$/)
  if (m && m[1]) {
    return { base: m[1], year: Number(m[2]) }
  }
  return { base: cleaned, year: null }
}

/** Build the path segment: `the-iron-giant` or `dune-2021`. Empty if unusable. */
export function buildTitleSlug(title: string, year?: number | null): string {
  const base = mediaSlugify(title)
  if (!base) return ""
  return year ? `${base}-${year}` : base
}

function dateForKind(input: MediaHrefInput, kind: "movie" | "tv") {
  return kind === "tv"
    ? input.first_air_date || input.release_date
    : input.release_date || input.first_air_date
}

/** Canonical film path: `/film/{slug}` — falls back to `/film/{id}` if no Latin title. */
export function filmHref(input: MediaHrefInput): string {
  const id = Number(input.id)
  if (!Number.isFinite(id) || id <= 0) return "/films"
  const title = resolveTitle(input, "movie")
  const preferYear = input.preferYear !== false
  const year = preferYear ? yearFromDate(dateForKind(input, "movie")) : null
  const slug = title ? buildTitleSlug(title, year) : ""
  return slug ? `/film/${slug}` : `/film/${id}`
}

/** Canonical series path — falls back to `/series/{id}` if no Latin title. */
export function seriesHref(input: MediaHrefInput): string {
  const id = Number(input.id)
  if (!Number.isFinite(id) || id <= 0) return "/series"
  const title = resolveTitle(input, "tv")
  const preferYear = input.preferYear !== false
  const year = preferYear ? yearFromDate(dateForKind(input, "tv")) : null
  const slug = title ? buildTitleSlug(title, year) : ""
  return slug ? `/series/${slug}` : `/series/${id}`
}

export function mediaHref(
  input: MediaHrefInput & { mediaType?: string | null },
): string {
  return input.mediaType === "tv" ? seriesHref(input) : filmHref(input)
}

/**
 * Letterboxd rule: unique title → plain slug; when several share a title,
 * primary (highest popularity) keeps plain slug, others get `-YYYY`.
 * Returns "" when title can't form a Latin slug (caller should use numeric id).
 */
export function pickCanonicalTitleSlug(opts: {
  title: string
  year: number | null
  isPrimary: boolean
  hasSiblings: boolean
}): string {
  const base = mediaSlugify(opts.title)
  if (!base) return ""
  if (opts.hasSiblings && !opts.isPrimary && opts.year) {
    return `${base}-${opts.year}`
  }
  return base
}

export type ParsedMediaParam =
  | { kind: "id"; id: number; slug: string }
  | { kind: "slug"; slug: string; id?: undefined }

/**
 * Parse `/film/[param]` or `/series/[param]`:
 * - `10386` → TMDB id (legacy)
 * - `the-iron-giant-10386` → legacy slug-id (id ≥ 5 digits)
 * - `the-iron-giant` / `dune-2021` → title slug (+ optional year)
 */
export function parseMediaParam(
  param: string | null | undefined,
): ParsedMediaParam | null {
  const raw = (param ?? "").trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    const id = Number(raw)
    return id > 0 ? { kind: "id", id, slug: "" } : null
  }

  // Legacy `slug-{tmdbId}` — 5+ digits (years are 4 digits).
  const legacy = raw.match(/^(.*)-(\d{5,})$/)
  if (legacy) {
    const id = Number(legacy[2])
    if (Number.isFinite(id) && id > 0) {
      return { kind: "id", id, slug: legacy[1] }
    }
  }

  return { kind: "slug", slug: raw.toLowerCase() }
}

/** Turn a slug (without year) back into a search query. */
export function slugToSearchQuery(slug: string): string {
  const { base } = splitTitleSlug(slug)
  return base.replace(/-+/g, " ").trim()
}
