"use client" 

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  } from "@/components/ui/navigation-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"
import { FiUser } from "react-icons/fi"
import { RiLoginBoxLine } from "react-icons/ri"
import {
  List,
  Compass,
  TrendingUp,
  Star,
  CalendarClock,
} from "lucide-react"
import { BiHomeAlt } from "react-icons/bi"
import Link from "next/link"
import Image from "next/image"
import { LuClapperboard, LuTv } from "react-icons/lu"
import { MovieCard } from "../movies/movie-card"
import { SeriesCard } from "../series/series-card"
import { useMovies } from "@/hooks/use-movies"
import { useSeries } from "@/hooks/use-series"
import { Skeleton } from "./skeleton"

import { SearchCommand } from "../movies/search-command"
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useProfile } from "@/components/providers/profile-provider"
import React from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { movies, loading: moviesLoading } = useMovies()
  const featuredMovie = movies?.[0]
  const { series, loading: seriesLoading } = useSeries()
  const featuredSeries = series?.[0]
  const { profile, loading } = useProfile()
  const supabase = useSupabaseClient()
  const router = useRouter()


  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const movieNavLinks = [
    {
      href: "/films/discover",
      title: "Discover",
      description: "Genres & filters",
      Icon: Compass,
    },
    {
      href: "/films/popular",
      title: "Popular",
      description: "Trending worldwide",
      Icon: TrendingUp,
    },
    {
      href: "/films/top-rated",
      title: "Top rated",
      description: "Critically acclaimed",
      Icon: Star,
    },
    {
      href: "/films/upcoming",
      title: "Upcoming",
      description: "Coming soon",
      Icon: CalendarClock,
    },
  ] as const

  const seriesNavLinks = [
    {
      href: "/series/discover",
      title: "Discover",
      description: "Genres & filters",
      Icon: Compass,
    },
    {
      href: "/series/popular",
      title: "Popular",
      description: "Trending worldwide",
      Icon: TrendingUp,
    },
    {
      href: "/series/top-rated",
      title: "Top rated",
      description: "Critically acclaimed",
      Icon: Star,
    },
    {
      href: "/series/upcoming",
      title: "Upcoming",
      description: "On the air",
      Icon: CalendarClock,
    },
  ] as const

  return (
    <header className="pointer-events-none w-full absolute max-w-6xl self-center left-1/2 -translate-x-1/2 inset-x-0 top-0 z-[50] flex justify-center pt-3 sm:pt-4">
      <div
        className={cn(
          "pointer-events-auto flex w-full  items-center gap-3 sm:gap-4",
          "rounded-2xl border border-white/[0.08]",
          "bg-zinc-950/45 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)]",
          "backdrop-blur-2xl backdrop-saturate-150",
          "supports-[backdrop-filter]:bg-zinc-950/30",
          "px-3 py-2.5 sm:px-4 sm:py-3  ",
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
            "border border-white/[0.08] bg-white/[0.04]",
            "ring-1 ring-inset ring-white/[0.04]",
            "transition hover:border-white/[0.12] hover:bg-white/[0.07]",
          )}
          style={{
            backgroundImage:
              "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,0,72,0.06) 100%)",
          }}
        >
          <Image src="/logopage.svg" alt="Clakete" width={44} height={44} className="h-9 w-9 sm:h-10 sm:w-10" />
        </Link>
        <nav className="flex h-11 min-w-0 flex-1 items-center justify-between gap-2 sm:h-12 sm:gap-3 sm:px-1">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                <BiHomeAlt />
                Home
              </NavigationMenuLink >
            </Link>
          </NavigationMenuItem >

          <NavigationMenuItem>
            <Link href="/lists" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                <List className="h-4 w-4" />
                Lists
              </NavigationMenuLink >
            </Link>
          </NavigationMenuItem >

          <NavigationMenuItem className="py-2  ">
            <NavigationMenuTrigger>
            <LuClapperboard />
            Movies
            </NavigationMenuTrigger >
            <NavigationMenuContent className="rounded-2xl p-4 text-zinc-50 backdrop-blur-xl md:w-[420px] lg:w-[620px]">
              <div className="grid min-h-[min(320px,42vh)] grid-cols-[minmax(9rem,12.5rem)_1fr] grid-rows-1 items-stretch gap-4">
                <NavigationMenuLink asChild>
                  <div className="flex h-full min-h-0 w-full select-none flex-col rounded-xl no-underline outline-none focus-visible:ring-2 focus-visible:ring-white/25">
                    {moviesLoading ? (
                      <Skeleton className="h-full min-h-[200px] w-full shrink-0 rounded-xl bg-zinc-900" />
                    ) : featuredMovie ? (
                      <MovieCard key={featuredMovie.id} movie={featuredMovie} variant="nav-fill" />
                    ) : null}
                  </div>
                </NavigationMenuLink>
                <ul
                  className={cn(
                    "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl",
                    "border border-white/[0.06] bg-zinc-900/40",
                  )}
                >
                  {movieNavLinks.map(({ href, title, description, Icon }, index) => (
                    <li
                      key={href}
                      className={cn(
                        "flex min-h-0 flex-1 border-b border-white/[0.05] last:border-b-0",
                        index % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent",
                      )}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "group flex h-full w-full min-h-0 items-center gap-3 px-3 py-2 sm:px-4",
                          "transition-[background-color,color,transform] duration-200 hover:bg-white/[0.06] active:scale-[0.99]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/20",
                        )}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/70 text-zinc-400 transition-colors group-hover:bg-zinc-800 group-hover:text-[#FF335F]">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          <span className="block text-sm font-semibold tracking-tight text-zinc-100 transition-colors group-hover:text-white">
                            {title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-zinc-500 transition-colors group-hover:text-zinc-400 sm:text-xs">
                            {description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem className="py-2  ">
            <NavigationMenuTrigger>
            <LuTv />
            Series
            </NavigationMenuTrigger >
            <NavigationMenuContent className="rounded-2xl p-4 text-zinc-50 backdrop-blur-xl md:w-[420px] lg:w-[620px]">
              <div className="grid min-h-[min(320px,42vh)] grid-cols-[minmax(9rem,12.5rem)_1fr] grid-rows-1 items-stretch gap-4">
                <NavigationMenuLink asChild>
                  <div className="flex h-full min-h-0 w-full select-none flex-col rounded-xl no-underline outline-none focus-visible:ring-2 focus-visible:ring-white/25">
                    {seriesLoading ? (
                      <Skeleton className="h-full min-h-[200px] w-full shrink-0 rounded-xl bg-zinc-900" />
                    ) : featuredSeries ? (
                      <SeriesCard key={featuredSeries.id} series={featuredSeries} variant="nav-fill" />
                    ) : null}
                  </div>
                </NavigationMenuLink>
                <ul
                  className={cn(
                    "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl",
                    "border border-white/[0.06] bg-zinc-900/40",
                  )}
                >
                  {seriesNavLinks.map(({ href, title, description, Icon }, index) => (
                    <li
                      key={href}
                      className={cn(
                        "flex min-h-0 flex-1 border-b border-white/[0.05] last:border-b-0",
                        index % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent",
                      )}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "group flex h-full w-full min-h-0 items-center gap-3 px-3 py-2 sm:px-4",
                          "transition-[background-color,color,transform] duration-200 hover:bg-white/[0.06] active:scale-[0.99]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/20",
                        )}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/70 text-zinc-400 transition-colors group-hover:bg-zinc-800 group-hover:text-[#FF335F]">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          <span className="block text-sm font-semibold tracking-tight text-zinc-100 transition-colors group-hover:text-white">
                            {title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-zinc-500 transition-colors group-hover:text-zinc-400 sm:text-xs">
                            {description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <SearchCommand />
    </nav>
 
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-12",
              "border border-white/[0.08] bg-white/[0.04] text-zinc-200",
              "ring-1 ring-inset ring-white/[0.04]",
              "transition hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/50",
            )}
          >
      {!loading && (
          <>
            {profile?.avatar_url ? (
              <Image 
                src={profile.avatar_url}
                alt={profile.username}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser />
            )}
          </>
        )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="min-w-[10.5rem] rounded-xl border border-white/[0.08] bg-zinc-950/95 p-1 text-zinc-100 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
      {profile ? (
        <>
        <DropdownMenuItem asChild>
          <Link href={`/${profile.username}`}>
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${profile.username}/films`}>
            Films
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${profile.username}/watchlist`}>
            Watchlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/lists">
            Lists
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          Sign Out
        </DropdownMenuItem>
      </>
        ) : (
          <>
        <DropdownMenuItem asChild>
          <Link href="/sign-in">
            <RiLoginBoxLine className="mr-2 h-4 w-4" />
            Sign In
          </Link>
        </DropdownMenuItem>
          </>
        )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none overflow-hidden space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-md font-medium leading-none">{title}</div>
          <p className="line-clamp-5 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
