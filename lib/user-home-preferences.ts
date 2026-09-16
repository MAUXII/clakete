import type { Json } from "@/lib/supabase/database.types"
import { hasShiningAccess, isProfileThemeId, type PlanFields, type ProfileThemeId } from "@/lib/plans"
import {
  DEFAULT_TMDB_LANGUAGE,
  DEFAULT_WATCH_REGION,
  isTmdbLanguageId,
  isWatchRegionId,
  type TmdbLanguageId,
  type WatchRegionId,
} from "@/lib/locale-prefs"
import { DEFAULT_BRAND_HEX, normalizeHex } from "@/lib/brand-accent"
import {
  DEFAULT_ATMOSPHERE_MODE,
  DEFAULT_ATMOSPHERE_SOURCE,
  DEFAULT_GLASS_BANNER_LAYOUT,
  isAtmosphereMode,
  isAtmosphereSource,
  isGlassBannerLayout,
  type AtmosphereMode,
  type AtmosphereSource,
  type GlassBannerLayout,
} from "@/lib/atmosphere"

export type ColorModePreference = "light" | "dark" | "system"

export function isColorModePreference(v: unknown): v is ColorModePreference {
  return v === "light" || v === "dark" || v === "system"
}

/** App chrome / profile shell visual system. */
export type DesignMode = "classic" | "glass"

export function isDesignMode(v: unknown): v is DesignMode {
  return v === "classic" || v === "glass"
}

/**
 * Coluna `users.home_preferences` (JSON): toggles de seções + opcional
 * `home_backdrop_url` / `home_backdrop_meta` (TMDB+crop). Sem colunas extras na tabela `users`.
 */
export interface UserHomePreferences {
  show_now_showing: boolean
  show_upcoming: boolean
  show_recent_reviews: boolean
  /** Activity from people you follow (reviews, watches, lists). */
  show_following_feed: boolean
  /** TMDB genre ids chosen during onboarding (optional). */
  favorite_genre_ids?: number[]
  /** Profile visual theme — Shining perk (ignored for free unless default). */
  profile_theme?: ProfileThemeId
  /** ISO country for JustWatch / TMDB watch providers (default BR). */
  watch_region?: WatchRegionId
  /** TMDB API `language` for titles & overviews (default pt-BR). */
  tmdb_language?: TmdbLanguageId
  /** App-wide accent (Discord-style). Synced via home_preferences JSON. */
  accent_color?: string
  /** App light/dark preference (next-themes). */
  color_mode?: ColorModePreference
  /** Classic (legacy) vs Glass (Leitour-inspired) chrome. */
  design_mode?: DesignMode
  /**
   * Shining: show profile banner strip.
   * Default true when omitted (opt-out).
   */
  show_profile_banner?: boolean
  /**
   * Shining: show REDRUM badge on profile/feed.
   * Default true when omitted (opt-out).
   */
  show_redrum_badge?: boolean
  /**
   * Viewer: Glass hub atmosphere intensity (all profiles you view).
   * Default vivid when omitted.
   */
  atmosphere_mode?: AtmosphereMode
  /**
   * Viewer: seed image for atmosphere — banner or avatar.
   * Default banner when omitted.
   */
  atmosphere_source?: AtmosphereSource
  /**
   * Viewer: Glass profile banner layout — contained (current) or full-bleed.
   * Default contained when omitted.
   */
  glass_banner_layout?: GlassBannerLayout
}

export const defaultUserHomePreferences: UserHomePreferences = {
  show_now_showing: true,
  show_upcoming: true,
  show_recent_reviews: true,
  show_following_feed: true,
  profile_theme: "default",
  watch_region: DEFAULT_WATCH_REGION,
  tmdb_language: DEFAULT_TMDB_LANGUAGE,
  accent_color: DEFAULT_BRAND_HEX,
  color_mode: "dark",
  design_mode: "classic",
  show_profile_banner: true,
  show_redrum_badge: true,
  atmosphere_mode: DEFAULT_ATMOSPHERE_MODE,
  atmosphere_source: DEFAULT_ATMOSPHERE_SOURCE,
  glass_banner_layout: DEFAULT_GLASS_BANNER_LAYOUT,
}

