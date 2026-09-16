"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  List,
  Menu,
  X,
} from "lucide-react"
import { BiHomeAlt } from "react-icons/bi"
import { LuClapperboard, LuTv } from "react-icons/lu"
import { ClaketeLogo } from "./clakete-logo"
import { ProfileNavMenu } from "./profile-nav-menu"
import { SearchCommand } from "../movies/search-command"
import { PromoTopBanner } from "@/components/promo/promo-top-banner"
import {
  SHINING_MONTHLY_PRICE_LABEL,
  SHINING_PRODUCT_NAME,
} from "@/lib/plans"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"
import {
  isGamesNavActive,
  isMoviesNavActive,
  isNavHrefActive,
  isSeriesNavActive,
} from "@/components/ui/navigation-menu"
import { Gamepad2, MapPin } from "lucide-react"

const ICON_STROKE = 1.5

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return isNavHrefActive(pathname, href)
}

const SERIES_CATALOG_SEGMENTS = new Set([
  "discover",
  "popular",
  "top-rated",
  "upcoming",
])

function isGlassWideRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  // Detalhes específicos de filme (ex: /film/157336 ou /[username]/film/...)
  if (pathname.startsWith("/film/")) return true
  if (/^\/[^/]+\/(film|series)\//.test(pathname)) return true

  // Detalhes específicos de série (ex: /series/1399 ou /series/1399/season/1)
  // Páginas gerais de catálogo (/series, /series/discover, etc.) permanecem no shell normal (820px)
  if (pathname.startsWith("/series/")) {
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length >= 2 && !SERIES_CATALOG_SEGMENTS.has(parts[1])) {
      return true
    }
  }

  return false
}

export function NavbarGlass() {
  const { t } = useT()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navReady = useRef(false)
  const wideNav = isGlassWideRoute(pathname)

  useEffect(() => {
    const next = wideNav ? "1060px" : "820px"
    const pad = wideNav ? "0px" : "16px"
    if (!navReady.current) {
      navReady.current = true
      document.documentElement.style.setProperty("--ck-nav-w", next)
      document.documentElement.style.setProperty("--ck-content-pad-x", pad)
      document.documentElement.style.setProperty("--ck-glass-content-pad-x", pad)
      return
    }
    let timeout = 0
    const frame = window.requestAnimationFrame(() => {
      timeout = window.setTimeout(() => {
        document.documentElement.style.setProperty("--ck-nav-w", next)
        document.documentElement.style.setProperty("--ck-content-pad-x", pad)
        document.documentElement.style.setProperty("--ck-glass-content-pad-x", pad)
      }, 80)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [wideNav])

  useEffect(() => {
    document.documentElement.dataset.ckDesign = "glass"
    return () => {
      document.documentElement.style.removeProperty("--ck-nav-w")
      document.documentElement.style.removeProperty("--ck-content-pad-x")
      document.documentElement.style.removeProperty("--ck-glass-content-pad-x")
      delete document.documentElement.dataset.ckDesign
    }
  }, [])

  const navLinks = [
    { href: "/", label: t("nav.home"), icon: BiHomeAlt, active: isActive(pathname, "/") },
    { href: "/lists", label: t("nav.lists"), icon: List, active: isActive(pathname, "/lists") },
    {
      href: "/films/discover",
      label: t("nav.movies"),
      icon: LuClapperboard,
      active: isMoviesNavActive(pathname),
    },
    {
      href: "/series/discover",
      label: t("nav.series"),
      icon: LuTv,
      active: isSeriesNavActive(pathname),
    },
    {
      href: "/games",
      label: t("nav.games"),
      icon: Gamepad2,
      active: isGamesNavActive(pathname),
    },
    {
      href: "/cinemas",
      label: t("nav.cinemas"),
      icon: MapPin,
      active: isActive(pathname, "/cinemas"),
    },
  ] as const

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [pathname])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[50] flex w-full flex-col pt-[env(safe-area-inset-top,0px)]">
        <div
          className={cn(
            "pointer-events-auto relative z-30 w-full border-b transition-[border-color,background-color,backdrop-filter] duration-200",
            scrolled
              ? "border-white/10 bg-transparent backdrop-blur-xl backdrop-saturate-150"
              : "border-transparent bg-transparent",
          )}
        >
          <div
            aria-hidden
            className={cn(
              "ck-nav-gradient pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_80%_120%_at_12%_0%,hsl(var(--brand)/0.28),transparent_62%)] transition-opacity duration-300",
              wideNav && "opacity-0",
            )}
          />
          <nav className="relative ck-nav">
            <Link
              href="/"
              className="flex size-8 shrink-0 items-center justify-center"
              aria-label="Clakete"
            >
              <ClaketeLogo className="size-6" />
            </Link>

            <div className="ck-center-and-right">
              <div className="ck-nav-links">
                {navLinks.map(({ href, label, icon: Icon, active }) => (
                  <Link
                    key={href}
                    href={href}
                    data-active={active}
                    className="ck-nav-link"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <SearchCommand variant="nav" />
                <Link
                  href="/price"
                  className="hidden px-2 py-1 text-sm font-medium text-foreground/70 transition hover:text-foreground sm:inline"
                  aria-label={`${SHINING_PRODUCT_NAME} ${SHINING_MONTHLY_PRICE_LABEL}`}
                >
                  <span className="hidden lg:inline">{SHINING_PRODUCT_NAME}</span>
                  <span className="lg:ml-1 tabular-nums">
                    {SHINING_MONTHLY_PRICE_LABEL}
                    <span className="text-muted-foreground">/mês</span>
                  </span>
                </Link>
                <ProfileNavMenu compact />
                <button
                  type="button"
                  className="inline-flex rounded-md p-1.5 text-foreground/70 transition hover:bg-muted/50 hover:text-foreground md:hidden"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? t("common.close") : t("nav.menu")}
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? (
                    <X className="h-5 w-5" strokeWidth={ICON_STROKE} />
                  ) : (
                    <Menu className="h-5 w-5" strokeWidth={ICON_STROKE} />
                  )}
                </button>
              </div>
            </div>
          </nav>
        </div>
        <PromoTopBanner />
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-background pt-[calc(var(--ck-nav-h)+env(safe-area-inset-top,0px))] md:hidden">
          <div className="flex flex-col gap-1 px-4 pt-2">
            {navLinks.map(({ href, label, icon: Icon, active }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-foreground/80 transition hover:bg-muted/50",
                  active && "bg-muted/40 text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            <Link
              href="/price"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-foreground/80 transition hover:bg-muted/50"
            >
              {SHINING_PRODUCT_NAME} · {SHINING_MONTHLY_PRICE_LABEL}/mês
            </Link>
          </div>
        </div>
      ) : null}
    </>
  )
}
