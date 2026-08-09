"use client"

import { useMemo, useState } from "react"
import {
  Loader2,
  MapPin,
  Navigation,
} from "lucide-react"
import { useCinemas } from "@/hooks/use-cinemas"
import type { Cinema, CinemaMovie, CinemaSession } from "@/types/cinema"
import { pageBelowNavClass, pageContainerClass } from "@/lib/page-container"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"

type Place =
  | { kind: "geo"; lat: number; lng: number }
  | { kind: "city"; slug: string; label: string }

type MoviePick = CinemaMovie & {
  sessionCount: number
  cinemaCount: number
}

type CinemaForMovie = {
  cinema: Cinema
  sessions: CinemaSession[]
}

const QUICK_CITIES = [
  { slug: "sao-paulo", labelKey: "saoPaulo" as const },
  { slug: "rio-de-janeiro", labelKey: "rio" as const },
  { slug: "belo-horizonte", labelKey: "bh" as const },
  { slug: "curitiba", labelKey: "curitiba" as const },
  { slug: "porto-alegre", labelKey: "poa" as const },
  { slug: "brasilia", labelKey: "brasilia" as const },
] as const

function formatKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

function collectMovies(cinemas: Cinema[]): MoviePick[] {
  const map = new Map<string, MoviePick>()

  for (const cinema of cinemas) {
    for (const movie of cinema.movies) {
      const sessions = cinema.sessions.filter((s) => s.movieId === movie.id)
      if (sessions.length === 0) continue

      const existing = map.get(movie.id)
      if (existing) {
        existing.sessionCount += sessions.length
        existing.cinemaCount += 1
        if (!existing.posterUrl && movie.posterUrl) {
          existing.posterUrl = movie.posterUrl
        }
        if (!existing.backdropUrl && movie.backdropUrl) {
          existing.backdropUrl = movie.backdropUrl
        }
      } else {
        map.set(movie.id, {
          ...movie,
          sessionCount: sessions.length,
          cinemaCount: 1,
        })
      }
    }
  }

  return [...map.values()].sort((a, b) => b.sessionCount - a.sessionCount)
}

function sessionsForMovie(
  cinemas: Cinema[],
  movieId: string,
): CinemaForMovie[] {
  return cinemas
    .map((cinema) => ({
      cinema,
      sessions: cinema.sessions
        .filter((s) => s.movieId === movieId)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    }))
    .filter((row) => row.sessions.length > 0)
    .sort((a, b) => {
      const da = a.cinema.distanceKm ?? Number.POSITIVE_INFINITY
      const db = b.cinema.distanceKm ?? Number.POSITIVE_INFINITY
      return da - db
    })
}

