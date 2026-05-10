'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Clapperboard,
  LayoutList,
  ListPlus,
  Tv,
  UserRound,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserRecentReviews } from "@/components/profile/recent-reviews";
import CinematicBackground from '@/components/CinematicBackground'
import { LandingSpotlight } from '@/components/landing/LandingSpotlight'
import { LandingWhyClakete } from '@/components/landing/LandingWhyClakete'
import { LandingPlansCta } from '@/components/landing/LandingPlansCta'
import { CtaCatalogGridBg } from '@/components/landing/CtaCatalogGridBg'
import { userProfilePath } from '@/lib/list-href'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import type { Movie } from '@/types/movie'
import type { Json } from '@/lib/supabase/database.types'
import {
  extractHomeBackdropFromPreferences,
  parseUserHomePreferences,
} from '@/lib/user-home-preferences'
import { profileHomeBackdropPresentation } from '@/lib/profile-media'
import { useProfile } from '@/components/providers/profile-provider'

interface UserProfile {
  username: string
  avatar_url: string | null
  home_preferences: Json | null
}

/** Padrão alinhado a `FilmsCatalogHeader`: eyebrow + título + descrição + ação. */
function LoggedHomeSectionHeader({
  eyebrow,
  title,
  description,
  action,
  titleId,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
  titleId?: string
}) {
  return (
    <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2
          id={titleId}
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </header>
  )
}

const loggedHomeSecondaryLink =
  'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'

/** Mesmo “letterbox” de `app/film/[id]/page.tsx` — banner full viewport width. */
const HOME_LETTERBOX_HEIGHT = 'clamp(400px, min(60vh, 680px), 780px)' as const

const homeWelcomeHintStorageKey = (username: string) =>
  `clakete_home_welcome_hint_hidden:${username.trim().toLowerCase()}`

