"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useCinemas } from "@/hooks/use-cinemas"
import type { Cinema, CinemaSession } from "@/types/cinema"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"

const PLACE_KEY = "clakete-cinemas-city"

type Place =
  | { kind: "geo"; lat: number; lng: number }
  | { kind: "city"; slug: string }

function normalizeTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function formatKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

function sessionsForTmdbMovie(
  cinemas: Cinema[],
  tmdbId: number,
  title: string,
  originalTitle?: string | null,
): Array<{ cinema: Cinema; sessions: CinemaSession[] }> {
  const titleN = normalizeTitle(title)
  const originalN = originalTitle ? normalizeTitle(originalTitle) : ""

  const matchedIds = new Set<string>()
  for (const cinema of cinemas) {
    for (const movie of cinema.movies) {
      if (movie.tmdbId === tmdbId) {
        matchedIds.add(movie.id)
        continue
      }
      const mTitle = normalizeTitle(movie.title)
      const mOriginal = movie.originalTitle
        ? normalizeTitle(movie.originalTitle)
        : ""
      if (
        mTitle === titleN ||
        (originalN && mTitle === originalN) ||
        (mOriginal && mOriginal === titleN) ||
        (originalN && mOriginal && mOriginal === originalN)
      ) {
        matchedIds.add(movie.id)
      }
    }
  }

  if (matchedIds.size === 0) return []

  return cinemas
    .map((cinema) => ({
      cinema,
      sessions: cinema.sessions
        .filter((s) => matchedIds.has(s.movieId))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    }))
    .filter((row) => row.sessions.length > 0)
    .sort((a, b) => {
      const da = a.cinema.distanceKm ?? Number.POSITIVE_INFINITY
      const db = b.cinema.distanceKm ?? Number.POSITIVE_INFINITY
      return da - db
    })
}

export function FilmNearbyCinemas({
  tmdbId,
  title,
  originalTitle,
  className,
}: {
  tmdbId: number
  title: string
  originalTitle?: string | null
  className?: string
}) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState<Place | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PLACE_KEY)?.trim()
      if (saved) {
        setPlace({ kind: "city", slug: saved })
        return
      }
    } catch {
      // ignore
    }
    setPlace({ kind: "city", slug: "sao-paulo" })
  }, [])

  const { cinemas, loading, error } = useCinemas({
    citySlug: place?.kind === "city" ? place.slug : null,
    latitude: place?.kind === "geo" ? place.lat : null,
    longitude: place?.kind === "geo" ? place.lng : null,
    enabled: Boolean(place),
  })

  const rows = useMemo(
    () => sessionsForTmdbMovie(cinemas, tmdbId, title, originalTitle),
    [cinemas, tmdbId, title, originalTitle],
  )

  const showCta = !loading && !error && rows.length > 0

  function useGeo() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPlace({
          kind: "geo",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {
        // keep current place
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  if (!showCta && !open) return null

  return (
    <div className={cn(className)}>
      {showCta ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "w-full text-left text-sm text-muted-foreground transition",
            "hover:text-foreground",
          )}
        >
          {t("film.nearbyCinemasCta")}
          <span className="ml-1 tabular-nums text-muted-foreground/70">
            · {rows.length}
          </span>
        </button>
      ) : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            "flex h-[min(85dvh,40rem)] flex-col gap-0 p-0",
            "inset-x-0 mx-auto w-full max-w-6xl",
            "rounded-t-2xl border-x border-t",
            "[&>button]:hidden",
          )}
        >
          <SheetHeader className="space-y-1 px-6 pb-5 pt-6 text-left">
            <SheetTitle className="text-[13px] font-medium tracking-[0.04em] text-muted-foreground">
              {t("film.nearbyCinemasTitle")}
            </SheetTitle>
            <p className="text-lg font-semibold tracking-tight text-foreground line-clamp-1">
              {title}
            </p>
            <div className="flex items-center gap-4 pt-1">
              <button
                type="button"
                onClick={useGeo}
                className="text-[13px] text-muted-foreground transition hover:text-foreground"
              >
                {t("cinemas.useLocation")}
              </button>
              <Link
                href="/cinemas"
                className="text-[13px] text-muted-foreground transition hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {t("film.nearbyCinemasExplore")}
              </Link>
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
            {loading ? (
              <div className="flex justify-center py-16 text-muted-foreground/60">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <p className="py-12 text-[13px] text-muted-foreground">
                {t("cinemas.noSessions")}
              </p>
            ) : (
              <ul className="divide-y divide-border/50">
                {rows.map(({ cinema, sessions }) => {
                  const distance = formatKm(cinema.distanceKm)
                  const placeLine = [cinema.neighborhood, cinema.address]
                    .filter(Boolean)
                    .join(" · ")

                  return (
                    <li key={cinema.id} className="py-5 first:pt-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="min-w-0 text-[15px] font-medium tracking-tight text-foreground">
                          {cinema.name}
                        </h3>
                        {distance ? (
                          <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
                            {distance}
                          </span>
                        ) : null}
                      </div>
                      {placeLine ? (
                        <p className="mt-1 line-clamp-1 text-[13px] leading-snug text-muted-foreground">
                          {placeLine}
                        </p>
                      ) : null}
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {sessions.map((session) => {
                          const types = session.types.slice(0, 2).join(" · ")
                          const className = cn(
                            "inline-flex min-h-9 min-w-[3.75rem] flex-col items-center justify-center gap-0.5",
                            "rounded-md border border-border/70 px-2.5 py-1.5",
                            "transition hover:border-border hover:bg-muted/30",
                          )

                          const node = (
                            <>
                              <span className="text-sm tabular-nums tracking-tight text-foreground">
                                {session.timeLabel}
                              </span>
                              {types ? (
                                <span className="text-[10px] tracking-wide text-muted-foreground">
                                  {types}
                                </span>
                              ) : null}
                            </>
                          )

                          if (session.siteUrl) {
                            return (
                              <a
                                key={session.id}
                                href={session.siteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={className}
                              >
                                {node}
                              </a>
                            )
                          }

                          return (
                            <span key={session.id} className={className}>
                              {node}
                            </span>
                          )
                        })}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
