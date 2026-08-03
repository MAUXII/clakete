"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { ArrowLeft } from "lucide-react"
import { FaPlay } from "react-icons/fa6"
import { motion } from "framer-motion"

import type { Movie } from "@/app/film/[id]/page"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RatingStars } from "@/components/movies/star-rating"
import WatchProviders from "@/components/movies/watchproviders"
import Trailer from "@/components/movies/trailer"
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocalePrefs } from "@/hooks/use-locale-prefs"
import { useT } from "@/components/providers/i18n-provider"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { userProfilePath } from "@/lib/list-href"
import { filmHref, parseMediaParam, seriesHref } from "@/lib/media-href"
import {
  parseWatchLogIndexParam,
  userWatchLogPathFromSlug,
  watchLogOrdinalLabel,
  type UserWatchMediaType,
} from "@/lib/user-media-href"
import { fetchCanonicalMediaSlug } from "@/lib/client/canonical-media-slug"
import { formatWatchedDate } from "@/lib/watched-date"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/supabase/database.types"

type WatchLogRow = Database["public"]["Tables"]["watch_logs"]["Row"]

type ProfileUser = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

type UserWatchLogPageProps = {
  username: string
  mediaParam: string
  mediaType: UserWatchMediaType
  logIndexParam?: string
}

const LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)"
const POSTER_ALIGN_MARGIN = `max(-5rem, calc(min(92vw, 304px) * 0.75 + 8rem - ${LETTERBOX_HEIGHT}))`

async function resolveMediaId(
  mediaType: UserWatchMediaType,
  mediaParam: string,
): Promise<number | null> {
  const parsed = parseMediaParam(mediaParam)
  if (!parsed) return null
  if (parsed.kind === "id") return parsed.id

  const endpoint =
    mediaType === "tv"
      ? `/api/series/resolve?slug=${encodeURIComponent(parsed.slug)}`
      : `/api/movies/resolve?slug=${encodeURIComponent(parsed.slug)}`

  const res = await fetch(endpoint)
  if (!res.ok) return null
  const data = (await res.json()) as { id?: number }
  return data.id ?? null
}

function WatchLogPageSkeleton() {
  return (
    <motion.div layout className="min-h-screen w-full overflow-x-clip bg-background">
      <FilmsCatalogShell>
        <div
          className="pointer-events-none relative left-1/2 z-0 mt-[calc(3.75rem+var(--clakete-promo-h,0px))] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-background"
          style={{ height: LETTERBOX_HEIGHT }}
          aria-hidden
        >
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <motion.div
            layout
            className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background))_0%,hsl(var(--background)/0.55)_32%,transparent_62%)]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 flex flex-col gap-12 pt-2 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
          <aside
            className="z-20 w-full shrink-0 self-start -mt-20 sm:-mt-24 lg:mx-0 lg:max-w-[304px] lg:[margin-top:var(--poster-mt)]"
            style={{ "--poster-mt": POSTER_ALIGN_MARGIN } as CSSProperties}
          >
            <Skeleton className="mb-3 h-4 w-32" />
            <div className="flex items-end gap-4 lg:block">
              <div className="w-[44%] max-w-[210px] shrink-0 lg:w-full lg:max-w-none">
                <div className="overflow-hidden rounded-2xl border border-border bg-card lg:-mt-36">
                  <Skeleton className="aspect-[2/3] w-full rounded-none" />
                  <div className="hidden space-y-2 border-t border-border p-3 lg:block">
                    <Skeleton className="h-3 w-20" />
                    <div className="flex gap-2">
                      <Skeleton className="size-9 rounded-full" />
                      <Skeleton className="size-9 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="mt-6 flex min-w-0 flex-1 flex-col gap-10 sm:mt-8 lg:mt-8 lg:max-w-none">
            <div className="space-y-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </FilmsCatalogShell>
    </motion.div>
  )
}

