import { filmHref, seriesHref } from "@/lib/media-href"

import {
  readCachedMediaSlug,
  writeCachedMediaSlug,
} from "@/lib/client/media-slug-cache"

export type CanonicalMediaKind = "movie" | "tv"

export function canonicalMediaCacheKey(
  mediaType: string | null | undefined,
  tmdbId: number,
): string {
  return `${mediaType === "tv" ? "tv" : "movie"}:${tmdbId}`
}

export type CanonicalSlugPayload = {
  slug: string
  original_title?: string | null
  original_name?: string | null
}

export async function fetchCanonicalMediaSlug(
  mediaType: CanonicalMediaKind,
  tmdbId: number,
): Promise<CanonicalSlugPayload | null> {
  const cached = readCachedMediaSlug(mediaType, tmdbId)
  if (cached?.slug) return cached

  const endpoint =
    mediaType === "tv"
      ? `/api/series/${tmdbId}/slug`
      : `/api/movies/${tmdbId}/slug`

  const res = await fetch(endpoint)
  if (!res.ok) return null

  const payload = (await res.json()) as CanonicalSlugPayload
  if (payload?.slug) writeCachedMediaSlug(mediaType, tmdbId, payload)
  return payload
}

export { readCachedMediaSlug, writeCachedMediaSlug } from "@/lib/client/media-slug-cache"

/** True when href ends with numeric TMDB id (no English slug). */
export function mediaHrefUsesNumericId(href: string, tmdbId: number): boolean {
  return (
    href.endsWith(`/film/${tmdbId}`) ||
    href.endsWith(`/series/${tmdbId}`) ||
    href.includes(`/film/${tmdbId}/`) ||
    href.includes(`/series/${tmdbId}/`)
  )
}

export function slugFromStoredOriginal(input: {
  mediaType: CanonicalMediaKind
  tmdbId: number
  originalTitle?: string | null
  originalName?: string | null
  releaseDate?: string | null
}): string | null {
  const href =
    input.mediaType === "tv"
      ? seriesHref({
          id: input.tmdbId,
          original_name: input.originalName,
          first_air_date: input.releaseDate,
        })
      : filmHref({
          id: input.tmdbId,
          original_title: input.originalTitle,
          release_date: input.releaseDate,
        })

  const segment = href.replace(/^\/(film|series)\//, "").split("/")[0] ?? ""
  if (!segment || /^\d+$/.test(segment)) return null
  return segment
}
