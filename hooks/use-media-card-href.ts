"use client"

import { useEffect, useState } from "react"

import { filmHref, seriesHref } from "@/lib/media-href"
import {
  fetchCanonicalMediaSlug,
  mediaHrefUsesNumericId,
  readCachedMediaSlug,
  slugFromStoredOriginal,
  writeCachedMediaSlug,
  type CanonicalMediaKind,
} from "@/lib/client/canonical-media-slug"

type UseMediaCardHrefInput = {
  kind: CanonicalMediaKind
  id: number
  /** When set (including `null`), skips automatic slug resolution. */
  hrefOverride?: string | null
  original_title?: string | null
  original_name?: string | null
  title?: string | null
  name?: string | null
  release_date?: string | null
  first_air_date?: string | null
}

function mediaPathFromSlug(kind: CanonicalMediaKind, slug: string): string {
  return kind === "tv" ? `/series/${slug}` : `/film/${slug}`
}

function persistResolvedSlug(input: UseMediaCardHrefInput, path: string) {
  const segment = path.replace(/^\/(film|series)\//, "").split("/")[0] ?? ""
  if (!segment || /^\d+$/.test(segment) || !input.id) return
  writeCachedMediaSlug(input.kind, input.id, {
    slug: segment,
    original_title: input.original_title,
    original_name: input.original_name,
  })
}

/**
 * Speculative href from *original* title only (never localized display title).
 * Localized titles like "Zona Zero" for 군체/Colony break TMDB slug resolve.
 * Falls back to `/film/{id}` so the click always works (Letterboxd has /tmdb/{id}).
 */
function buildHrefFromKnown(input: UseMediaCardHrefInput): string | null {
  if (!input.id) return null

  const stored = slugFromStoredOriginal({
    mediaType: input.kind,
    tmdbId: input.id,
    originalTitle: input.original_title,
    originalName: input.original_name,
    releaseDate: input.release_date ?? input.first_air_date,
  })
  if (stored) return mediaPathFromSlug(input.kind, stored)

  const cached = readCachedMediaSlug(input.kind, input.id)
  if (cached?.slug) return mediaPathFromSlug(input.kind, cached.slug)

  // Only original_* — do not pass localized title/name.
  const fromOriginal =
    input.kind === "tv"
      ? seriesHref({
          id: input.id,
          original_name: input.original_name,
          first_air_date: input.first_air_date,
        })
      : filmHref({
          id: input.id,
          original_title: input.original_title,
          release_date: input.release_date,
        })

  const segment =
    fromOriginal.replace(/^\/(film|series)\//, "").split("/")[0] ?? ""
  if (segment && !/^\d+$/.test(segment)) return fromOriginal

  return mediaPathFromSlug(input.kind, String(input.id))
}

export function useMediaCardHref(input: UseMediaCardHrefInput): string | null {
  const { hrefOverride: override } = input

  const [href, setHref] = useState<string | null>(() => {
    if (override !== undefined) return override
    return buildHrefFromKnown(input)
  })

  useEffect(() => {
    if (override !== undefined) {
      setHref(override)
      return
    }

    const known = buildHrefFromKnown(input)
    if (known) {
      persistResolvedSlug(input, known)
      setHref(known)
      // Pretty slug already known — done.
      if (!mediaHrefUsesNumericId(known, input.id)) return
    }

    if (!input.id) {
      setHref(null)
      return
    }

    let cancelled = false

    void fetchCanonicalMediaSlug(input.kind, input.id).then((payload) => {
      if (cancelled) return
      if (payload?.slug) {
        setHref(mediaPathFromSlug(input.kind, payload.slug))
        return
      }
      // Keep numeric id link if we already set one.
      if (!known) setHref(mediaPathFromSlug(input.kind, String(input.id)))
    })

    return () => {
      cancelled = true
    }
  }, [
    override,
    input.id,
    input.kind,
    input.original_title,
    input.original_name,
    input.title,
    input.name,
    input.release_date,
    input.first_air_date,
  ])

  return href
}
