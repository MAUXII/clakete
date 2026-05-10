import type { TmdbStoredImageMeta } from "@/types/tmdb-stored-image"
import { parseTmdbStoredImageMeta, tmdbStoredImagePresentation } from "@/lib/tmdb-stored-image"

export type UserProfileBannerFields = {
  banner_url?: string | null
  banner_meta?: TmdbStoredImageMeta | unknown
}

export type UserProfileAvatarFields = {
  avatar_url?: string | null
  avatar_meta?: TmdbStoredImageMeta | unknown
}

function normalizeMeta(raw: unknown): TmdbStoredImageMeta | null {
  return parseTmdbStoredImageMeta(raw)
}

export function profileBannerPresentation(
  row: UserProfileBannerFields,
  legacyFallbackSrc = "/default-banner.jpg",
): { src: string; backgroundPosition: string } {
  const meta = normalizeMeta(row.banner_meta)
  const pres = tmdbStoredImagePresentation(meta)
  if (pres) {
    return { src: pres.src, backgroundPosition: pres.objectPosition }
  }
  return {
    src: row.banner_url?.trim() || legacyFallbackSrc,
    backgroundPosition: "center 20%",
  }
}

/** `src` null se não há imagem nem meta válida */
export function profileAvatarPresentation(row: UserProfileAvatarFields): {
  src: string | null
  objectPosition?: string
} {
  const meta = normalizeMeta(row.avatar_meta)
  const pres = tmdbStoredImagePresentation(meta)
  if (pres) {
    return { src: pres.src, objectPosition: pres.objectPosition }
  }
  const u = row.avatar_url?.trim()
  return u ? { src: u, objectPosition: undefined } : { src: null }
}
