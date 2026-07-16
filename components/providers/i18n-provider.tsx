"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import { useLocalePrefs } from "@/hooks/use-locale-prefs"
import {
  DEFAULT_UI_LOCALE,
  getMessages,
  resolveUiLocale,
  translate,
  type AppMessages,
  type UiLocale,
} from "@/lib/i18n"

type I18nContextValue = {
  locale: UiLocale
  messages: AppMessages
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_UI_LOCALE,
  messages: getMessages(DEFAULT_UI_LOCALE),
  t: (key, vars) => translate(DEFAULT_UI_LOCALE, key, vars),
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const { tmdbLanguage, loading } = useLocalePrefs()
  const locale = resolveUiLocale(loading ? DEFAULT_UI_LOCALE : tmdbLanguage)
  const messages = useMemo(() => getMessages(locale), [locale])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  )

  useEffect(() => {
    if (typeof document === "undefined") return
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(
    () => ({ locale, messages, t }),
    [locale, messages, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

/** Shortcut: `const { t, locale } = useT()` */
export function useT() {
  return useI18n()
}
