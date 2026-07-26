import { filmHref, seriesHref, type MediaHrefInput } from "@/lib/media-href"
import { userProfilePath } from "@/lib/list-href"

export type UserWatchMediaType = "movie" | "tv"

/** Build diary URL when canonical English slug is already known. */
export function userWatchLogPathFromSlug(
  username: string,
  mediaType: UserWatchMediaType,
  slug: string,
  watchIndex = 0,
): string {
  const base = userProfilePath(username)
  const kind = mediaType === "tv" ? "series" : "film"
  const suffix = watchIndex > 0 ? `/${watchIndex}` : ""
  return `${base}/${kind}/${slug}${suffix}`
}

/** Letterboxd-style diary URL: 1st watch has no suffix; 2nd → `/1`, 3rd → `/2`. */
export function userWatchLogHref(
  username: string,
  mediaType: UserWatchMediaType,
  input: MediaHrefInput,
  watchIndex = 0,
): string {
  const base = userProfilePath(username)
  const mediaPath = mediaType === "tv" ? seriesHref(input) : filmHref(input)
  const suffix = watchIndex > 0 ? `/${watchIndex}` : ""
  return `${base}${mediaPath}${suffix}`
}

/** Parse `/[logIndex]` segment; returns null when invalid. Base route uses watchIndex 0. */
export function parseWatchLogIndexParam(logIndex: string | undefined): number | null {
  if (logIndex == null || logIndex === "") return 0
  if (!/^\d+$/.test(logIndex)) return null
  const n = Number(logIndex)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

export function watchLogOrdinalLabel(watchIndex: number): string | null {
  if (watchIndex <= 0) return null
  const n = watchIndex + 1
  if (n === 2) return "2nd watch"
  if (n === 3) return "3rd watch"
  return `${n}th watch`
}
