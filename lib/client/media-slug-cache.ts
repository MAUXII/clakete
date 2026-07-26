export type CachedMediaSlug = {
  slug: string
  original_title?: string | null
  original_name?: string | null
}

const STORAGE_KEY = "clakete.media_slugs.v1"

type CacheEntry = CachedMediaSlug & { cachedAt: number }

const memory = new Map<string, CachedMediaSlug>()

export function mediaSlugStorageKey(mediaType: "movie" | "tv", tmdbId: number): string {
  return `${mediaType}:${tmdbId}`
}

function readStore(): Record<string, CacheEntry> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, CacheEntry>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota exceeded — ignore
  }
}

export function readCachedMediaSlug(
  mediaType: "movie" | "tv",
  tmdbId: number,
): CachedMediaSlug | null {
  const key = mediaSlugStorageKey(mediaType, tmdbId)
  const fromMem = memory.get(key)
  if (fromMem?.slug) return fromMem

  const entry = readStore()[key]
  if (!entry?.slug) return null

  const payload: CachedMediaSlug = {
    slug: entry.slug,
    original_title: entry.original_title,
    original_name: entry.original_name,
  }
  memory.set(key, payload)
  return payload
}

export function writeCachedMediaSlug(
  mediaType: "movie" | "tv",
  tmdbId: number,
  payload: CachedMediaSlug,
) {
  if (!payload.slug) return

  const key = mediaSlugStorageKey(mediaType, tmdbId)
  memory.set(key, payload)

  const store = readStore()
  store[key] = { ...payload, cachedAt: Date.now() }
  writeStore(store)
}
