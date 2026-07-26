"use client"

import { useEffect, useMemo, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  canonicalMediaCacheKey,
  fetchCanonicalMediaSlug,
  readCachedMediaSlug,
  slugFromStoredOriginal,
  writeCachedMediaSlug,
  type CanonicalMediaKind,
} from "@/lib/client/canonical-media-slug"
import type { Database } from "@/lib/supabase/database.types"

type SlugItem = {
  id?: number
  tmdb_id: number
  media_type: string | null
  original_title?: string | null
  original_name?: string | null
  release_date?: string | null
}

export function useCanonicalMediaSlugs(
  items: SlugItem[],
  supabase: SupabaseClient<Database> | null,
  userId?: string,
) {
  const [slugByKey, setSlugByKey] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const item of items) {
      const kind: CanonicalMediaKind = item.media_type === "tv" ? "tv" : "movie"
      const key = canonicalMediaCacheKey(item.media_type, item.tmdb_id)

      const stored = slugFromStoredOriginal({
        mediaType: kind,
        tmdbId: item.tmdb_id,
        originalTitle: item.original_title,
        originalName: item.original_name,
        releaseDate: item.release_date,
      })
      if (stored) {
        initial[key] = stored
        continue
      }

      const cached = readCachedMediaSlug(kind, item.tmdb_id)
      if (cached?.slug) initial[key] = cached.slug
    }
    return initial
  })

  const itemsKey = useMemo(
    () =>
      items
        .map(
          (i) =>
            `${i.id ?? ""}:${i.tmdb_id}:${i.media_type ?? ""}:${i.original_title ?? ""}:${i.original_name ?? ""}`,
        )
        .join("|"),
    [items],
  )

  useEffect(() => {
    if (!items.length) {
      setSlugByKey({})
      return
    }

    let cancelled = false

    void (async () => {
      const next: Record<string, string> = {}

      await Promise.all(
        items.map(async (item) => {
          const kind: CanonicalMediaKind = item.media_type === "tv" ? "tv" : "movie"
          const key = canonicalMediaCacheKey(item.media_type, item.tmdb_id)

          const stored = slugFromStoredOriginal({
            mediaType: kind,
            tmdbId: item.tmdb_id,
            originalTitle: item.original_title,
            originalName: item.original_name,
            releaseDate: item.release_date,
          })
          if (stored) {
            next[key] = stored
            writeCachedMediaSlug(kind, item.tmdb_id, {
              slug: stored,
              original_title: item.original_title,
              original_name: item.original_name,
            })
            return
          }

          const cached = readCachedMediaSlug(kind, item.tmdb_id)
          if (cached?.slug) {
            next[key] = cached.slug
            return
          }

          const payload = await fetchCanonicalMediaSlug(kind, item.tmdb_id)
          if (!payload?.slug || cancelled) return

          next[key] = payload.slug

          if (supabase && userId && item.id) {
            const patch =
              kind === "tv"
                ? payload.original_name
                  ? { original_name: payload.original_name }
                  : null
                : payload.original_title
                  ? { original_title: payload.original_title }
                  : null

            if (patch) {
              void supabase
                .from("items_interactions")
                .update(patch)
                .eq("id", item.id)
                .eq("user_id", userId)
            }
          }
        }),
      )

      if (!cancelled) setSlugByKey(next)
    })()

    return () => {
      cancelled = true
    }
  }, [itemsKey, items, supabase, userId])

  return slugByKey
}
