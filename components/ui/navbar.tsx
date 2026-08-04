"use client" 

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  isGamesNavActive,
  isMoviesNavActive,
  isNavHrefActive,
  isSeriesNavActive,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  List,
  Compass,
  TrendingUp,
  Star,
  CalendarClock,
  Menu,
  Gamepad2,
  Sparkles,
  Image as ImageIcon,
  ArrowUpDown,
  Quote,
} from "lucide-react"
import { BiHomeAlt } from "react-icons/bi"
import Link from "next/link"
import { LuClapperboard, LuTv } from "react-icons/lu"
import { MovieCard } from "../movies/movie-card"
import { SeriesCard } from "../series/series-card"
import { GamesNavFeature } from "@/components/games/games-nav-feature"
import { useMovies } from "@/hooks/use-movies"
import { useSeries } from "@/hooks/use-series"
import { Skeleton } from "./skeleton"
import { ClaketeLogo } from "./clakete-logo"
import { ProfileNavMenu } from "./profile-nav-menu"

import { SearchCommand } from "../movies/search-command"
import { usePathname } from 'next/navigation'
import { useProfile } from "@/components/providers/profile-provider"
import { PromoTopBanner } from "@/components/promo/promo-top-banner"
import {
  SHINING_MONTHLY_PRICE_LABEL,
  SHINING_PRODUCT_NAME,
} from "@/lib/plans"
import React from "react"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"
import { pageContainerClass } from "@/lib/page-container"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"

