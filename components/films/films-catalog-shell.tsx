"use client"

import * as React from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MdOutlineKeyboardDoubleArrowUp } from "react-icons/md"
import { cn } from "@/lib/utils"
import { pageContainerClass, glassProfileContainerClass } from "@/lib/page-container"
import { useT } from "@/components/providers/i18n-provider"
import { useDesignMode } from "@/hooks/use-design-mode"
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs"
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass"
import {
  SlidingIndicator,
  useSlidingIndicator,
} from "@/components/ui/sliding-indicator"

const FILMS_NAV_HREF = [
  "/films/discover",
  "/films/popular",
  "/films/top-rated",
  "/films/upcoming",
] as const

const SERIES_NAV_HREF = [
  "/series/discover",
  "/series/popular",
  "/series/top-rated",
  "/series/upcoming",
] as const

/** Nestas rotas o conteúdo do shell fica abaixo da navbar fixa (`mt-28`). */
const CATALOG_NAVBAR_OFFSET_ROUTES = new Set<string>([
  "/lists",
  ...FILMS_NAV_HREF,
  ...SERIES_NAV_HREF,
])

function CatalogPillNav({
  items,
  ariaLabel,
}: {
  items: readonly { href: string; label: string }[]
  ariaLabel: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const designMode = useDesignMode()
  const listRef = React.useRef<HTMLElement>(null)
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([])
  const activeHref =
    items.find((item) => pathname === item.href)?.href ?? items[0]?.href ?? ""

  const getActiveElement = React.useCallback(() => {
    const index = items.findIndex((item) => item.href === activeHref)
    return itemRefs.current[index] ?? null
  }, [items, activeHref])

  const indicator = useSlidingIndicator(activeHref, listRef, getActiveElement)

  if (designMode === "glass") {
    return (
      <nav aria-label={ariaLabel} className="mb-8 min-w-0 w-full">
        <MagneticTabs
          glass
          className="mt-glass"
          size="md"
          value={activeHref}
          onChange={(href) => router.push(href)}
          items={items.map((it) => ({
            value: it.href,
            label: it.label,
          }))}
        />
      </nav>
    )
  }

  return (
    <nav
      ref={listRef}
      aria-label={ariaLabel}
      className="relative mb-8 flex flex-wrap gap-2"
    >
      <SlidingIndicator
        indicator={indicator}
        className="rounded-full bg-brand/10 ring-1 ring-brand-muted/35"
      />
      {items.map(({ href, label }, index) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            ref={(el) => {
              itemRefs.current[index] = el
            }}
            href={href}
            className={cn(
              "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "text-brand-muted"
                : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
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
  const { t } = useT()
  const items = [
    { href: "/films/discover", label: t("nav.discover") },
    { href: "/films/popular", label: t("nav.popular") },
    { href: "/films/top-rated", label: t("nav.topRated") },
    { href: "/films/upcoming", label: t("nav.upcoming") },
  ] as const
  return <CatalogPillNav items={items} ariaLabel={t("nav.filmsCatalog")} />
}

export function SeriesSubNav() {
  const { t } = useT()
  const items = [
    { href: "/series/discover", label: t("nav.discover") },
    { href: "/series/popular", label: t("nav.popular") },
    { href: "/series/top-rated", label: t("nav.topRated") },
    { href: "/series/upcoming", label: t("nav.upcomingSeries") },
  ] as const
  return <CatalogPillNav items={items} ariaLabel={t("nav.seriesCatalog")} />
}

export type ListsFilter = "all" | "yours" | "public"

const listsPillClass = (active: boolean) =>
  cn(
    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-brand/10 text-brand-muted ring-1 ring-brand-muted/35"
      : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
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
  const { t } = useT()
  const designMode = useDesignMode()

  if (designMode === "glass") {
    return (
      <nav aria-label={t("nav.lists")} className="mb-8 min-w-0 w-full">
        <MagneticTabs
          glass
          className="mt-glass"
          size="md"
          value={value}
          onChange={(val) => onChange(val as ListsFilter)}
          items={[
            { value: "all", label: t("lists.all") },
            ...(showYoursTab ? [{ value: "yours", label: t("lists.yours") }] : []),
            { value: "public", label: t("lists.public") },
          ]}
        />
      </nav>
    )
  }

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
    <nav aria-label={t("nav.lists")} className="mb-8 flex flex-wrap gap-2">
      {pill("all", t("lists.all"))}
      {showYoursTab ? pill("yours", t("lists.yours")) : null}
      {pill("public", t("lists.public"))}
    </nav>
  )
}

export function FilmsCatalogShell({
  children,
  compact,
  className,
  disableNavbarOffset,
}: {
  children: ReactNode
  compact?: boolean
  /** Mescla no container interno. */
  className?: string
  /** Quando `true`, não aplica `mt-28` mesmo em rotas de catálogo (discover/popular/etc.). */
  disableNavbarOffset?: boolean
}) {
  const pathname = usePathname()
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"
  const catalogNavbarOffset =
    !disableNavbarOffset && CATALOG_NAVBAR_OFFSET_ROUTES.has(pathname)

  return (
    <div className={cn("relative min-w-0 w-full", compact && "flex min-h-0 flex-1 flex-col")}>
      <div
        className={cn(
          isGlass ? glassProfileContainerClass : pageContainerClass,
          "relative",
          compact ? " flex min-h-0 flex-1 flex-col pb-4" : " pb-20",
          catalogNavbarOffset && (isGlass ? "mt-[calc(var(--ck-nav-h,3.25rem)+1.5rem)]" : "mt-28"),
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
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"

  if (isGlass) {
    return (
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-white/40">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {actions}
          </div>
        ) : null}
      </header>
    )
  }

  return (
    <header className="mb-8 flex flex-col gap-6 pb-8 border-b border-border sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-3">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
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
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"

  if (isGlass) {
    return (
      <LiquidGlass className="!rounded-full">
        <button
          ref={ref}
          type="button"
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center text-white/80 transition hover:text-white active:scale-95",
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </LiquidGlass>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition-colors hover:border-brand/35 hover:bg-brand/10 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})

export const FilmsToolbarPillButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function FilmsToolbarPillButton({ className, children, ...props }, ref) {
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"

  if (isGlass) {
    return (
      <LiquidGlass className="!rounded-full">
        <button
          ref={ref}
          type="button"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/85 transition hover:text-white active:scale-95",
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </LiquidGlass>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/35 hover:bg-brand/10 hover:text-brand",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})

/** Grelha alinhada à landing: cartões mais respirados, bordas suaves. No modo glass dentro de ck-glass-shell, ck-catalog-grid usa 4 colunas. */
export const filmsPosterGridClassName =
  "ck-catalog-grid grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-6 lg:gap-5"

/** Mesmo “caixa” do poster em `MovieCard` (default): borda, raio e sombra. */
export const filmsPosterSkeletonClassName =
  "relative aspect-[2/3] h-full w-full overflow-hidden rounded-[5px] border-[1px] border-black/15 bg-muted/50 shadow-sm shadow-black/5 dark:border-white/15 dark:bg-muted/30 dark:shadow-white/5"

export function CatalogCardSkeleton() {
  const designMode = useDesignMode()
  if (designMode === "glass") {
    return (
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[12px] bg-white/[0.04] ring-1 ring-white/10" />
    )
  }
  return (
    <div className={filmsPosterSkeletonClassName} />
  )
}

export function FilmsScrollToTopFab({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  if (!visible) return null
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-8 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full",
        "border border-border bg-muted text-muted-foreground shadow-lg shadow-black/35 backdrop-blur-md",
        "transition-colors hover:border-brand/45 hover:text-brand sm:right-8",
      )}
    >
      <MdOutlineKeyboardDoubleArrowUp className="h-5 w-5" />
    </button>
  )
}
