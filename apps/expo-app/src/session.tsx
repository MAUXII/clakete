import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { type Lang, t, type Strings } from "./i18n"

type Session = {
  ready: boolean
  isAuthenticated: boolean
  isGuest: boolean
  hasCompletedOnboarding: boolean
  displayName: string
  username: string
  language: Lang
  watchRegion: string
  isShining: boolean
  strings: Strings
  signInMock: (email: string) => Promise<void>
  signUpMock: (name: string) => Promise<void>
  continueAsGuest: () => Promise<void>
  completeOnboarding: (opts: { name: string; region: string; language: Lang }) => Promise<void>
  signOut: () => Promise<void>
  setLanguage: (lang: Lang) => Promise<void>
  setShining: (value: boolean) => Promise<void>
  clearGuestToLogin: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

const KEY = "clakete.expo.session.v1"

type Stored = {
  isAuthenticated: boolean
  isGuest: boolean
  hasCompletedOnboarding: boolean
  displayName: string
  username: string
  language: Lang
  watchRegion: string
  isShining: boolean
}

const defaults: Stored = {
  isAuthenticated: false,
  isGuest: false,
  hasCompletedOnboarding: false,
  displayName: "cinefilo",
  username: "cinefilo",
  language: "pt-BR",
  watchRegion: "BR",
  isShining: false,
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Stored>(defaults)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setState({ ...defaults, ...JSON.parse(raw) })
        } catch {
          /* ignore */
        }
      }
      setReady(true)
    })
  }, [])

  const persist = useCallback(async (next: Stored) => {
    setState(next)
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
  }, [])

  const value = useMemo<Session>(() => {
    const patch = async (partial: Partial<Stored>) => {
      await persist({ ...state, ...partial })
    }

    return {
      ready,
      ...state,
      strings: t(state.language),
      signInMock: async (email) => {
        const username = email.split("@")[0] || "user"
        await persist({
          ...state,
          isAuthenticated: true,
          isGuest: false,
          hasCompletedOnboarding: true,
          username,
          displayName: username,
        })
      },
      signUpMock: async (name) => {
        const displayName = name.trim() || "cinefilo"
        await persist({
          ...state,
          isAuthenticated: true,
          isGuest: false,
          hasCompletedOnboarding: true,
          displayName,
          username: displayName.toLowerCase().replace(/\s+/g, ""),
        })
      },
      continueAsGuest: async () => {
        await persist({
          ...state,
          isGuest: true,
          isAuthenticated: false,
          hasCompletedOnboarding: true,
        })
      },
      completeOnboarding: async ({ name, region, language }) => {
        const displayName = name.trim() || "cinefilo"
        await persist({
          ...state,
          displayName,
          username: displayName.toLowerCase().replace(/\s+/g, ""),
          watchRegion: region,
          language,
          hasCompletedOnboarding: true,
          isGuest: true,
          isAuthenticated: false,
        })
      },
      signOut: async () => {
        await persist({
          ...state,
          isAuthenticated: false,
          isGuest: false,
        })
      },
      setLanguage: async (language) => patch({ language }),
      setShining: async (isShining) => patch({ isShining }),
      clearGuestToLogin: async () => {
        await persist({ ...state, isGuest: false, isAuthenticated: false })
      },
    }
  }, [persist, ready, state])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession outside provider")
  return ctx
}