export function parseUserHomePreferences(raw: Json | null | undefined): UserHomePreferences {
  const base = { ...defaultUserHomePreferences }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base
  const o = raw as Record<string, unknown>

  if (typeof o.show_now_showing === "boolean") base.show_now_showing = o.show_now_showing
  if (typeof o.show_upcoming === "boolean") base.show_upcoming = o.show_upcoming
  if (typeof o.show_recent_reviews === "boolean") base.show_recent_reviews = o.show_recent_reviews
  if (typeof o.show_following_feed === "boolean") base.show_following_feed = o.show_following_feed

  if (Array.isArray(o.favorite_genre_ids)) {
    base.favorite_genre_ids = o.favorite_genre_ids.filter(
      (id): id is number => typeof id === "number" && Number.isFinite(id),
    )
  }

  if (isProfileThemeId(o.profile_theme)) {
    base.profile_theme = o.profile_theme
  }

  if (isWatchRegionId(o.watch_region)) {
    base.watch_region = o.watch_region
  }

  if (isTmdbLanguageId(o.tmdb_language)) {
    base.tmdb_language = o.tmdb_language
  }

  const accent = normalizeHex(typeof o.accent_color === "string" ? o.accent_color : null)
  if (accent) base.accent_color = accent

  if (isColorModePreference(o.color_mode)) {
    base.color_mode = o.color_mode
  }

  if (isDesignMode(o.design_mode)) {
    base.design_mode = o.design_mode
  }

  if (typeof o.show_profile_banner === "boolean") {
    base.show_profile_banner = o.show_profile_banner
  }

  if (typeof o.show_redrum_badge === "boolean") {
    base.show_redrum_badge = o.show_redrum_badge
  }

  if (isAtmosphereMode(o.atmosphere_mode)) {
    base.atmosphere_mode = o.atmosphere_mode
  }

  if (isAtmosphereSource(o.atmosphere_source)) {
    base.atmosphere_source = o.atmosphere_source
  }

  if (isGlassBannerLayout(o.glass_banner_layout)) {
    base.glass_banner_layout = o.glass_banner_layout
  }

  return base
}

export function serializeUserHomePreferences(prefs: UserHomePreferences): Json {
  const accent =
    normalizeHex(prefs.accent_color) ?? DEFAULT_BRAND_HEX
  const out: Record<string, unknown> = {
    show_now_showing: prefs.show_now_showing,
    show_upcoming: prefs.show_upcoming,
    show_recent_reviews: prefs.show_recent_reviews,
    show_following_feed: prefs.show_following_feed,
    watch_region: prefs.watch_region ?? DEFAULT_WATCH_REGION,
    tmdb_language: prefs.tmdb_language ?? DEFAULT_TMDB_LANGUAGE,
    accent_color: accent,
    color_mode: prefs.color_mode ?? "dark",
    design_mode: prefs.design_mode ?? "classic",
    atmosphere_mode: prefs.atmosphere_mode ?? DEFAULT_ATMOSPHERE_MODE,
    atmosphere_source: prefs.atmosphere_source ?? DEFAULT_ATMOSPHERE_SOURCE,
    glass_banner_layout: prefs.glass_banner_layout ?? DEFAULT_GLASS_BANNER_LAYOUT,
  }
  if (prefs.favorite_genre_ids?.length) {
    out.favorite_genre_ids = prefs.favorite_genre_ids
  }
  if (prefs.profile_theme && prefs.profile_theme !== "default") {
    out.profile_theme = prefs.profile_theme
  }
  // Opt-out: omit when true (default on); persist false when user disables.
  if (prefs.show_profile_banner === false) {
    out.show_profile_banner = false
  }
  if (prefs.show_redrum_badge === false) {
    out.show_redrum_badge = false
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

/** Merge watch region + TMDB language into existing `home_preferences` JSON. */
export function setLocaleInsidePreferences(
  raw: Json | null | undefined,
  locale: { watch_region?: WatchRegionId; tmdb_language?: TmdbLanguageId },
): Json {
  const prefs = parseUserHomePreferences(raw)
  if (locale.watch_region) prefs.watch_region = locale.watch_region
  if (locale.tmdb_language) prefs.tmdb_language = locale.tmdb_language
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

/** REDRUM badge: Shining access + owner did not opt out (`show_redrum_badge !== false`). */
export function shouldShowRedrumBadge(
  planFields: PlanFields,
  homePreferences?: Json | null,
): boolean {
  if (!hasShiningAccess(planFields)) return false
  return parseUserHomePreferences(homePreferences).show_redrum_badge !== false
}