export function UserWatchLogPage({
  username,
  mediaParam,
  mediaType,
  logIndexParam,
}: UserWatchLogPageProps) {
  const watchIndex = parseWatchLogIndexParam(logIndexParam)
  const supabase = useSupabaseClient<Database>()
  const sessionUser = useUser()
  const { t } = useT()
  const { tmdbLanguage, loading: localeLoading } = useLocalePrefs()

  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [canonicalSlug, setCanonicalSlug] = useState<string | null>(null)
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [media, setMedia] = useState<Movie | null>(null)
  const [watchLog, setWatchLog] = useState<WatchLogRow | null>(null)
  const [allLogs, setAllLogs] = useState<WatchLogRow[]>([])
  const [fallbackInteraction, setFallbackInteraction] = useState<{
    watched_date: string | null
    rating: number | null
    review: string | null
    rewatch_count: number
    movie_title: string | null
    poster_path: string | null
    release_date: string | null
  } | null>(null)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [posterTrailerHover, setPosterTrailerHover] = useState(false)
  const [trailerBtnFocused, setTrailerBtnFocused] = useState(false)

  const usernameLc = username.trim().toLowerCase()
  const isOwnProfile = sessionUser?.id === profileUser?.id
  const isTv = mediaType === "tv"

  useEffect(() => {
    if (watchIndex == null) {
      setMissing(true)
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setMissing(false)

      try {
        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .eq("username", usernameLc)
          .maybeSingle()

        if (userError || !userRow) {
          if (!cancelled) setMissing(true)
          return
        }

        const tmdbId = await resolveMediaId(mediaType, mediaParam)
        if (!tmdbId) {
          if (!cancelled) setMissing(true)
          return
        }

        const { data: logs, error: logsError } = await supabase
          .from("watch_logs")
          .select("*")
          .eq("user_id", userRow.id)
          .eq("tmdb_id", tmdbId)
          .eq("media_type", mediaType)
          .order("watch_index", { ascending: true })

        if (logsError) console.error(logsError)

        const { data: interaction } = await supabase
          .from("items_interactions")
          .select(
            "watched_date, rating, review, rewatch_count, movie_title, original_title, original_name, poster_path, release_date, is_watched",
          )
          .eq("user_id", userRow.id)
          .eq("tmdb_id", tmdbId)
          .eq("media_type", mediaType)
          .maybeSingle()

        const row = (logs ?? []).find((l) => l.watch_index === watchIndex) ?? null

        if (!row && !(watchIndex === 0 && interaction?.is_watched)) {
          if (!cancelled) setMissing(true)
          return
        }

        if (cancelled) return

        setProfileUser(userRow)
        setAllLogs(logs ?? [])

        if (row) {
          setWatchLog(row)
          setFallbackInteraction(null)
        } else {
          setWatchLog(null)
          setFallbackInteraction(interaction)
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) setMissing(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [supabase, usernameLc, mediaParam, mediaType, watchIndex])

  useEffect(() => {
    if (localeLoading || watchIndex == null) return

    let cancelled = false

    async function loadMedia() {
      const tmdbId = await resolveMediaId(mediaType, mediaParam)
      if (!tmdbId || cancelled) return

      const detailsEndpoint =
        mediaType === "tv"
          ? `/api/series/${tmdbId}?language=${encodeURIComponent(tmdbLanguage)}`
          : `/api/movies/${tmdbId}?language=${encodeURIComponent(tmdbLanguage)}`

      const detailsRes = await fetch(detailsEndpoint)
      if (!detailsRes.ok || cancelled) return

      const details = (await detailsRes.json()) as Movie
      if (!cancelled) setMedia(details)
    }

    void loadMedia()

    return () => {
      cancelled = true
    }
  }, [mediaParam, mediaType, tmdbLanguage, localeLoading, watchIndex])

  const hrefInput = useMemo(() => {
    if (!media) return null
    return isTv
      ? {
          id: media.id,
          original_name: (media as Movie & { original_name?: string }).original_name ?? media.original_title,
          first_air_date: media.release_date,
        }
      : {
          id: media.id,
          original_title: media.original_title,
          release_date: media.release_date,
        }
  }, [media, isTv])

  const catalogHref = isTv
    ? seriesHref(hrefInput ?? { id: 0 })
    : filmHref(hrefInput ?? { id: 0 })

  useEffect(() => {
    if (!media?.id) {
      setCanonicalSlug(null)
      return
    }

    let cancelled = false

    void fetchCanonicalMediaSlug(mediaType, media.id).then((payload) => {
      if (!cancelled) setCanonicalSlug(payload?.slug ?? null)
    })

    return () => {
      cancelled = true
    }
  }, [media?.id, mediaType])

  const displayDate = watchLog?.watched_date ?? fallbackInteraction?.watched_date ?? null
  const displayRating = watchLog?.rating ?? fallbackInteraction?.rating ?? null
  const displayReview = watchLog?.review ?? fallbackInteraction?.review ?? null

  if (!loading && missing) notFound()

  if (loading || localeLoading || !profileUser) {
    return <WatchLogPageSkeleton />
  }

  if (!media) {
    return <WatchLogPageSkeleton />
  }

  const movieCompat = media as Movie
  const displayTitle = media.title || "Untitled"
  const backdropUrl = media.backdrop_path
    ? `https://image.tmdb.org/t/p/original${media.backdrop_path}`
    : null
  const posterUrl = media.poster_path
    ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
    : "/placeholder.png"
  const youtubeTrailer = media.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  )
  const trailerPosterUiActive = posterTrailerHover || trailerBtnFocused
  const profileName = profileUser.display_name || profileUser.username
  const diaryHref = `${userProfilePath(profileUser.username)}/watched`
  const discoverHref = isTv ? "/series/discover" : "/films/discover"

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-background">
      <FilmsCatalogShell>
        <div
          className="pointer-events-none relative left-1/2 z-0 mt-[calc(3.75rem+var(--clakete-promo-h,0px))] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-background"
          style={{ height: LETTERBOX_HEIGHT }}
          aria-hidden
        >
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.06),transparent_55%)]" />
          )}
          <div
            className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0.18)_0%,transparent_38%)]"
            aria-hidden
          />
          <motion.div
            layout
            className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/10"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background))_0%,hsl(var(--background)/0.55)_32%,transparent_62%)]"
            aria-hidden
          />
          <img
            src="/noise.avif"
            alt=""
            className="pointer-events-none absolute inset-0 z-[4] h-full w-full object-cover opacity-[0.02]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 flex flex-col gap-12 pt-2 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
          <aside
            className="z-20 w-full shrink-0 self-start -mt-20 sm:-mt-24 lg:mx-0 lg:max-w-[304px] lg:[margin-top:var(--poster-mt)] lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)+12rem)]"
            style={{ "--poster-mt": POSTER_ALIGN_MARGIN } as CSSProperties}
          >
            <div className="flex flex-col gap-3">
              <Link
                href={diaryHref}
                className="pointer-events-auto inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Voltar ao diário
              </Link>

              <div className="flex items-end gap-4 lg:block">
                <div className="w-[44%] max-w-[210px] shrink-0 lg:w-full lg:max-w-none">
                  <div className="overflow-hidden rounded-2xl border border-border bg-card lg:-mt-36">
                    <Link
                      href={catalogHref}
                      className="relative block aspect-[2/3] w-full overflow-hidden bg-card"
                      onMouseEnter={() => {
                        if (youtubeTrailer) setPosterTrailerHover(true)
                      }}
                      onMouseLeave={() => setPosterTrailerHover(false)}
                    >
                      <img
                        src={posterUrl}
                        alt={displayTitle}
                        className="absolute inset-0 block h-full w-full object-cover"
                      />
                      {youtubeTrailer ? (
                        <motion.button
                          type="button"
                          aria-label={t("film.trailer")}
                          initial={false}
                          animate={{ opacity: trailerPosterUiActive ? 1 : 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          style={{ pointerEvents: trailerPosterUiActive ? "auto" : "none" }}
                          className={cn(
                            "absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/10",
                            "outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          )}
                          onClick={(e) => {
                            e.preventDefault()
                            setTrailerOpen(true)
                          }}
                          onFocus={() => setTrailerBtnFocused(true)}
                          onBlur={() => setTrailerBtnFocused(false)}
                        >
                          <motion.span
                            className={cn(
                              "pointer-events-none inline-flex origin-center items-center gap-3 rounded-full border border-border",
                              "bg-muted/50 px-1.5 py-1.5 pl-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-border",
                            )}
                            initial={false}
                            animate={
                              trailerPosterUiActive
                                ? { opacity: 1, scale: 1 }
                                : { opacity: 0, scale: 0 }
                            }
                            transition={{
                              duration: 0.4,
                              opacity: { duration: 0.4 },
                              scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
                            }}
                            whileTap={{ scale: 0.94 }}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                              <FaPlay className="ml-0.5 h-3.5 w-3.5" aria-hidden />
                            </span>
                            <span className="pr-4 text-sm font-medium tracking-tight text-foreground">
                              {t("film.trailer")}
                            </span>
                          </motion.span>
                        </motion.button>
                      ) : null}
                    </Link>
                    <Trailer
                      trailerOpen={trailerOpen}
                      setTrailerOpen={setTrailerOpen}
                      movie={movieCompat}
                    />
                    <div className="hidden border-t border-border lg:block">
                      <WatchProviders
                        movie={movieCompat}
                        hideHeading
                        omitTrailerButton
                        mediaType={isTv ? "tv" : "movie"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="mt-6 flex min-w-0 flex-1 flex-col gap-10 sm:mt-8 lg:mt-8 lg:max-w-none">
            <section aria-label="Registro de assistida">
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <Link href={userProfilePath(profileUser.username)}>
                    <Avatar className="size-11 rounded-md border border-border">
                      <AvatarImage src={avatarDisplaySrc(profileUser.avatar_url) ?? undefined} />
                      <AvatarFallback className="rounded-md text-xs">
                        {profileUser.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 space-y-2">
                    <p className="text-base leading-snug text-foreground sm:text-lg">
                      <Link
                        href={userProfilePath(profileUser.username)}
                        className="font-medium hover:text-brand"
                      >
                        {profileName}
                      </Link>{" "}
                      assistiu{" "}
                      <Link href={catalogHref} className="font-semibold hover:text-brand">
                        {displayTitle}
                      </Link>
                    </p>
                    {displayDate ? (
                      <p className="text-sm text-muted-foreground">
                        {watchLogOrdinalLabel(watchIndex ?? 0) ? (
                          <>
                            <span className="font-medium text-foreground">
                              {watchLogOrdinalLabel(watchIndex ?? 0)}
                            </span>
                            {" · "}
                          </>
                        ) : null}
                        {formatWatchedDate(displayDate)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {displayRating != null && displayRating > 0 ? (
                  <div className="flex items-center gap-3">
                    <RatingStars
                      value={displayRating}
                      starClassName="h-5 w-5"
                      className="gap-1"
                    />
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {displayRating.toFixed(1)}
                    </span>
                  </div>
                ) : null}

                {displayReview?.trim() ? (
                  <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-[0.9375rem]">
                      {displayReview}
                    </p>
                  </div>
                ) : null}

                {allLogs.length > 1 ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Todas as assistidas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allLogs.map((log) => {
                        const href =
                          canonicalSlug &&
                          userWatchLogPathFromSlug(
                            profileUser.username,
                            mediaType,
                            canonicalSlug,
                            log.watch_index,
                          )
                        if (!href) return null
                        const active = log.watch_index === watchIndex
                        return (
                          <Link
                            key={log.watch_index}
                            href={href}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition",
                              active
                                ? "border-brand/40 bg-brand/10 text-brand"
                                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {log.watch_index === 0
                              ? "1ª"
                              : watchLogOrdinalLabel(log.watch_index) ?? `#${log.watch_index + 1}`}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <motion.div layout className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <Link
                    href={catalogHref}
                    className="font-medium text-brand hover:text-brand/80"
                  >
                    Ver página {isTv ? "da série" : "do filme"}
                  </Link>
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                  <Link
                    href={discoverHref}
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    {t("film.backToCatalog")}
                  </Link>
                </motion.div>

                {isOwnProfile ? (
                  <p className="text-xs text-muted-foreground">
                    Edite nota e review na{" "}
                    <Link href={catalogHref} className="underline underline-offset-2 hover:text-foreground">
                      página do título
                    </Link>{" "}
                    ou no{" "}
                    <Link href={diaryHref} className="underline underline-offset-2 hover:text-foreground">
                      diário
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            </section>

            <div className="overflow-hidden rounded-2xl border border-border bg-muted/40 lg:hidden">
              <WatchProviders
                movie={movieCompat}
                hideHeading
                omitTrailerButton
                mediaType={isTv ? "tv" : "movie"}
              />
            </div>
          </div>
        </div>
      </FilmsCatalogShell>
    </div>
  )
}
