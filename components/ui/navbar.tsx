"use client" 

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  isMoviesNavActive,
  isNavHrefActive,
  isSeriesNavActive,
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
  Menu,
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
import { usePathname, useRouter } from 'next/navigation'
import { useProfile } from "@/components/providers/profile-provider"
import { profileAvatarPresentation } from "@/lib/profile-media"
import { avatarDisplaySrc, remoteImageSrcLooksLikeGif } from "@/lib/next-remote-image"
import React from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"

export function Navbar() {
  const { movies, loading: moviesLoading } = useMovies()
  const featuredMovie = movies?.[0]
  const { series, loading: seriesLoading } = useSeries()
  const featuredSeries = series?.[0]
  const { profile, loading } = useProfile()
  const navAvatar = profile ? profileAvatarPresentation(profile) : null
  const supabase = useSupabaseClient()
  const router = useRouter()
  const pathname = usePathname()


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

  const navLinkHover =
    "transition-colors hover:bg-[#FF0048]/10 hover:text-[#e8486b] dark:hover:bg-[#FF0048]/14 dark:hover:text-[#ff9eb0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/25"

  const navMegaLinkAccent =
    "bg-[#FF0048]/10 text-[#e8486b] dark:bg-[#FF0048]/14 dark:text-[#ff9eb0]"

  const profileMenuItemClass = cn(
    "cursor-pointer rounded-md text-zinc-200 outline-none transition-colors",
    "focus:bg-transparent focus:text-zinc-200",
    "data-[highlighted]:bg-[#FF0048]/10 data-[highlighted]:text-[#e8486b]",
    "dark:data-[highlighted]:bg-[#FF0048]/14 dark:data-[highlighted]:text-[#ff9eb0]",
    "focus-visible:bg-[#FF0048]/10 focus-visible:text-[#e8486b]",
    "dark:focus-visible:bg-[#FF0048]/14 dark:focus-visible:text-[#ff9eb0]",
  )

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[50] w-full pt-[env(safe-area-inset-top,0px)]">
      <div
        className={cn(
          "pointer-events-auto w-full",
          "border-b border-white/[0.08]",
          "bg-zinc-950/45 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)]",
          "backdrop-blur-2xl backdrop-saturate-150",
          "supports-[backdrop-filter]:bg-zinc-950/30",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-6xl items-center gap-3 sm:gap-4",
            "py-2.5 sm:py-3",
          )}
        >
        <Link
          href="/"
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
            
          )}
        
        >
          <Image src="/claketelogov2.svg" alt="Clakete" width={44} height={44} className="h-9 w-9 sm:h-10 sm:w-10" />
        </Link>
        <nav className="hidden h-11 min-w-0 flex-1 items-center justify-between gap-2 sm:h-12 sm:gap-3 md:flex">
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
            <NavigationMenuTrigger active={isMoviesNavActive(pathname)}>
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
                  {movieNavLinks.map(({ href, title, description, Icon }, index) => {
                    const isActive = isNavHrefActive(pathname, href)
                    return (
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
                          "transition-[background-color,color,transform] duration-200 active:scale-[0.99]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF0048]/25",
                          isActive
                            ? navMegaLinkAccent
                            : "hover:bg-[#FF0048]/10 dark:hover:bg-[#FF0048]/14",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/70 text-zinc-400 transition-colors",
                            isActive
                              ? navMegaLinkAccent
                              : "group-hover:bg-[#FF0048]/10 group-hover:text-[#e8486b] dark:group-hover:bg-[#FF0048]/14 dark:group-hover:text-[#ff9eb0]",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          <span
                            className={cn(
                              "block text-sm font-semibold tracking-tight transition-colors",
                              isActive
                                ? "text-[#e8486b] dark:text-[#ff9eb0]"
                                : "text-zinc-100 group-hover:text-[#e8486b] dark:group-hover:text-[#ff9eb0]",
                            )}
                          >
                            {title}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 block text-[11px] transition-colors sm:text-xs",
                              isActive
                                ? "text-[#e8486b]/80 dark:text-[#ff9eb0]/75"
                                : "text-zinc-500 group-hover:text-[#e8486b]/80 dark:group-hover:text-[#ff9eb0]/75",
                            )}
                          >
                            {description}
                          </span>
                        </span>
                      </Link>
                    </li>
                    )
                  })}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem className="py-2  ">
            <NavigationMenuTrigger active={isSeriesNavActive(pathname)}>
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
                  {seriesNavLinks.map(({ href, title, description, Icon }, index) => {
                    const isActive = isNavHrefActive(pathname, href)
                    return (
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
                          "transition-[background-color,color,transform] duration-200 active:scale-[0.99]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF0048]/25",
                          isActive
                            ? navMegaLinkAccent
                            : "hover:bg-[#FF0048]/10 dark:hover:bg-[#FF0048]/14",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/70 text-zinc-400 transition-colors",
                            isActive
                              ? navMegaLinkAccent
                              : "group-hover:bg-[#FF0048]/10 group-hover:text-[#e8486b] dark:group-hover:bg-[#FF0048]/14 dark:group-hover:text-[#ff9eb0]",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          <span
                            className={cn(
                              "block text-sm font-semibold tracking-tight transition-colors",
                              isActive
                                ? "text-[#e8486b] dark:text-[#ff9eb0]"
                                : "text-zinc-100 group-hover:text-[#e8486b] dark:group-hover:text-[#ff9eb0]",
                            )}
                          >
                            {title}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 block text-[11px] transition-colors sm:text-xs",
                              isActive
                                ? "text-[#e8486b]/80 dark:text-[#ff9eb0]/75"
                                : "text-zinc-500 group-hover:text-[#e8486b]/80 dark:group-hover:text-[#ff9eb0]/75",
                            )}
                          >
                            {description}
                          </span>
                        </span>
                      </Link>
                    </li>
                    )
                  })}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <SearchCommand />
    </nav>

        <div className="ml-auto flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl md:hidden",
                  "border border-white/[0.08] bg-white/[0.04] text-zinc-200",
                  "ring-1 ring-inset ring-white/[0.04]",
                  "transition hover:border-[#FF0048]/25 hover:bg-[#FF0048]/10 hover:text-[#e8486b] dark:hover:bg-[#FF0048]/14 dark:hover:text-[#ff9eb0]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/50",
                )}
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[min(82dvh,44rem)] w-full rounded-t-2xl border-t border-white/[0.1] bg-zinc-950/95 text-zinc-100 backdrop-blur-xl"
            >
              <SheetHeader className="pr-8">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6">
                <nav className="flex flex-col gap-1">
                  <SheetClose asChild>
                    <Link
                      href="/"
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium",
                        isNavHrefActive(pathname, "/") ? navMegaLinkAccent : cn("text-zinc-200", navLinkHover),
                      )}
                    >
                      Home
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/lists"
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium",
                        isNavHrefActive(pathname, "/lists") ? navMegaLinkAccent : cn("text-zinc-200", navLinkHover),
                      )}
                    >
                      Lists
                    </Link>
                  </SheetClose>
                </nav>

                <div className="space-y-2">
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Movies</p>
                  <div className="flex flex-col gap-1">
                    {movieNavLinks.map(({ href, title, Icon }) => {
                      const isActive = isNavHrefActive(pathname, href)
                      return (
                      <SheetClose asChild key={href}>
                        <Link
                          href={href}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                            isActive ? navMegaLinkAccent : cn("text-zinc-200", navLinkHover),
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isActive
                                ? "text-[#e8486b] dark:text-[#ff9eb0]"
                                : "text-zinc-400 group-hover:text-[#e8486b] dark:group-hover:text-[#ff9eb0]",
                            )}
                          />
                          {title}
                        </Link>
                      </SheetClose>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Series</p>
                  <div className="flex flex-col gap-1">
                    {seriesNavLinks.map(({ href, title, Icon }) => {
                      const isActive = isNavHrefActive(pathname, href)
                      return (
                      <SheetClose asChild key={href}>
                        <Link
                          href={href}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                            isActive ? navMegaLinkAccent : cn("text-zinc-200", navLinkHover),
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isActive
                                ? "text-[#e8486b] dark:text-[#ff9eb0]"
                                : "text-zinc-400 group-hover:text-[#e8486b] dark:group-hover:text-[#ff9eb0]",
                            )}
                          />
                          {title}
                        </Link>
                      </SheetClose>
                      )
                    })}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-12",
              "border border-white/[0.08] bg-white/[0.04] text-zinc-200",
              "ring-1 ring-inset ring-white/[0.04]",
              "transition hover:border-[#FF0048]/25 hover:bg-[#FF0048]/10 hover:text-[#e8486b] dark:hover:bg-[#FF0048]/14 dark:hover:text-[#ff9eb0]",
              "outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/50",
              "data-[state=open]:border-white/[0.12] data-[state=open]:ring-1 data-[state=open]:ring-inset data-[state=open]:ring-white/[0.08]",
            )}
          >
      {!loading && (
          <>
            {navAvatar?.src && profile ? (
              <Image
                src={avatarDisplaySrc(navAvatar.src) ?? navAvatar.src}
                alt={profile.username}
                width={48}
                height={48}
                unoptimized={remoteImageSrcLooksLikeGif(avatarDisplaySrc(navAvatar.src) ?? navAvatar.src)}
                className="w-full h-full object-cover"
                style={
                  navAvatar.objectPosition
                    ? { objectPosition: navAvatar.objectPosition }
                    : undefined
                }
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
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="min-w-[10.5rem] rounded-xl border border-white/[0.08] bg-zinc-950/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
      {profile ? (
        <>
        <DropdownMenuItem asChild className={profileMenuItemClass}>
          <Link href={`/${profile.username}`}>
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={profileMenuItemClass}>
          <Link href={`/${profile.username}/films`}>
            Films
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={profileMenuItemClass}>
          <Link href={`/${profile.username}/watchlist`}>
            Watchlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={profileMenuItemClass}>
          <Link href="/lists">
            Lists
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className={profileMenuItemClass}>
          Sign Out
        </DropdownMenuItem>
      </>
        ) : (
          <>
        <DropdownMenuItem asChild className={profileMenuItemClass}>
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
        </div>
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