function LocationStep({
  onPick,
  geoLoading,
  geoError,
  onGeo,
}: {
  onPick: (place: Place) => void
  geoLoading: boolean
  geoError: string | null
  onGeo: () => void
}) {
  const { t } = useT()

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-1 py-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {t("cinemas.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("cinemas.whereTitle")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("cinemas.whereSubtitle")}
      </p>

      <button
        type="button"
        onClick={onGeo}
        disabled={geoLoading}
        className={cn(
          "mt-10 flex h-12 w-full items-center justify-center gap-2 rounded-full",
          "bg-foreground text-background transition hover:opacity-90",
          "disabled:opacity-60",
        )}
      >
        {geoLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4" />
        )}
        {t("cinemas.useLocation")}
      </button>

      {geoError ? (
        <p className="mt-3 text-center text-sm text-destructive">{geoError}</p>
      ) : null}

      <div className="mt-10 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t("cinemas.orCity")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {QUICK_CITIES.map((city) => (
          <button
            key={city.slug}
            type="button"
            onClick={() =>
              onPick({
                kind: "city",
                slug: city.slug,
                label: t(`cinemas.cities.${city.labelKey}`),
              })
            }
            className={cn(
              "rounded-full border border-border px-3.5 py-2 text-sm text-foreground",
              "transition hover:border-foreground/40",
            )}
          >
            {t(`cinemas.cities.${city.labelKey}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

function MovieGrid({
  movies,
  loading,
  error,
  cityName,
  onSelect,
  onChangePlace,
  onRetry,
}: {
  movies: MoviePick[]
  loading: boolean
  error: string | null
  cityName?: string
  onSelect: (movie: MoviePick) => void
  onChangePlace: () => void
  onRetry: () => void
}) {
  const { t } = useT()

  return (
    <div className="py-8 sm:py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("cinemas.nowShowing")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {cityName || t("cinemas.title")}
          </h1>
        </div>
        <button
          type="button"
          onClick={onChangePlace}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <MapPin className="h-3.5 w-3.5" />
          {t("cinemas.changePlace")}
        </button>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : error ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            {t("cinemas.retry")}
          </button>
        </div>
      ) : movies.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          {t("cinemas.emptyMovies")}
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((movie) => (
            <li key={movie.id}>
              <button
                type="button"
                onClick={() => onSelect(movie)}
                className="group w-full text-left"
              >
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted">
                  {movie.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={movie.posterUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                      {movie.title}
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">
                  {movie.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("cinemas.movieMeta", {
                    cinemas: String(movie.cinemaCount),
                    sessions: String(movie.sessionCount),
                  })}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const CINEMAS_POSTER_STICKY_TOP =
  "lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)_+_4.5rem_+_var(--clakete-promo-h,0px)_+_1.5rem)]"

function SessionTimeChip({
  time,
  types,
  href,
}: {
  time: string
  types: string[]
  href?: string | null
}) {
  const className = cn(
    "inline-flex min-h-11 min-w-[4.5rem] flex-col items-center justify-center rounded-lg px-3 py-2",
    "bg-muted/35 text-center transition hover:bg-muted/55",
  )
  const body = (
    <>
      <span className="text-[15px] font-semibold tabular-nums tracking-tight">
        {time}
      </span>
      {types.length > 0 ? (
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {types.slice(0, 2).join(" · ")}
        </span>
      ) : null}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {body}
      </a>
    )
  }

  return <span className={className}>{body}</span>
}

function CinemaSessionRow({
  cinema,
  sessions,
}: {
  cinema: Cinema
  sessions: CinemaSession[]
}) {
  const { t } = useT()
  const distance = formatKm(cinema.distanceKm)
  const placeLine =
    [cinema.neighborhood, cinema.address].filter(Boolean).join(" · ") ||
    t("cinemas.noAddress")

  return (
    <li>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="min-w-0 text-base font-medium tracking-tight">
          {cinema.name}
        </h2>
        {distance ? (
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {distance}
          </span>
        ) : null}
      </div>
      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground/80">
        {placeLine}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {sessions.map((session) => (
          <SessionTimeChip
            key={session.id}
            time={session.timeLabel}
            types={session.types}
            href={session.siteUrl}
          />
        ))}
      </div>
    </li>
  )
}

function SessionsStep({
  movie,
  rows,
  onBack,
}: {
  movie: MoviePick
  rows: CinemaForMovie[]
  onBack: () => void
}) {
  const { t } = useT()

  return (
    <div
      className={cn(
        pageContainerClass,
        "flex flex-col gap-10 pt-6 lg:flex-row lg:items-start lg:gap-10 lg:pt-9 xl:gap-12",
      )}
    >
      <aside
        className={cn(
          "z-20 w-full shrink-0 self-start lg:max-w-[304px]",
          CINEMAS_POSTER_STICKY_TOP,
        )}
      >
        <div className="flex items-end gap-4 lg:block">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("cinemas.backToMovies")}
            className="w-[44%] max-w-[210px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card transition hover:opacity-95 lg:w-full lg:max-w-none"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-card">
              {movie.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={movie.posterUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
            </div>
          </button>

          <div className="min-w-0 flex-1 space-y-2 pb-1 lg:hidden">
            <h1 className="text-balance text-2xl font-semibold tracking-tight">
              {movie.title}
            </h1>
            {rows.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("cinemas.nearCount", { count: String(rows.length) })}
              </p>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="mb-8 hidden lg:block">
          <h1 className="text-balance text-3xl font-semibold leading-none tracking-tight sm:text-4xl">
            {movie.title}
          </h1>
          {rows.length > 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("cinemas.nearCount", { count: String(rows.length) })}
            </p>
          ) : null}
        </header>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("cinemas.noSessions")}
          </p>
        ) : (
          <ul className="space-y-10">
            {rows.map(({ cinema, sessions }) => (
              <CinemaSessionRow
                key={cinema.id}
                cinema={cinema}
                sessions={sessions}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function CinemasNearby() {
  const { t } = useT()
  const [place, setPlace] = useState<Place | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<MoviePick | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const { data, cinemas, loading, error, refetch } = useCinemas({
    citySlug: place?.kind === "city" ? place.slug : null,
    latitude: place?.kind === "geo" ? place.lat : null,
    longitude: place?.kind === "geo" ? place.lng : null,
    enabled: Boolean(place),
  })

  const movies = useMemo(() => collectMovies(cinemas), [cinemas])

  const sessionRows = useMemo(() => {
    if (!selectedMovie) return []
    return sessionsForMovie(cinemas, selectedMovie.id)
  }, [cinemas, selectedMovie])

  function requestGeo() {
    if (!navigator.geolocation) {
      setGeoError(t("cinemas.geoUnsupported"))
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPlace({
          kind: "geo",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setSelectedMovie(null)
        setGeoLoading(false)
      },
      () => {
        setGeoError(t("cinemas.geoDenied"))
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }

  return (
    <div className={cn(pageBelowNavClass, "pb-20")}>
      {!place ? (
        <div className={pageContainerClass}>
          <LocationStep
            onPick={(next) => {
              setPlace(next)
              setSelectedMovie(null)
            }}
            geoLoading={geoLoading}
            geoError={geoError}
            onGeo={requestGeo}
          />
        </div>
      ) : selectedMovie ? (
        <SessionsStep
          movie={selectedMovie}
          rows={sessionRows}
          onBack={() => setSelectedMovie(null)}
        />
      ) : (
        <div className={pageContainerClass}>
          <MovieGrid
            movies={movies}
            loading={loading}
            error={error}
            cityName={data?.city?.name}
            onSelect={setSelectedMovie}
            onChangePlace={() => {
              setPlace(null)
              setSelectedMovie(null)
            }}
            onRetry={refetch}
          />
        </div>
      )}
    </div>
  )
}