export default function HomePage() {
  const [welcomeHintHidden, setWelcomeHintHidden] = useState(false)
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([])
  const [spotlightMovie, setSpotlightMovie] = useState<Movie | null>(null)
  const [catalogMovieTotal, setCatalogMovieTotal] = useState<number | null>(null)
  const user = useUser()
  const { profile: ctxProfile, loading: profileLoading } = useProfile()

  const userProfile = useMemo((): UserProfile | null => {
    if (!user || !ctxProfile) return null
    return {
      username: ctxProfile.username,
      avatar_url: ctxProfile.avatar_url ?? null,
      home_preferences: ctxProfile.home_preferences ?? null,
    }
  }, [user, ctxProfile])

  const loading = Boolean(user && profileLoading)

  useEffect(() => {
    if (!userProfile?.username || typeof window === 'undefined') return
    try {
      setWelcomeHintHidden(
        localStorage.getItem(homeWelcomeHintStorageKey(userProfile.username)) === '1',
      )
    } catch {
      /* ignore */
    }
  }, [userProfile?.username])

  const homePrefs = useMemo(
    () => parseUserHomePreferences(userProfile?.home_preferences ?? null),
    [userProfile?.home_preferences],
  )

  const heroBackdrop = useMemo(() => {
    if (!userProfile) return null
    const hb = extractHomeBackdropFromPreferences(userProfile.home_preferences)
    return profileHomeBackdropPresentation({
      home_backdrop_url: hb.url,
      home_backdrop_meta: hb.meta,
    })
  }, [userProfile])

  useEffect(() => {
    let cancelled = false
    async function fetchFeaturedMovie() {
      try {
        const response = await fetch('/api/movies?type=now_playing&page=1')
        const data = await response.json()
        if (cancelled) return
        if (data.results && data.results.length > 0) {
          setFeaturedMovies(data.results.slice(0, 12))
        }
      } catch (error) {
        console.error('Erro ao buscar filme em destaque:', error)
      }
    }
    fetchFeaturedMovie()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    type DiscoverMovie = Movie & {
      genre_ids?: number[]
      vote_count?: number
    }

    /** Gêneros muito associados a infantil / família (TMDB). */
    const EXCLUDE_GENRE_IDS = new Set([16, 10751]) // Animação, Família

    function passesGenreAndBackdrop(m: DiscoverMovie) {
      if (!m.backdrop_path) return false
      const ids = m.genre_ids ?? []
      if (ids.some((id) => EXCLUDE_GENRE_IDS.has(id))) return false
      return true
    }

    /**
     * Entre os filmes **em tendência** (ordem TMDB = buzz atual),
     * fica com o de **melhor nota**; empate → mais votos (mais “consolidado”).
     */
    function pickBestRatedAmongTrending(
      results: DiscoverMovie[],
      minVoteCount: number,
    ): DiscoverMovie | null {
      const pool = results.filter(
        (m) => passesGenreAndBackdrop(m) && (m.vote_count ?? 0) >= minVoteCount,
      )
      if (!pool.length) return null
      return [...pool].sort((a, b) => {
        const dAvg = (b.vote_average ?? 0) - (a.vote_average ?? 0)
        if (Math.abs(dAvg) > 1e-9) return dAvg
        return (b.vote_count ?? 0) - (a.vote_count ?? 0)
      })[0]
    }

    async function fetchSpotlight() {
      try {
        if (cancelled) return

        /** Pool “em alta”: dia (agora) + semana (mais opções), deduplicado por id. */
        const [dayRes, weekP1, weekP2] = await Promise.all([
          fetch('/api/movies?type=trending_day&page=1'),
          fetch('/api/movies?type=trending_week&page=1'),
          fetch('/api/movies?type=trending_week&page=2'),
        ])
        const [dayData, w1Data, w2Data] = await Promise.all([
          dayRes.json(),
          weekP1.json(),
          weekP2.json(),
        ])
        if (cancelled) return

        const merged: DiscoverMovie[] = []
        const seen = new Set<number>()
        const pushAll = (rows: DiscoverMovie[] | undefined) => {
          if (!rows) return
          for (const m of rows) {
            if (seen.has(m.id)) continue
            seen.add(m.id)
            merged.push(m)
          }
        }
        pushAll(dayData.results as DiscoverMovie[] | undefined)
        pushAll(w1Data.results as DiscoverMovie[] | undefined)
        pushAll(w2Data.results as DiscoverMovie[] | undefined)

        if (!merged.length) {
          if (!cancelled) setSpotlightMovie(null)
          return
        }

        /** Mínimo de votos: exige filme “real”, mas não some com estreias em alta. */
        const minVotesTiers = [400, 200, 80, 0]
        let pick: DiscoverMovie | null = null
        for (const minVotes of minVotesTiers) {
          pick = pickBestRatedAmongTrending(merged, minVotes)
          if (pick) break
        }

        if (!cancelled) setSpotlightMovie(pick)
      } catch (error) {
        console.error('Erro ao buscar destaque em alta:', error)
        if (!cancelled) setSpotlightMovie(null)
      }
    }

    fetchSpotlight()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function fetchCatalogTotal() {
      try {
        const res = await fetch('/api/movies/total')
        const data = await res.json()
        if (cancelled) return
        if (typeof data.total_movies === 'number' && Number.isFinite(data.total_movies)) {
          setCatalogMovieTotal(data.total_movies)
        }
      } catch {
        /* ignore */
      }
    }
    fetchCatalogTotal()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => { 
    async function fetchUpcomingMovies() {
      try {
        const response = await fetch('/api/movies?type=upcoming&page=1')
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          setUpcomingMovies(data.results.slice(0, 6)) 
        }
      } catch (error) {
        console.error('Erro ao buscar filmes populares:', error)
      }
    }
    fetchUpcomingMovies()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  // Se não houver usuário logado, mostra a Landing Page
  if (!user) {
    return (
      <>
        <section
          aria-label="Featured"
          className="relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 bg-black"
        >
          <div className="relative h-[calc(100dvh)] min-h-[520px] max-h-[960px] w-screen max-w-[100vw] overflow-hidden md:max-h-none">
            <CinematicBackground />
            <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black via-black/50 to-black/20" />
            <div className="pointer-events-auto  items-center absolute inset-x-0 bottom-0 z-10 flex flex-col items-end gap-5 px-4 pb-14 pt-24 text-end md:pb-20 w-full ">
              <h1 className="max-w-6xl w-full text-3xl font-medium text-white ">
                <p className="sombra-contorno">Track films you&apos;ve watched.</p>
                <p className="sombra-contorno">Save those you want to see.</p>
                <p className="sombra-contorno">Tell your friends what&apos;s good.</p>
              </h1>
             
            </div>
          </div>
        </section>

        <LandingSpotlight movie={spotlightMovie} />

        <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2  bg-black py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
                  In theaters
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Now showing
                </h2>
                <p className="mt-2 max-w-lg text-sm text-zinc-400">
                  Pick a movie and open its page - rate it, mark it as watched, or save it to your
                  watchlist.
                </p>
              </div>
              <Link
                href="/films/discover"
                className="shrink-0 text-sm font-medium text-zinc-400 transition hover:text-white"
              >
                View catalog →
              </Link>
            </div>

            <Carousel
              opts={{
                align: 'start',
                loop: false,
              }}
              className="mt-10 w-full"
            >
              <CarouselContent className="-ml-3 sm:-ml-2">
                {featuredMovies.map((movie) => (
                  <CarouselItem key={movie.id} className="basis-1/3 pl-3 sm:basis-1/6 sm:pl-2">
                    <Link href={`/film/${movie.id}`} className="group block">
                      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-lg shadow-black/40 transition group-hover:border-white/[0.14] group-hover:ring-1 group-hover:ring-white/10">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                        <img
                          src={
                            movie.poster_path
                              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                              : '/placeholder.png'
                          }
                          alt={movie.title || 'Poster'}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 z-10 h-7 w-7 border-0 bg-transparent text-white/40 opacity-60 shadow-none hover:bg-transparent hover:text-white/70 hover:opacity-100" />
              <CarouselNext className="right-2 z-10 h-7 w-7 border-0 bg-transparent text-white/40 opacity-60 shadow-none hover:bg-transparent hover:text-white/70 hover:opacity-100" />
            </Carousel>
          </div>
        </section>

        {/*
        <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 bg-zinc-950 py-16 sm:py-24">
          <div className="mx-auto w-full max-w-6xl sm:px-6 lg:px-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              Clakete deixa você…
            </p>
            <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Um diário de cinema social, simples e bonito.
            </h2>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Advantage
                icon={<FaRegHeart />}
                color="#FF5182"
                title="Clak It"
                text="Mostre carinho por filmes, listas e resenhas com um like."
              />
              <Advantage
                icon={<GrWaypoint />}
                color="#87FF50"
                title="Track It"
                text="Registre o que assistiu, quando e o que achou — seu histórico pessoal."
              />
              <Advantage
                icon={<FaRegFolderOpen />}
                color="#FFA251"
                title="List It"
                text="Crie listas por tema e compartilhe. Watchlist sempre à mão."
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <Advantage
                icon={<MdOutlineReviews />}
                color="#5188FF"
                title="Review It"
                text="Resenhas curtas ou longas: sua voz no meio da comunidade."
                className="lg:col-span-2"
              />
              <Advantage
                icon={<FaRegHeart />}
                color="#7C51FF"
                title="Rate It"
                text="Notas de 0,5 em 0,5 até 5 estrelas para registrar sua reação."
              />
            </div>
          </div>
        </section>
        */}

        <section className="relative left-1/2 flex w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden border-t border-white/[0.06] bg-[#FF0048] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            style={{
              WebkitMaskImage:
                'radial-gradient(ellipse 145% 62% at 50% 45%, #000 0%, #000 38%, rgba(0,0,0,0.45) 62%, transparent 82%)',
              maskImage:
                'radial-gradient(ellipse 35% 62% at 50% 45%, #000 0%, #000 38%, rgba(0,0,0,0.45) 62%, transparent 82%)',
              maskRepeat: 'no-repeat',
              maskSize: '100% 100%',
              maskPosition: 'center',
            }}
          >
            <div className="mx-auto flex h-full min-h-full w-full max-w-[min(100%,1400px)] justify-center">
              <CtaCatalogGridBg className="min-h-[min(100%,520px)] w-full opacity-[0.55] sm:opacity-[0.65]" />
            </div>
          </div>
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/70">
            TMDB Catalog
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              Millions of movies.{' '}
              <span className="text-white/95">A diary that is all yours.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              {catalogMovieTotal != null ? (
                <>
                  The public catalog already has{' '}
                  <span className="font-semibold tabular-nums text-white">
                    {new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(catalogMovieTotal)}
                  </span>{' '}
                  titles to discover - with Clakete, you keep track of what you watched, what you
                  want to watch, and what you thought.
                </>
              ) : (
                <>
                  A huge catalog to explore - with Clakete, you keep track of what you watched, what
                  you want to watch, and what you thought.
                </>
              )}
            </p>
            <Link
              href="/sign-in"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#FF0048] shadow-lg shadow-black/20 transition hover:bg-white/90 active:scale-[0.98]"
            >
              Create free account
            </Link>
          </div>
        </section>

        <LandingWhyClakete />

        <section
          aria-label="Your profile on Clakete"
          className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 border-b border-white/[0.05]"
        >
          <div className="relative min-h-[620px] w-full overflow-hidden bg-black md:min-h-[100svh]">
            <img
              src="/createyourownprofile.png"
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-[100%]"
            />

            <div
              className="absolute inset-0 bg-gradient-to-r from-black via-black/88 to-black/30"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_100%_50%,transparent_0%,rgba(0,0,0,0.35)_70%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black from-[0%] via-black/55 via-[22%] to-transparent to-[55%]"
              aria-hidden
            />

            <div className="relative z-10 mx-auto flex min-h-[620px] w-full max-w-6xl flex-col justify-end pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 md:min-h-[80svh] md:pb-24 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-neutral-500">
                  Profile
                </p>
                <h2 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                  Your space on Clakete
                </h2>
                <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-neutral-400 sm:text-base line-clamp-3">
                  Public profile, ratings, lists, and history - all in one place.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/sign-in"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black',
                      'transition hover:bg-neutral-200 active:scale-[0.98]',
                    )}
                  >
                    Create account
                    <ArrowUpRight className="h-4 w-4 opacity-70" aria-hidden />
                  </Link>
                  <Link
                    href="/sign-in"
                    className={cn(
                      'inline-flex items-center rounded-full border border-white/10 bg-transparent px-5 py-2.5 text-sm font-medium text-neutral-200',
                      'transition hover:border-white/20 hover:bg-white/[0.04]',
                    )}
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingPlansCta />
      </>
    )
  }

  const profileHref = userProfile?.username
    ? userProfilePath(userProfile.username)
    : '/profile/setup'
  const profileUsernameLc = userProfile?.username?.trim().toLowerCase() ?? ''

  const quickLinks = [
    { href: '/films/discover', label: 'Films', icon: Clapperboard },
    { href: '/series/discover', label: 'Series', icon: Tv },
    { href: '/lists', label: 'Lists', icon: LayoutList },
    { href: '/list/new', label: 'New list', icon: ListPlus },
    { href: profileHref, label: 'Profile', icon: UserRound },
    {
      href: profileUsernameLc ? `/${profileUsernameLc}/activity` : profileHref,
      label: 'Activity',
      icon: Zap,
    },
  ] as const

  const sectionShell = 'border-b border-border py-12 last:border-b-0'
  const showLowerBlock = homePrefs.show_recent_reviews || homePrefs.show_upcoming

  const lowerGridClass = cn(
    'grid gap-12 lg:gap-14',
    homePrefs.show_recent_reviews && homePrefs.show_upcoming
      ? 'lg:grid-cols-[1fr_minmax(0,300px)]'
      : 'grid-cols-1',
  )

  const allMainSectionsOff =
    !homePrefs.show_now_showing && !showLowerBlock

  /** Aviso “tudo off” ignora Hide antigo; quando há seções ligadas, respeita Hide. */
  const showWelcomeHint = allMainSectionsOff || !welcomeHintHidden

  const hasFilmHero = Boolean(userProfile && heroBackdrop)

  return (
    <div className="w-full overflow-x-clip pb-20">
      {hasFilmHero && heroBackdrop ? (
        <div
          className="pointer-events-none relative left-1/2 z-0 mt-[3.75rem] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#09090B]"
          style={{ height: HOME_LETTERBOX_HEIGHT }}
          aria-hidden
        >
          <img
            src={heroBackdrop.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: heroBackdrop.backgroundPosition }}
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.18)_0%,transparent_38%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/10"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(to_top,#09090B_0%,#09090B_0%,rgba(9,9,11,0.55)_32%,transparent_62%)]"
            aria-hidden
          />
          <img
            src="/noise.avif"
            alt=""
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover opacity-[0.02]"
            aria-hidden
          />
        </div>
      ) : null}

      <div
        className={cn(
          'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8',
          hasFilmHero ? 'relative z-10 -mt-[6rem] sm:-mt-[7.25rem]' : 'mt-20 pt-6',
        )}
      >
      {userProfile ? (
        <header className={cn(!hasFilmHero && 'border-b border-border', 'pb-12')}>
          <div className="pointer-events-auto space-y-3">
            <p
              className={cn(
                'text-[11px] font-semibold uppercase tracking-[0.22em]',
                hasFilmHero ? 'text-zinc-500' : 'text-muted-foreground',
              )}
            >
              Home
            </p>
            <h1
              className={cn(
                'text-3xl font-semibold tracking-tight sm:text-4xl',
                hasFilmHero ? 'text-white' : 'text-foreground',
              )}
            >
              Welcome back, {userProfile.username}
            </h1>
            <p
              className={cn(
                'max-w-2xl text-sm leading-relaxed',
                hasFilmHero ? 'text-zinc-400' : 'text-muted-foreground',
              )}
            >
              Catalog, lists, and your diary in one place.
            </p>
            {showWelcomeHint ? (
              <p
                className={cn(
                  'text-xs',
                  hasFilmHero ? 'text-zinc-500' : 'text-muted-foreground',
                )}
              >
                {allMainSectionsOff ? (
                  <>
                    Every home block is hidden.{' '}
                  </>
                ) : null}
                <Link
                  href={profileHref}
                  className={cn(
                    'underline underline-offset-2',
                    hasFilmHero ? 'hover:text-zinc-200' : 'hover:text-foreground',
                  )}
                >
                  Customize this page
                </Link>{' '}
                under Edit profile → Preferences
                {allMainSectionsOff ? (
                  <>, to bring sections back.</>
                ) : (
                  <>
                    , or just{' '}
                    <button
                      type="button"
                      className={cn(
                        'inline border-none bg-transparent p-0 underline underline-offset-2',
                        'cursor-pointer font-inherit text-[length:inherit]',
                        hasFilmHero
                          ? 'text-zinc-500 hover:text-zinc-200'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      onClick={() => {
                        if (!userProfile?.username) return
                        try {
                          localStorage.setItem(
                            homeWelcomeHintStorageKey(userProfile.username),
                            '1',
                          )
                        } catch {
                          /* ignore */
                        }
                        setWelcomeHintHidden(true)
                      }}
                    >
                      Hide
                    </button>
                    .
                  </>
                )}
              </p>
            ) : null}
          </div>
        </header>
      ) : (
        <header className="border-b border-border pb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Home
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Finish your profile for a public page and the shortcuts below.
          </p>
          <Link
            href="/profile/setup"
            className="mt-6 inline-flex rounded-md bg-[#FF0048] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e60042]"
          >
            Complete profile
          </Link>
        </header>
      )}

      <nav aria-label="Shortcuts" className={sectionShell}>
        <LoggedHomeSectionHeader
          eyebrow="Navigate"
          title="Shortcuts"
          description="Movies, TV, lists, profile, and your activity timeline."
        />
        <ul className="flex flex-wrap gap-2">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <li key={href + label}>
              <Link
                href={href}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {homePrefs.show_now_showing ? (
        <section aria-labelledby="home-now-showing" className={sectionShell}>
          <LoggedHomeSectionHeader
            eyebrow="In theaters"
            title="Now showing"
            titleId="home-now-showing"
            description="Open a film to rate, mark watched, or add to a list."
            action={
              <Link href="/films/discover" className={loggedHomeSecondaryLink}>
                Full catalog →
              </Link>
            }
          />
          <Carousel opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-3 sm:-ml-2">
              {featuredMovies.map((movie) => (
                <CarouselItem key={movie.id} className="basis-2/5 pl-3 sm:basis-1/5 sm:pl-2">
                  <Link href={`/film/${movie.id}`} className="group block">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-muted">
                      <img
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                            : '/placeholder.png'
                        }
                        alt={movie.title || 'Poster'}
                        className="h-full w-full object-cover opacity-95 transition group-hover:opacity-100"
                      />
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="h-8 w-8 border border-border bg-background text-foreground hover:bg-muted" />
            <CarouselNext className="h-8 w-8 border border-border bg-background text-foreground hover:bg-muted" />
          </Carousel>
        </section>
      ) : null}

      {showLowerBlock ? (
        <div className={cn(lowerGridClass, sectionShell)}>
          {homePrefs.show_recent_reviews ? (
            <section className="min-w-0">
              <LoggedHomeSectionHeader
                eyebrow="Diary"
                title="Recent reviews"
                description="Written notes on films you’ve logged."
              />
              <UserRecentReviews
                limit={4}
                onLandingPage={false}
                hideSectionTitle
                emptyFallback={
                  <div className="rounded-md border border-border bg-muted/30 px-5 py-8 text-center">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      No reviews yet. Open any film page to write one.
                    </p>
                    <Link
                      href="/films/discover"
                      className="mt-5 inline-flex rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      Find a film
                    </Link>
                  </div>
                }
              />
            </section>
          ) : null}

          {homePrefs.show_upcoming ? (
            <aside className={cn(!homePrefs.show_recent_reviews && 'min-w-0')}>
              <section>
                <LoggedHomeSectionHeader
                  eyebrow="Coming soon"
                  title="Upcoming"
                  description="Opens from the TMDB calendar."
                  action={
                    <Link href="/films/upcoming" className={loggedHomeSecondaryLink}>
                      See all →
                    </Link>
                  }
                />
                <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {upcomingMovies.map((movie) => (
                    <Link key={movie.id} href={`/film/${movie.id}`} className="shrink-0">
                      <div className="w-[100px] overflow-hidden rounded-md border border-border bg-muted aspect-[2/3] sm:w-[108px]">
                        <img
                          src={
                            movie.poster_path
                              ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                              : '/placeholder.png'
                          }
                          alt={movie.title || ''}
                          className="size-full object-cover"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          ) : null}
        </div>
      ) : null}
      </div>
    </div>
  )
}