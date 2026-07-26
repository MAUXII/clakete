"use client"

import { useLayoutEffect, useSyncExternalStore } from "react"

let hideChromeRequests = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return hideChromeRequests > 0
}

function getServerSnapshot() {
  return false
}

function syncDomFlag() {
  if (typeof document === "undefined") return
  if (hideChromeRequests > 0) {
    document.documentElement.setAttribute("data-hide-chrome", "1")
  } else {
    document.documentElement.removeAttribute("data-hide-chrome")
  }
}

/** Screens like 404 that should hide global chrome (navbar + footer) while mounted. */
export function requestHideAppChrome() {
  hideChromeRequests += 1
  syncDomFlag()
  emit()
  return () => {
    hideChromeRequests = Math.max(0, hideChromeRequests - 1)
    syncDomFlag()
    emit()
  }
}

export function useHideAppChromeRequested() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Drop into a page/screen to hide navbar + footer while mounted. */
export function HideAppChrome() {
  useLayoutEffect(() => requestHideAppChrome(), [])
  return null
}

/** @deprecated Use HideAppChrome */
export const HideAppFooter = HideAppChrome
export const useHideAppFooterRequested = useHideAppChromeRequested
export const requestHideAppFooter = requestHideAppChrome