export function Navbar() {
  const { t } = useT()
  const { movies, loading: moviesLoading } = useMovies()
  const featuredMovie = movies?.[0]
  const { series, loading: seriesLoading } = useSeries()
  const featuredSeries = series?.[0]
  const { profile } = useProfile()
  const pathname = usePathname()

  const movieNavLinks = [
    {
      href: "/films/discover",
      title: t("nav.discover"),
      description: t("nav.discoverDesc"),
      Icon: Compass,
    },
    {
      href: "/films/popular",
      title: t("nav.popular"),
      description: t("nav.popularDesc"),
      Icon: TrendingUp,
    },
    {
      href: "/films/top-rated",
      title: t("nav.topRated"),
      description: t("nav.topRatedDesc"),
      Icon: Star,
    },
    {
      href: "/films/upcoming",
      title: t("nav.upcoming"),
      description: t("nav.upcomingDesc"),
      Icon: CalendarClock,
    },
  ] as const

  const seriesNavLinks = [
    {
      href: "/series/discover",
      title: t("nav.discover"),
      description: t("nav.discoverDesc"),
      Icon: Compass,
    },
    {
      href: "/series/popular",
      title: t("nav.popular"),
      description: t("nav.popularDesc"),
      Icon: TrendingUp,
    },
    {
      href: "/series/top-rated",
      title: t("nav.topRated"),
      description: t("nav.topRatedDesc"),
      Icon: Star,
    },
    {
      href: "/series/upcoming",
      title: t("nav.upcomingSeries"),
      description: t("nav.upcomingSeriesDesc"),
      Icon: CalendarClock,
    },
  ] as const

  const gameNavLinks = [
    {
      href: "/games/connect-the-stars",
      title: t("games.connectTitle"),
      description: t("games.connectDesc"),
      Icon: Sparkles,
      comingSoon: false,
    },
    {
      href: undefined,
      title: t("games.frameTitle"),
      description: t("games.frameDesc"),
      Icon: ImageIcon,
      comingSoon: true,
    },
    {
      href: undefined,
      title: t("games.higherTitle"),
      description: t("games.higherDesc"),
      Icon: ArrowUpDown,
      comingSoon: true,
    },
    {
      href: undefined,
      title: t("games.quoteTitle"),
      description: t("games.quoteDesc"),
      Icon: Quote,
      comingSoon: true,
    },
  ] as const

  const navLinkHover =
    "transition-colors hover:bg-brand/10 hover:text-brand-muted dark:hover:bg-brand/14 dark:hover:text-brand-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25"

  const navMegaLinkAccent =
    "bg-brand/10 text-brand-muted dark:bg-brand/14 dark:text-brand-light"

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[50] w-full pt-[env(safe-area-inset-top,0px)]">
      <div
        className={cn(
          "pointer-events-auto w-full",
          "border-b border-border",
          "bg-background/80 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)]",
          "backdrop-blur-2xl backdrop-saturate-150",
          "supports-[backdrop-filter]:bg-background/70",
        )}
      >
        <div
          className={cn(
            pageContainerClass,
            "flex items-center gap-3 sm:gap-4",
            "py-2.5 sm:py-3",
          )}
        >
        <Link
          href="/"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
        >
          <ClaketeLogo className="h-9 w-9 sm:h-10 sm:w-10" />
        </Link>
        <nav className="hidden h-11 min-w-0 flex-1 items-center justify-between gap-2 sm:h-12 sm:gap-3 md:flex">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                <BiHomeAlt />
                {t("nav.home")}
              </NavigationMenuLink >
            </Link>
          </NavigationMenuItem >

          <NavigationMenuItem>
            <Link href="/lists" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                <List className="h-4 w-4" />
                {t("nav.lists")}
              </NavigationMenuLink >
            </Link>
          </NavigationMenuItem >

          <NavigationMenuItem className="py-2">
            <NavigationMenuTrigger active={isGamesNavActive(pathname)}>
              <Gamepad2 className="h-4 w-4" />
              {t("nav.games")}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="rounded-2xl p-4 text-foreground backdrop-blur-xl md:w-[420px] lg:w-[620px]">
              <div className="grid h-[320px] grid-cols-[minmax(9rem,12.5rem)_1fr] grid-rows-1 items-stretch gap-4">
                <div className="relative h-full w-full self-stretch overflow-hidden rounded-xl">
                  <GamesNavFeature />
                </div>
                <ul
                  className={cn(
                    "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl",
                    "border border-border/80 bg-background/60 dark:bg-background/40",
                  )}
                >
                  {gameNavLinks.map(
                    ({ href, title, description, Icon, comingSoon }, index) => {
                      const isActive =
                        href != null && isNavHrefActive(pathname, href)
                      const rowClass = cn(
                        "group flex h-full w-full min-h-0 items-center gap-3 px-3 py-2 sm:px-4",
                        "transition-[background-color,color,transform] duration-200",
                        comingSoon
                          ? "cursor-default opacity-55"
                          : "active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/25",
                        !comingSoon && isActive
                          ? navMegaLinkAccent
                          : !comingSoon
                            ? "hover:bg-brand/10 dark:hover:bg-brand/14"
                            : undefined,
                      )
                      const inner = (
                        <>
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
                              !comingSoon && isActive
                                ? navMegaLinkAccent
                                : !comingSoon
                                  ? "group-hover:bg-brand/10 group-hover:text-brand-muted dark:group-hover:bg-brand/14 dark:group-hover:text-brand-light"
                                  : undefined,
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1 leading-snug">
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "block text-sm font-semibold tracking-tight transition-colors",
                                  !comingSoon && isActive
                                    ? "text-brand-muted dark:text-brand-light"
                                    : !comingSoon
                                      ? "text-foreground group-hover:text-brand-muted dark:group-hover:text-brand-light"
                                      : "text-foreground",
                                )}
                              >
                                {title}
                              </span>
                              {comingSoon ? (
                                <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {t("games.comingSoon")}
                                </span>
                              ) : null}
                            </span>
                            <span
                              className={cn(
                                "mt-0.5 line-clamp-2 block text-[11px] transition-colors sm:text-xs",
                                !comingSoon && isActive
                                  ? "text-brand-muted/80 dark:text-brand-light/75"
                                  : !comingSoon
                                    ? "text-muted-foreground group-hover:text-brand-muted/80 dark:group-hover:text-brand-light/75"
                                    : "text-muted-foreground",
                              )}
                            >
                              {description}
                            </span>
                          </span>
                        </>
                      )
                      return (
                        <li
                          key={href ?? title}
                          className={cn(
                            "flex min-h-0 flex-1 border-b border-border/60 last:border-b-0",
                            index % 2 === 0 ? "bg-muted/15" : "bg-transparent",
                          )}
                        >
                          {href && !comingSoon ? (
                            <Link href={href} className={rowClass}>
                              {inner}
                            </Link>
                          ) : (
                            <div className={rowClass} aria-disabled>
                              {inner}
                            </div>
                          )}
                        </li>
                      )
                    },
                  )}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem className="py-2">
            <NavigationMenuTrigger active={isMoviesNavActive(pathname)}>
            <LuClapperboard />
            {t("nav.movies")}
            </NavigationMenuTrigger >
            <NavigationMenuContent className="rounded-2xl p-4 text-foreground backdrop-blur-xl md:w-[420px] lg:w-[620px]">
              <div className="grid h-[320px] grid-cols-[minmax(9rem,12.5rem)_1fr] grid-rows-1 items-stretch gap-4">
                <div className="relative h-full w-full self-stretch overflow-hidden rounded-xl">
                  {moviesLoading ? (
                    <Skeleton className="absolute inset-0 h-full w-full rounded-xl bg-muted" />
                  ) : featuredMovie ? (
                    <MovieCard key={featuredMovie.id} movie={featuredMovie} variant="nav-fill" />
                  ) : null}
                </div>
                <ul
                  className={cn(
                    "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl",
                    "border border-border/80 bg-background/60 dark:bg-background/40",
                  )}
                >
                  {movieNavLinks.map(({ href, title, description, Icon }, index) => {
                    const isActive = isNavHrefActive(pathname, href)
                    return (
                    <li
                      key={href}
                      className={cn(
                        "flex min-h-0 flex-1 border-b border-border/60 last:border-b-0",
                        index % 2 === 0 ? "bg-muted/15" : "bg-transparent",
                      )}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "group flex h-full w-full min-h-0 items-center gap-3 px-3 py-2 sm:px-4",
                          "transition-[background-color,color,transform] duration-200 active:scale-[0.99]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/25",
                          isActive
                            ? navMegaLinkAccent
                            : "hover:bg-brand/10 dark:hover:bg-brand/14",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
                            isActive
                              ? navMegaLinkAccent
                              : "group-hover:bg-brand/10 group-hover:text-brand-muted dark:group-hover:bg-brand/14 dark:group-hover:text-brand-light",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          <span
                            className={cn(
                              "block text-sm font-semibold tracking-tight transition-colors",
                              isActive
                                ? "text-brand-muted dark:text-brand-light"
                                : "text-foreground group-hover:text-brand-muted dark:group-hover:text-brand-light",
                            )}
                          >
                            {title}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 block text-[11px] transition-colors sm:text-xs",
                              isActive
                                ? "text-brand-muted/80 dark:text-brand-light/75"
                                : "text-muted-foreground group-hover:text-brand-muted/80 dark:group-hover:text-brand-light/75",
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

          <NavigationMenuItem className="py-2">
            <NavigationMenuTrigger active={isSeriesNavActive(pathname)}>
            <LuTv />
            {t("nav.series")}
            </NavigationMenuTrigger >
            <NavigationMenuContent className="rounded-2xl p-4 text-foreground backdrop-blur-xl md:w-[420px] lg:w-[620px]">
              <div className="grid h-[320px] grid-cols-[minmax(9rem,12.5rem)_1fr] grid-rows-1 items-stretch gap-4">
                <div className="relative h-full w-full self-stretch overflow-hidden rounded-xl">
                  {seriesLoading ? (
                    <Skeleton className="absolute inset-0 h-full w-full rounded-xl bg-muted" />
                  ) : featuredSeries ? (
                    <SeriesCard key={featuredSeries.id} series={featuredSeries} variant="nav-fill" />
                  ) : null}
                </div>
                <ul
                  className={cn(
                    "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl",
                    "border border-border/80 bg-background/60 dark:bg-background/40",
                  )}
                >
                  {seriesNavLinks.map(({ href, title, description, Icon }, index) => {
                    const isActive = isNavHrefActive(pathname, href)
                    return (
                    <li
                      key={href}
                      className={cn(
                        "flex min-h-0 flex-1 border-b border-border/60 last:border-b-0",
                        index % 2 === 0 ? "bg-muted/15" : "bg-transparent",
                      )}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "group flex h-full w-full min-h-0 items-center gap-3 px-3 py-2 sm:px-4",
                          "transition-[background-color,color,transform] duration-200 active:scale-[0.99]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/25",
                          isActive
                            ? navMegaLinkAccent
                            : "hover:bg-brand/10 dark:hover:bg-brand/14",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
                            isActive
                              ? navMegaLinkAccent
                              : "group-hover:bg-brand/10 group-hover:text-brand-muted dark:group-hover:bg-brand/14 dark:group-hover:text-brand-light",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          <span
                            className={cn(
                              "block text-sm font-semibold tracking-tight transition-colors",
                              isActive
                                ? "text-brand-muted dark:text-brand-light"
                                : "text-foreground group-hover:text-brand-muted dark:group-hover:text-brand-light",
                            )}
                          >
                            {title}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 block text-[11px] transition-colors sm:text-xs",
                              isActive
                                ? "text-brand-muted/80 dark:text-brand-light/75"
                                : "text-muted-foreground group-hover:text-brand-muted/80 dark:group-hover:text-brand-light/75",
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
          <Link
            href="/price"
            className={cn(
              "hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium sm:inline-flex",
              "text-muted-foreground transition-colors",
              "hover:bg-muted/40 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
            )}
            aria-label={`${SHINING_PRODUCT_NAME} ${SHINING_MONTHLY_PRICE_LABEL}`}
          >
            <span className="hidden md:inline">{SHINING_PRODUCT_NAME}</span>
            <span className="tabular-nums text-foreground/90">
              {SHINING_MONTHLY_PRICE_LABEL}
              <span className="text-muted-foreground">/mês</span>
            </span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl md:hidden",
                  "border border-border bg-muted/50 text-foreground",
                  "ring-1 ring-inset ring-border/60",
                  "transition hover:border-brand/25 hover:bg-brand/10 hover:text-brand-muted dark:hover:bg-brand/14 dark:hover:text-brand-light",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                )}
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[min(82dvh,44rem)] w-full rounded-t-2xl border-t border-border bg-popover text-foreground backdrop-blur-xl"
            >
              <SheetHeader className="pr-8">
                <SheetTitle>{t("nav.menu")}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6">
                <nav className="flex flex-col gap-1">
                  <SheetClose asChild>
                    <Link
                      href="/"
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium",
                        isNavHrefActive(pathname, "/") ? navMegaLinkAccent : cn("text-foreground", navLinkHover),
                      )}
                    >
                      {t("nav.home")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/lists"
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium",
                        isNavHrefActive(pathname, "/lists") ? navMegaLinkAccent : cn("text-foreground", navLinkHover),
                      )}
                    >
                      {t("nav.lists")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/price"
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium",
                        "text-foreground",
                        navLinkHover,
                      )}
                    >
                      {SHINING_PRODUCT_NAME} · {SHINING_MONTHLY_PRICE_LABEL}/mês
                    </Link>
                  </SheetClose>
                </nav>

                <div className="space-y-2">
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("nav.games")}</p>
                  <div className="flex flex-col gap-1">
                    {gameNavLinks.map(({ href, title, Icon, comingSoon }) => {
                      if (comingSoon || !href) {
                        return (
                          <div
                            key={title}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-60"
                          >
                            <Icon className="h-4 w-4" />
                            <span className="min-w-0 flex-1 truncate">{title}</span>
                            <span className="shrink-0 text-[10px] uppercase tracking-wider">
                              {t("games.comingSoon")}
                            </span>
                          </div>
                        )
                      }
                      const isActive = isNavHrefActive(pathname, href)
                      return (
                        <SheetClose asChild key={href}>
                          <Link
                            href={href}
                            className={cn(
                              "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                              isActive ? navMegaLinkAccent : cn("text-foreground", navLinkHover),
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4 transition-colors",
                                isActive
                                  ? "text-brand-muted dark:text-brand-light"
                                  : "text-muted-foreground group-hover:text-brand-muted dark:group-hover:text-brand-light",
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
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("nav.movies")}</p>
                  <div className="flex flex-col gap-1">
                    {movieNavLinks.map(({ href, title, Icon }) => {
                      const isActive = isNavHrefActive(pathname, href)
                      return (
                      <SheetClose asChild key={href}>
                        <Link
                          href={href}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                            isActive ? navMegaLinkAccent : cn("text-foreground", navLinkHover),
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isActive
                                ? "text-brand-muted dark:text-brand-light"
                                : "text-muted-foreground group-hover:text-brand-muted dark:group-hover:text-brand-light",
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
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("nav.series")}</p>
                  <div className="flex flex-col gap-1">
                    {seriesNavLinks.map(({ href, title, Icon }) => {
                      const isActive = isNavHrefActive(pathname, href)
                      return (
                      <SheetClose asChild key={href}>
                        <Link
                          href={href}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                            isActive ? navMegaLinkAccent : cn("text-foreground", navLinkHover),
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isActive
                                ? "text-brand-muted dark:text-brand-light"
                                : "text-muted-foreground group-hover:text-brand-muted dark:group-hover:text-brand-light",
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

        <ProfileNavMenu />
        </div>
        </div>
      </div>
      <PromoTopBanner />
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
