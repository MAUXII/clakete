"use client"

import { useEffect, useState } from "react"

import { filmHref, seriesHref } from "@/lib/media-href"
import {
  fetchCanonicalMediaSlug,
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

  const fromHref =
    input.kind === "tv"
      ? seriesHref({
          id: input.id,
          original_name: input.original_name,
          name: input.name,
          first_air_date: input.first_air_date,
        })
      : filmHref({
          id: input.id,
          original_title: input.original_title,
          title: input.title,
          release_date: input.release_date,
        })

  const segment = fromHref.replace(/^\/(film|series)\//, "").split("/")[0] ?? ""
  if (segment && !/^\d+$/.test(segment)) return fromHref

  return null
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
      return
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
      setHref(null)
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
