/** Pick & cache side-panel art for the diary dialog (poster/backdrop). */

export type TmdbStill = {
  file_path: string
  aspect_ratio?: number
  height?: number
  width?: number
  iso_639_1?: string | null
  vote_average?: number
  vote_count?: number
}

export type DiaryArtPick = {
  path: string
  kind: "poster" | "backdrop"
}

type ImagesPayload = {
  posters: TmdbStill[]
  backdrops: TmdbStill[]
}

const cache = new Map<string, Promise<DiaryArtPick | null>>()

const TARGET_PORTRAIT = 2 / 3

function scorePoster(p: TmdbStill, primaryPoster?: string | null) {
  const aspect = p.aspect_ratio ?? TARGET_PORTRAIT
  let score = 0
  // Textless / logo-free art posters fit a tall column best.
  if (p.iso_639_1 == null) score += 60
  if (primaryPoster && p.file_path !== primaryPoster) score += 15
  score += Math.max(0, 25 - Math.abs(aspect - TARGET_PORTRAIT) * 50)
  score += Math.min(p.vote_average ?? 0, 12)
  score += Math.min((p.width ?? 0) / 400, 12)
  return score
}

function scoreBackdrop(b: TmdbStill) {
  let score = Math.min(b.vote_average ?? 0, 12)
  score += Math.min((b.width ?? 0) / 800, 15)
  score += Math.min((b.vote_count ?? 0) / 50, 8)
  return score
}

export function pickDiaryArt(
  images: ImagesPayload,
  primaryPoster?: string | null,
): DiaryArtPick | null {
  const posters = images.posters ?? []
  if (posters.length > 0) {
    const ranked = [...posters].sort(
      (a, b) => scorePoster(b, primaryPoster) - scorePoster(a, primaryPoster),
    )
    const best = ranked[0]
    // Prefer textless or non-primary; otherwise still use best-scored poster.
    if (best?.file_path) {
      return { path: best.file_path, kind: "poster" }
    }
  }

  const backdrops = images.backdrops ?? []
  if (backdrops.length > 0) {
    const ranked = [...backdrops].sort(
      (a, b) => scoreBackdrop(b) - scoreBackdrop(a),
    )
    if (ranked[0]?.file_path) {
      return { path: ranked[0].file_path, kind: "backdrop" }
    }
  }

  if (primaryPoster) return { path: primaryPoster, kind: "poster" }
  return null
}

export function diaryArtCacheKey(mediaType: "movie" | "tv", tmdbId: number) {
  return `${mediaType}:${tmdbId}`
}

export function tmdbOriginalUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`
  return `https://image.tmdb.org/t/p/original${p}`
}

/** Prefetch & pick art — call when opening ⋯ or diary dialog. Deduped per title. */
export function prefetchDiaryArt(
  mediaType: "movie" | "tv",
  tmdbId: number,
  primaryPoster?: string | null,
): Promise<DiaryArtPick | null> {
  const key = diaryArtCacheKey(mediaType, tmdbId)
  const existing = cache.get(key)
  if (existing) return existing

  const promise = (async () => {
    try {
      const res = await fetch(
        `/api/tmdb/images?mediaType=${mediaType}&id=${tmdbId}`,
      )
      if (!res.ok) {
        return primaryPoster
          ? ({ path: primaryPoster, kind: "poster" } as DiaryArtPick)
          : null
      }
      const data = (await res.json()) as ImagesPayload
      return pickDiaryArt(data, primaryPoster)
    } catch {
      return primaryPoster
        ? ({ path: primaryPoster, kind: "poster" } as DiaryArtPick)
        : null
    }
  })()

  cache.set(key, promise)
  return promise
}

export function getCachedDiaryArt(
  mediaType: "movie" | "tv",
  tmdbId: number,
): Promise<DiaryArtPick | null> | undefined {
  return cache.get(diaryArtCacheKey(mediaType, tmdbId))
}
