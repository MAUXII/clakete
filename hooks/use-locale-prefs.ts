"use client"

import { useCallback, useMemo } from "react"
import { useProfile } from "@/components/providers/profile-provider"
import { parseUserHomePreferences } from "@/lib/user-home-preferences"
import {
  appendTmdbLocaleParams,
  DEFAULT_TMDB_LANGUAGE,
  DEFAULT_WATCH_REGION,
  resolveTmdbLanguage,
  resolveWatchRegion,
  tmdbLocaleQueryString,
} from "@/lib/locale-prefs"

export function useLocalePrefs() {
  const { profile, loading } = useProfile()
  const prefs = parseUserHomePreferences(profile?.home_preferences ?? null)

  const watchRegion = resolveWatchRegion(prefs.watch_region ?? DEFAULT_WATCH_REGION)
  const tmdbLanguage = resolveTmdbLanguage(prefs.tmdb_language ?? DEFAULT_TMDB_LANGUAGE)

  const localeQs = useMemo(
    () => tmdbLocaleQueryString({ language: tmdbLanguage, region: watchRegion }),
    [tmdbLanguage, watchRegion],
  )

  const withLocale = useCallback(
    (params?: URLSearchParams | Record<string, string>) => {
      const next =
        params instanceof URLSearchParams
          ? new URLSearchParams(params)
          : new URLSearchParams(params ?? {})
      return appendTmdbLocaleParams(next, {
        language: tmdbLanguage,
        region: watchRegion,
      })
    },
    [tmdbLanguage, watchRegion],
  )

  return {
    loading,
    watchRegion,
    tmdbLanguage,
    localeQs,
    withLocale,
  }
}
