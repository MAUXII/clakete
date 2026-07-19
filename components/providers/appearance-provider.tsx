"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useTheme } from "next-themes"
import { useProfile } from "@/components/providers/profile-provider"
import {
  applyBrandTokensToDocument,
  BRAND_STORAGE_KEY,
  buildBrandTokens,
  DEFAULT_BRAND_HEX,
  normalizeHex,
  type BrandAccentTokens,
} from "@/lib/brand-accent"
import {
  isColorModePreference,
  parseUserHomePreferences,
  type ColorModePreference,
} from "@/lib/user-home-preferences"

type AppearanceContextValue = {
  accentHex: string
  tokens: BrandAccentTokens
  setAccentHex: (hex: string) => void
  resetAccent: () => void
  /** next-themes resolved theme */
  colorMode: "light" | "dark" | undefined
  setColorMode: (mode: ColorModePreference) => void
  colorModePreference: ColorModePreference | undefined
  /** After saving prefs to the profile — allow cloud sync again. */
  commitAppearanceSync: () => void
  /** Re-apply values from stored profile prefs (discard local appearance). */
  restoreFromPreferencesJson: (raw: unknown) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function readStoredAccent(): string {
  if (typeof window === "undefined") return DEFAULT_BRAND_HEX
  try {
    return normalizeHex(localStorage.getItem(BRAND_STORAGE_KEY)) ?? DEFAULT_BRAND_HEX
  } catch {
    return DEFAULT_BRAND_HEX
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { profile, loading: profileLoading } = useProfile()
  const [accentHex, setAccentHexState] = useState(DEFAULT_BRAND_HEX)
  const [hydrated, setHydrated] = useState(false)
  const syncedProfileKey = useRef<string | null>(null)
  /** Skip cloud→local sync after the user changes appearance this session. */
  const localOverrideRef = useRef(false)

  useEffect(() => {
    setAccentHexState(readStoredAccent())
    setHydrated(true)
  }, [])

  const tokens = useMemo(() => buildBrandTokens(accentHex), [accentHex])

  useEffect(() => {
    if (!hydrated) return
    applyBrandTokensToDocument(tokens)
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, tokens.hex)
    } catch {
      /* ignore */
    }
  }, [tokens, hydrated])

  // Cloud prefs win on load / refresh — unless the user already changed locally.
  useEffect(() => {
    if (!hydrated || profileLoading) return
    if (!profile) {
      syncedProfileKey.current = null
      return
    }
    if (localOverrideRef.current) return

    const raw = profile.home_preferences
    const bag =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : null
    const hasAccent = Boolean(bag && "accent_color" in bag)
    const hasMode = Boolean(bag && "color_mode" in bag)
    if (!hasAccent && !hasMode) return

    const prefs = parseUserHomePreferences(raw)
    const key = `${hasAccent ? prefs.accent_color ?? "" : ""}|${hasMode ? prefs.color_mode ?? "" : ""}`
    if (syncedProfileKey.current === key) return
    syncedProfileKey.current = key

    if (hasAccent && prefs.accent_color) {
      setAccentHexState(prefs.accent_color)
    }
    if (hasMode && prefs.color_mode) {
      setTheme(prefs.color_mode)
    }
  }, [hydrated, profileLoading, profile, setTheme])

  const setAccentHex = useCallback((hex: string) => {
    const n = normalizeHex(hex)
    if (!n) return
    localOverrideRef.current = true
    setAccentHexState(n)
  }, [])

  const resetAccent = useCallback(() => {
    localOverrideRef.current = true
    setAccentHexState(DEFAULT_BRAND_HEX)
  }, [])

  const setColorMode = useCallback(
    (mode: ColorModePreference) => {
      localOverrideRef.current = true
      setTheme(mode)
    },
    [setTheme],
  )

  const commitAppearanceSync = useCallback(() => {
    localOverrideRef.current = false
    syncedProfileKey.current = null
  }, [])

  const restoreFromPreferencesJson = useCallback(
    (raw: unknown) => {
      const prefs = parseUserHomePreferences(raw as never)
      localOverrideRef.current = false
      setAccentHexState(prefs.accent_color ?? DEFAULT_BRAND_HEX)
      setTheme(prefs.color_mode ?? "dark")
      syncedProfileKey.current = `${prefs.accent_color ?? ""}|${prefs.color_mode ?? ""}`
    },
    [setTheme],
  )

  const colorMode =
    resolvedTheme === "light" || resolvedTheme === "dark"
      ? resolvedTheme
      : undefined

  const colorModePreference: ColorModePreference | undefined = isColorModePreference(theme)
    ? theme
    : undefined

  const value = useMemo<AppearanceContextValue>(
    () => ({
      accentHex: tokens.hex,
      tokens,
      setAccentHex,
      resetAccent,
      colorMode,
      setColorMode,
      colorModePreference,
      commitAppearanceSync,
      restoreFromPreferencesJson,
    }),
    [
      tokens,
      setAccentHex,
      resetAccent,
      colorMode,
      setColorMode,
      colorModePreference,
      commitAppearanceSync,
      restoreFromPreferencesJson,
    ],
  )

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) {
    throw new Error("useAppearance must be used within AppearanceProvider")
  }
  return ctx
}
