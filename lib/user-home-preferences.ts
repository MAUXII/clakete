import type { Json } from "@/lib/supabase/database.types"

/**
 * Coluna `users.home_preferences` (JSON): toggles de seções + opcional
 * `home_backdrop_url` / `home_backdrop_meta` (TMDB+crop). Sem colunas extras na tabela `users`.
 */
export interface UserHomePreferences {
  show_now_showing: boolean
  show_upcoming: boolean
  show_recent_reviews: boolean
  /** TMDB genre ids chosen during onboarding (optional). */
  favorite_genre_ids?: number[]
}

export const defaultUserHomePreferences: UserHomePreferences = {
  show_now_showing: true,
  show_upcoming: true,
  show_recent_reviews: true,
}

export function parseUserHomePreferences(raw: Json | null | undefined): UserHomePreferences {
  const base = { ...defaultUserHomePreferences }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base
  const o = raw as Record<string, unknown>

  if (typeof o.show_now_showing === "boolean") base.show_now_showing = o.show_now_showing
  if (typeof o.show_upcoming === "boolean") base.show_upcoming = o.show_upcoming
  if (typeof o.show_recent_reviews === "boolean") base.show_recent_reviews = o.show_recent_reviews

  if (Array.isArray(o.favorite_genre_ids)) {
    base.favorite_genre_ids = o.favorite_genre_ids.filter(
      (id): id is number => typeof id === "number" && Number.isFinite(id),
    )
  }

  return base
}

export function serializeUserHomePreferences(prefs: UserHomePreferences): Json {
  const out: Record<string, unknown> = {
    show_now_showing: prefs.show_now_showing,
    show_upcoming: prefs.show_upcoming,
    show_recent_reviews: prefs.show_recent_reviews,
  }
  if (prefs.favorite_genre_ids?.length) {
    out.favorite_genre_ids = prefs.favorite_genre_ids
  }
  return out as Json
}

/** Merge genre picks into existing `home_preferences` JSON. */
export function setFavoriteGenresInsidePreferences(
  raw: Json | null | undefined,
  genreIds: number[],
): Json {
  const prefs = parseUserHomePreferences(raw)
  prefs.favorite_genre_ids = genreIds.length > 0 ? [...genreIds] : undefined
  const backdrop = extractHomeBackdropFromPreferences(raw)
  return setHomeBackdropInsidePreferences(serializeUserHomePreferences(prefs), backdrop)
}

export function extractHomeBackdropFromPreferences(raw: Json | null | undefined): {
  url: string | null
  meta: Json | null
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { url: null, meta: null }
  const o = raw as Record<string, unknown>
  const url =
    typeof o.home_backdrop_url === "string" && o.home_backdrop_url.trim().length > 0
      ? o.home_backdrop_url.trim()
      : null
  const metaRaw = o.home_backdrop_meta
  const meta =
    metaRaw != null && typeof metaRaw === "object" && !Array.isArray(metaRaw)
      ? (metaRaw as Json)
      : null
  return { url, meta }
}

/** Atualiza só os três toggles e mantém backdrop já salvo no JSON. */
export function serializeUserHomePreferencesKeepingBackdrop(
  raw: Json | null | undefined,
  prefs: UserHomePreferences,
): Json {
  const backdrop = extractHomeBackdropFromPreferences(raw)
  return setHomeBackdropInsidePreferences(serializeUserHomePreferences(prefs), backdrop)
}

/**
 * Grava/remove fundo da home dentro de `home_preferences`.
 * Preferência por `meta` (TMDB crop); senão URL legado; `{ url:null, meta:null }` remove ambos.
 */
export function setHomeBackdropInsidePreferences(
  raw: Json | null | undefined,
  backdrop: { url: string | null; meta: Json | null },
): Json {
  const prefs = parseUserHomePreferences(raw)
  const serialized = serializeUserHomePreferences(prefs)
  const o: Record<string, unknown> =
    serialized != null && typeof serialized === "object" && !Array.isArray(serialized)
      ? { ...(serialized as Record<string, unknown>) }
      : {}
  Reflect.deleteProperty(o, "home_backdrop_url")
  Reflect.deleteProperty(o, "home_backdrop_meta")

  const hasMeta =
    backdrop.meta != null &&
    typeof backdrop.meta === "object" &&
    !Array.isArray(backdrop.meta)
  if (hasMeta) {
    o.home_backdrop_meta = backdrop.meta
    return o as Json
  }
  const trimmed = backdrop.url?.trim()
  if (trimmed) {
    o.home_backdrop_url = trimmed
    return o as Json
  }
  return o as Json
}
