"use client"

import * as React from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MdOutlineKeyboardDoubleArrowUp } from "react-icons/md"
import { cn } from "@/lib/utils"

const FILMS_NAV = [
  { href: "/films/discover", label: "Discover" },
  { href: "/films/popular", label: "Popular" },
  { href: "/films/top-rated", label: "Top rated" },
  { href: "/films/upcoming", label: "Upcoming" },
] as const

const SERIES_NAV = [
  { href: "/series/discover", label: "Discover" },
  { href: "/series/popular", label: "Popular" },
  { href: "/series/top-rated", label: "Top rated" },
  { href: "/series/upcoming", label: "Upcoming" },
] as const

function CatalogPillNav({
  items,
  ariaLabel,
}: {
  items: readonly { href: string; label: string }[]
  ariaLabel: string
}) {
  const pathname = usePathname()
  return (
    <nav aria-label={ariaLabel} className="mb-8 flex flex-wrap gap-2">
      {items.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#FF0048]/15 text-[#FF0048] ring-1 ring-[#FF0048]/35"
                : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100",
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function FilmsSubNav() {
  return <CatalogPillNav items={FILMS_NAV} ariaLabel="Films catalog" />
}

export function SeriesSubNav() {
  return <CatalogPillNav items={SERIES_NAV} ariaLabel="TV series catalog" />
}

export type ListsFilter = "all" | "yours" | "public"

const listsPillClass = (active: boolean) =>
  cn(
    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-[#FF0048]/15 text-[#FF0048] ring-1 ring-[#FF0048]/35"
      : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100",
  )

/** Same pill look as catalog — filters which list blocks are shown on `/lists`. */
export function ListsSubNav({
  showYoursTab = false,
  value,
  onChange,
}: {
  showYoursTab?: boolean
  value: ListsFilter
  onChange: (next: ListsFilter) => void
}) {
  const pill = (key: ListsFilter, label: string) => (
    <button
      key={key}
      type="button"
      className={listsPillClass(value === key)}
      aria-pressed={value === key}
      onClick={() => onChange(key)}
    >
      {label}
    </button>
  )

  return (
    <nav aria-label="Lists filter" className="mb-8 flex flex-wrap gap-2">
      {pill("all", "All")}
      {showYoursTab ? pill("yours", "Yours") : null}
      {pill("public", "Public")}
    </nav>
  )
}

export function FilmsCatalogShell({
  children,
  compact,
  className,
}: {
  children: ReactNode
  compact?: boolean
  /** Mescla no container interno (ex.: `mt-28` para alinhar com o perfil). */
  className?: string
}) {
  return (
    <div className={cn("relative min-w-0 w-full", compact && "flex min-h-0 flex-1 flex-col")}>
      <div
        className={cn(
          "relative mx-auto w-full max-w-6xl",
          compact ? "mt-28 flex min-h-0 flex-1 flex-col pb-4" : "mt-28 pb-20",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Mesmo layout que filmes — hub e listagens de séries. */
export const SeriesCatalogShell = FilmsCatalogShell

export function FilmsCatalogHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  /** Small label above the title (e.g. “Catalog”, “Curate”). Omit when not needed. */
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-6 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-3">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export const FilmsToolbarIconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function FilmsToolbarIconButton({ className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-300 transition-colors",
        "hover:border-[#FF0048]/35 hover:bg-[#FF0048]/10 hover:text-[#FF0048]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})

/** Grelha alinhada à landing: cartões mais respirados, bordas suaves. */
export const filmsPosterGridClassName =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-6 lg:gap-5"

/** Mesmo “caixa” do poster em `MovieCard` (default): borda, raio e sombra. */
export const filmsPosterSkeletonClassName =
  "relative aspect-[2/3] h-full w-full overflow-hidden rounded-[5px] border-[1px] border-black/15 bg-muted/50 shadow-sm shadow-black/5 dark:border-white/15 dark:bg-muted/30 dark:shadow-white/5"

export function FilmsScrollToTopFab({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  if (!visible) return null
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-8 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full",
        "border border-white/[0.1] bg-zinc-950/90 text-zinc-300 shadow-lg shadow-black/35 backdrop-blur-md",
        "transition-colors hover:border-[#FF0048]/45 hover:text-[#FF0048] sm:right-8",
      )}
    >
      <MdOutlineKeyboardDoubleArrowUp className="h-5 w-5" />
    </button>
  )
}
