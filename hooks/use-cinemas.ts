"use client"

import { useEffect, useState } from "react"
import type { CinemasByCityResponse } from "@/types/cinema"

export type UseCinemasParams = {
  /** Slug da cidade (ex.: `sao-paulo`). */
  citySlug?: string | null
  latitude?: number | null
  longitude?: number | null
  /** Quando false, não dispara fetch. Default: true se houver slug ou coords. */
  enabled?: boolean
  /** Força refresh no servidor (bypass cache). */
  refresh?: boolean
  prefer?: "ingresso" | "cinemark" | "auto"
}

export type UseCinemasResult = {
  data: CinemasByCityResponse | null
  cinemas: CinemasByCityResponse["cinemas"]
  loading: boolean
  error: string | null
  status: "idle" | "loading" | "success" | "error"
  refetch: () => void
}

function buildUrl(params: UseCinemasParams): string | null {
  const hasCoords =
    typeof params.latitude === "number" &&
    typeof params.longitude === "number" &&
    Number.isFinite(params.latitude) &&
    Number.isFinite(params.longitude)

  const slug = params.citySlug?.trim()
  if (!slug && !hasCoords) return null

  const pathSlug = slug || "near"
  const qs = new URLSearchParams()
  if (hasCoords) {
    qs.set("lat", String(params.latitude))
    qs.set("lng", String(params.longitude))
  }
  if (params.refresh) qs.set("refresh", "1")
  if (params.prefer && params.prefer !== "auto") {
    qs.set("prefer", params.prefer)
  }

  const query = qs.toString()
  return `/api/cinemas/${encodeURIComponent(pathSlug)}${query ? `?${query}` : ""}`
}

/**
 * Consome `/api/cinemas/[citySlug]` com lat/lng ou slug.
 * Segue o padrão de hooks do projeto (fetch nativo + useState).
 */
export function useCinemas(params: UseCinemasParams = {}): UseCinemasResult {
  const [data, setData] = useState<CinemasByCityResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<UseCinemasResult["status"]>("idle")
  const [tick, setTick] = useState(0)

  const url = buildUrl(params)
  const enabled =
    params.enabled ?? Boolean(params.citySlug || (params.latitude != null && params.longitude != null))

  useEffect(() => {
    if (!enabled || !url) {
      setStatus("idle")
      return
    }

    const controller = new AbortController()
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      setStatus("loading")

      try {
        const headers: HeadersInit = {}
        const secret = process.env.NEXT_PUBLIC_CINEMAS_API_SECRET
        if (secret) headers["x-clakete-cinemas-secret"] = secret

        const response = await fetch(url!, {
          signal: controller.signal,
          headers,
        })
        const json = await response.json()

        if (!response.ok) {
          throw new Error(json?.error || `Erro ${response.status}`)
        }

        if (cancelled) return
        setData(json as CinemasByCityResponse)
        setStatus("success")
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) {
          return
        }
        setData(null)
        setError(err instanceof Error ? err.message : "Falha ao carregar cinemas")
        setStatus("error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    enabled,
    url,
    tick,
    params.citySlug,
    params.latitude,
    params.longitude,
    params.refresh,
    params.prefer,
  ])

  return {
    data,
    cinemas: data?.cinemas ?? [],
    loading,
    error,
    status,
    refetch: () => setTick((value) => value + 1),
  }
}

export default useCinemas
