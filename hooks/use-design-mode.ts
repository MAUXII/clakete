"use client"

import { useEffect, useState } from "react"
import { useProfile } from "@/components/providers/profile-provider"
import {
  parseUserHomePreferences,
  type DesignMode,
} from "@/lib/user-home-preferences"

/**
 * Returns the current user's preferred design mode ("classic" | "glass").
 * Supports preview query `?design=glass` or `?design=classic` and localStorage cache.
 * Avoids hydration mismatches by syncing client storage in useEffect.
 */
export function useDesignMode(): DesignMode {
  const { profile } = useProfile()
  const profileMode =
    parseUserHomePreferences(profile?.home_preferences ?? null).design_mode ??
    "classic"

  const [mode, setMode] = useState<DesignMode>(profileMode)

  useEffect(() => {
    try {
      const param = new URLSearchParams(window.location.search).get("design")
      if (param === "glass" || param === "classic") {
        localStorage.setItem("ck_design_mode", param)
        setMode(param)
        return
      }
      const local = localStorage.getItem("ck_design_mode")
      if (local === "glass" || local === "classic") {
        setMode(local)
        return
      }
    } catch {
      /* ignore */
    }
    setMode(profileMode)
  }, [profileMode])

  useEffect(() => {
    if (typeof document === "undefined") return
    if (mode === "glass") {
      document.documentElement.dataset.ckDesign = "glass"
    } else {
      delete document.documentElement.dataset.ckDesign
    }
  }, [mode])

  return mode
}
