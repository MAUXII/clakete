import type { CinemasByCityResponse } from "@/types/cinema"
import {
  getCinemasByCitySlug as getIngressoCinemas,
  findNearestCity,
  findCityBySlug,
  IngressoApiError,
} from "@/services/ingresso"
import {
  getCinemasByCitySlug as getCinemarkCinemas,
  CinemarkScrapeError,
} from "@/services/cinemark"
import { enrichCinemasWithTmdb } from "@/lib/cinemas/enrich-tmdb"

export async function resolveCitySlug(params: {
  citySlug?: string | null
  lat?: number | null
  lng?: number | null
}): Promise<string> {
  if (params.citySlug?.trim()) {
    const slug = params.citySlug.trim().toLowerCase()
    const known = await findCityBySlug(slug).catch(() => null)
    if (known) return known.slug
    return slug
  }

  if (
    typeof params.lat === "number" &&
    typeof params.lng === "number" &&
    Number.isFinite(params.lat) &&
    Number.isFinite(params.lng)
  ) {
    const nearest = await findNearestCity(params.lat, params.lng)
    if (nearest) return nearest.slug
  }

  throw new Error(
    "Informe citySlug ou coordenadas (lat/lng) para localizar cinemas.",
  )
}

/**
 * Agrega cinemas: Ingresso primeiro; fallback Cinemark.
 * Artes (pôster/backdrop) vêm do TMDB.
 */
export async function aggregateCinemasByCity(params: {
  citySlug: string
  lat?: number | null
  lng?: number | null
  refresh?: boolean
  prefer?: "ingresso" | "cinemark" | "auto"
}): Promise<CinemasByCityResponse> {
  const origin =
    typeof params.lat === "number" && typeof params.lng === "number"
      ? { lat: params.lat, lng: params.lng }
      : undefined

  const prefer = params.prefer || "auto"
  const warnings: string[] = []

  if (prefer !== "cinemark") {
    try {
      const ingresso = await getIngressoCinemas(params.citySlug, {
        refresh: params.refresh,
        origin,
      })
      if (ingresso.cinemas.length > 0) {
        return enrichCinemasWithTmdb(ingresso)
      }
      warnings.push("Ingresso retornou lista vazia; tentando Cinemark.")
    } catch (error) {
      const message =
        error instanceof IngressoApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "erro desconhecido"
      warnings.push(`Ingresso falhou (${message}); fallback Cinemark.`)
      if (prefer === "ingresso") {
        throw error
      }
    }
  }

  try {
    const cinemark = await getCinemarkCinemas(params.citySlug, {
      refresh: params.refresh,
      origin,
    })
    const enriched = await enrichCinemasWithTmdb({
      ...cinemark,
      warnings: [...warnings, ...(cinemark.warnings || [])],
    })
    return enriched
  } catch (error) {
    if (warnings.length) {
      throw new Error(
        `Nenhuma fonte disponível. ${warnings.join(" ")} Cinemark: ${
          error instanceof CinemarkScrapeError || error instanceof Error
            ? error.message
            : "falha"
        }`,
      )
    }
    throw error
  }
}
