'use client'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { BsLightningChargeFill } from "react-icons/bs";
import { cn } from '@/lib/utils'
import { UserRecentReviews } from "@/components/profile/recent-reviews";
import CinematicBackground from '@/components/CinematicBackground'
import { LandingSpotlight } from '@/components/landing/LandingSpotlight'
import { LandingWhyClakete } from '@/components/landing/LandingWhyClakete'
import { LandingPlansCta } from '@/components/landing/LandingPlansCta'
import { CtaCatalogGridBg } from '@/components/landing/CtaCatalogGridBg'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import type { Movie } from '@/types/movie'

interface UserProfile {
  username: string
  avatar_url: string | null
}

export default function HomePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([])
  const [spotlightMovie, setSpotlightMovie] = useState<Movie | null>(null)
  const [catalogMovieTotal, setCatalogMovieTotal] = useState<number | null>(null)
  const user = useUser()
  const supabase = useSupabaseClient()

  useEffect(() => {
    async function getProfile() {
      try {
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single()

          if (error) throw error
          setUserProfile(data)
        }
      } catch {
        // Error handling
      } finally {
        setLoading(false)
      }
    }
    getProfile()
  }, [user, supabase])

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
              <h1 className="max-w-[1280px] w-full text-3xl font-medium text-white ">
                <p className="sombra-contorno">Track films you&apos;ve watched.</p>
                <p className="sombra-contorno">Save those you want to see.</p>
                <p className="sombra-contorno">Tell your friends what&apos;s good.</p>
              </h1>
             
            </div>
          </div>
        </section>

        <LandingSpotlight movie={spotlightMovie} />

        <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2  bg-black py-16 sm:py-20">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
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
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
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
          <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col items-center text-center">
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

            <div className="relative z-10 mx-auto flex min-h-[620px] w-full max-w-[1280px] flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 md:min-h-[80svh] md:pb-24 lg:px-8">
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

  // Se houver usuário logado, mostra a página de boas-vindas
  return (
    <section className="min-h-[100vh] py-8 mt-20 px-4 w-full max-w-[1280px] flex flex-col justify-start ">
      
      <div className="flex flex-col mb-10 animate-fade-in">
        {userProfile && (
          <>


            <div className='flex flex-col gap-1'>
            <h1 className='text-[#FF0048] text-4xl font-bold'>Welcome back, <span className='text-white'>{userProfile.username}.</span></h1>
            <p className='text-muted-foreground text-md'>This homepage will become customized for you</p>
            
            </div>
            
          </>
        )}
      </div>
      <div className='flex w-full gap-12 '>
        <div className='w-full'>
        
          <UserRecentReviews limit={1} onLandingPage />
        </div>
<div className='flex max-w-96 flex-col '>
      {/* NEW ON CLAKETE */}
      <div className="w-full mb-12">
        <div className='flex w-full justify-between items-center'>
          <p className='text-muted-foreground font-medium mb-2 text-xs'>NEW ON CLAKETE</p>
          <p className='dark:text-muted flex items-center gap-2 font-medium mb-2 text-xs '>
            <BsLightningChargeFill className='text-muted' />
          YOUR ACTIVITY</p>
        </div>
        <div className='w-full h-[0.2px] dark:bg-muted bg-muted-foreground' />
        <div className="flex mt-2 gap-4 overflow-x-auto pb-2">
          {featuredMovies && featuredMovies.slice(0, 3).map((movie) => (
                 <Link
                 key={movie.id}
                 href={`/film/${movie.id}`}
                 className="group flex flex-col gap-2 transition-transform duration-300"
               >
                 <div className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <img
                     src={movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.png'}
                     alt={movie?.title || 'Movie poster'}
                     className="w-full transition-all h-full object-cover"
                   />
                 </div>
               </Link>
            ))}
        </div>
      </div>

      {/* POPULAR ON CLAKETE */}
      <div className="w-full mb-12">
        <div className='flex w-full justify-between items-center'>
          <p className='text-muted-foreground font-medium mb-2 text-xs'>UPCOMING MOVIES</p>
          <p className='dark:text-muted flex items-center gap-2 font-medium mb-2 text-xs '>
          MORE</p>
        </div>
        <div className='w-full h-[0.2px] dark:bg-muted bg-muted-foreground' />
        <div className="flex mt-2 gap-4 overflow-x-auto pb-2">
          {upcomingMovies && upcomingMovies.slice(0, 3).map((movie) => (
                 <Link
                 key={movie.id}
                 href={`/film/${movie.id}`}
                 className="group flex flex-col gap-2 transition-transform duration-300"
               >
                 <div className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <img
                     src={movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.png'}
                     alt={movie?.title || 'Movie poster'}
                     className="w-full transition-all h-full object-cover"
                   />
                 </div>
               </Link>
            ))}
        </div>
      </div>
      </div>
      </div>
    </section>
  )
}