/**
 * Locale / catalog prefs (not full UI i18n yet).
 * `watch_region` → JustWatch/TMDB providers; `tmdb_language` → titles & overviews.
 * UI strings (next-intl) can plug in later via the same language id.
 */

export const DEFAULT_WATCH_REGION = "BR"
export const DEFAULT_TMDB_LANGUAGE = "pt-BR"

export const WATCH_REGION_OPTIONS = [
  { id: "BR", label: "Brasil", flagCode: "br" },
  { id: "US", label: "United States", flagCode: "us" },
  { id: "PT", label: "Portugal", flagCode: "pt" },
  { id: "MX", label: "México", flagCode: "mx" },
  { id: "AR", label: "Argentina", flagCode: "ar" },
  { id: "ES", label: "España", flagCode: "es" },
  { id: "GB", label: "United Kingdom", flagCode: "gb" },
] as const

export const TMDB_LANGUAGE_OPTIONS = [
  { id: "pt-BR", label: "Português (Brasil)", flagCode: "br" },
  { id: "en-US", label: "English", flagCode: "us" },
  { id: "es-ES", label: "Español", flagCode: "es" },
  { id: "pt-PT", label: "Português (Portugal)", flagCode: "pt" },
] as const

/** PNG pequeno — emoji de bandeira falha em vários Windows. */
export function flagImageUrl(flagCode: string, width = 40): string {
  const code = flagCode.trim().toLowerCase()
  return `https://flagcdn.com/w${width}/${code}.png`
}

export type WatchRegionId = (typeof WATCH_REGION_OPTIONS)[number]["id"]
export type TmdbLanguageId = (typeof TMDB_LANGUAGE_OPTIONS)[number]["id"]

export function isWatchRegionId(value: unknown): value is WatchRegionId {
  return (
    typeof value === "string" &&
    WATCH_REGION_OPTIONS.some((r) => r.id === value)
  )
}

export function isTmdbLanguageId(value: unknown): value is TmdbLanguageId {
  return (
    typeof value === "string" &&
    TMDB_LANGUAGE_OPTIONS.some((l) => l.id === value)
  )
}

/** Accept query params; fall back to defaults. Unknown codes still pass if TMDB-shaped. */
export function resolveTmdbLanguage(raw: string | null | undefined): string {
  if (!raw?.trim()) return DEFAULT_TMDB_LANGUAGE
  const v = raw.trim()
  if (isTmdbLanguageId(v)) return v
  // Allow passthrough like `fr-FR` from future options
  if (/^[a-z]{2}(-[A-Z]{2})?$/.test(v)) return v
  return DEFAULT_TMDB_LANGUAGE
}

export function resolveWatchRegion(raw: string | null | undefined): string {
  if (!raw?.trim()) return DEFAULT_WATCH_REGION
  const v = raw.trim().toUpperCase()
  if (isWatchRegionId(v)) return v
  if (/^[A-Z]{2}$/.test(v)) return v
  return DEFAULT_WATCH_REGION
}

export function watchRegionLabel(region: string): string {
  const hit = WATCH_REGION_OPTIONS.find((r) => r.id === region)
  return hit?.label ?? region
}

/** Query string for TMDB API routes (`language` + `region`). */
export function tmdbLocaleQueryString(opts?: {
  language?: string | null
  region?: string | null
}): string {
  const language = resolveTmdbLanguage(opts?.language)
  const region = resolveWatchRegion(opts?.region)
  return `language=${encodeURIComponent(language)}&region=${encodeURIComponent(region)}`
}

/** Mutates URLSearchParams with resolved TMDB locale. */
export function appendTmdbLocaleParams(
  params: URLSearchParams,
  opts?: { language?: string | null; region?: string | null },
): URLSearchParams {
  params.set("language", resolveTmdbLanguage(opts?.language))
  params.set("region", resolveWatchRegion(opts?.region))
  return params
}

export type TmdbRegionProviders = {
  link: string
  flatrate?: Array<{
    logo_path: string
    provider_name: string
    provider_id: number
  }>
  rent?: Array<{
    logo_path: string
    provider_name: string
    provider_id: number
  }>
  buy?: Array<{
    logo_path: string
    provider_name: string
    provider_id: number
  }>
}

/** Prefer user region, then BR, then US, then first available. */
export function pickRegionProviders(
  results: Record<string, TmdbRegionProviders> | null | undefined,
  region: string,
): TmdbRegionProviders | undefined {
  if (!results || typeof results !== "object") return undefined
  const wanted = resolveWatchRegion(region)
  if (results[wanted]) return results[wanted]
  if (wanted !== "BR" && results.BR) return results.BR
  if (wanted !== "US" && results.US) return results.US
  const first = Object.values(results)[0]
  return first
}
