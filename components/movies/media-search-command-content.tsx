"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { Movie } from "@/lib/tmdb/client"
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import type { SeriesSearchResult } from "@/hooks/use-media-search"
import type { UserSearchResult } from "@/hooks/use-user-search"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { cn } from "@/lib/utils"

export type { SeriesSearchResult }

export type FilmRowMode = "navigate" | "pick"
export type SeriesRowMode = "navigate" | "pick"

export interface MediaSearchCommandContentProps {
  query: string
  onQueryChange: (value: string) => void
  /** Glass: query já bateu com o debounce (digitação parou). */
  querySettled?: boolean
  filmResults: Movie[]
  seriesResults: SeriesSearchResult[]
  loading: boolean
  onSelectFilm: (movie: Movie) => void
  onSelectSeries: (series: SeriesSearchResult) => void
  inputPlaceholder?: string
  commandInputClassName?: string
  commandListClassName?: string
  filmRowMode?: FilmRowMode
  seriesRowMode?: SeriesRowMode
  /** Quando true, não renderiza `DialogTitle` (use dentro de outro `Dialog` com título próprio). */
  suppressDialogTitle?: boolean
  peopleResults?: UserSearchResult[]
  peopleLoading?: boolean
  onSelectPerson?: (person: UserSearchResult) => void
  /** Glass: só input ao abrir; lista com stagger ao pesquisar. */
  appearance?: "default" | "glass"
}

const MotionCommandItem = motion(CommandItem)

const staggerItem = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
}

const GLASS_REVEAL_MS = 180

/** Mesmo padrão das avaliações: mask + blur nas bordas pra indicar scroll. */
function GlassScrollFade({
  children,
  className,
  listClassName,
  listKey,
}: {
  children: ReactNode
  className?: string
  listClassName?: string
  listKey?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    const el = listRef.current
    if (!el) return

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setCanScrollUp(scrollTop > 4)
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4)
    }

    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [listKey, children])

  const maskStyle = useMemo<CSSProperties>(() => {
    if (canScrollUp && canScrollDown) {
      return {
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 28px, black calc(100% - 40px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 28px, black calc(100% - 40px), transparent 100%)",
      }
    }
    if (canScrollDown) {
      return {
        maskImage:
          "linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)",
      }
    }
    if (canScrollUp) {
      return {
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 28px, black 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 28px, black 100%)",
      }
    }
    return {}
  }, [canScrollUp, canScrollDown])

  return (
    <div className={cn("relative w-full", className)}>
      <CommandList
        ref={listRef}
        key={listKey}
        className={listClassName}
        style={maskStyle}
      >
        {children}
      </CommandList>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 transition-opacity duration-300",
          "backdrop-blur-[2.5px] [mask-image:linear-gradient(to_top,black_15%,transparent)] [-webkit-mask-image:linear-gradient(to_top,black_15%,transparent)]",
          canScrollDown ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-10 transition-opacity duration-300",
          "backdrop-blur-[2.5px] [mask-image:linear-gradient(to_bottom,black_15%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_15%,transparent)]",
          canScrollUp ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  )
}

function PreviewCard({
  title,
  original,
  overview,
  backdropPath,
  posterPath,
  isGlass,
  emptyOverview,
}: {
  title: string
  original: string | null
  overview?: string | null
  backdropPath?: string | null
  posterPath?: string | null
  isGlass: boolean
  emptyOverview: string
}) {
  const body = (
    <>
      <div className="relative h-32 w-full">
        {backdropPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w500/${backdropPath}`}
            alt={title}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className={cn("h-full w-full", isGlass ? "bg-white/5" : "bg-muted")} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div
          className={cn(
            "absolute left-3 top-full aspect-[2/3] h-[154px] w-auto -translate-y-1/4 overflow-hidden rounded shadow-lg",
            isGlass ? "ring-1 ring-white/15 bg-white/5" : "border border-border bg-muted",
          )}
        >
          {posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w185/${posterPath}`}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={cn("h-full w-full", isGlass ? "bg-white/5" : "bg-muted")} />
          )}
        </div>
      </div>
      <div className="flex min-h-[126px] items-start gap-3 px-5 py-3">
        <div className="w-24 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-semibold", isGlass && "text-white")}>{title}</p>
          {original ? (
            <p className={cn("truncate text-xs", isGlass ? "text-white/45" : "text-muted-foreground")}>
              {original}
            </p>
          ) : null}
          <p
            className={cn(
              "mt-1 line-clamp-3 text-xs leading-relaxed",
              isGlass ? "text-white/55" : "text-muted-foreground",
            )}
          >
            {overview?.trim() || emptyOverview}
          </p>
        </div>
      </div>
    </>
  )

  if (isGlass) {
    return (
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={12}
        className="z-[120] w-[360px] border-0 bg-transparent p-0 shadow-none outline-none"
      >
        <LiquidGlass
          className="w-full overflow-hidden !rounded-[20px] !bg-[rgba(18,18,20,0.55)] shadow-[0_24px_56px_-16px_rgba(0,0,0,0.75)]"
          blur={20}
          saturation={1.2}
        >
          {body}
        </LiquidGlass>
      </HoverCardContent>
    )
  }

  return (
    <HoverCardContent
      side="right"
      align="start"
      sideOffset={10}
      className="w-[360px] overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl"
    >
      {body}
    </HoverCardContent>
  )
}

export function MediaSearchCommandContent({
  query,
  onQueryChange,
  querySettled = true,
  filmResults,
  seriesResults,
  loading,
  onSelectFilm,
  onSelectSeries,
  inputPlaceholder = "Search",
  commandInputClassName,
  commandListClassName,
  filmRowMode = "navigate",
  seriesRowMode = "navigate",
  suppressDialogTitle = false,
  peopleResults = [],
  peopleLoading = false,
  onSelectPerson,
  appearance = "default",
}: MediaSearchCommandContentProps) {
  const isGlass = appearance === "glass"
  const pickFilms = filmRowMode === "pick"
  const pickSeries = seriesRowMode === "pick"
  const showPeople = Boolean(onSelectPerson)
  const anyLoading = loading || (showPeople && peopleLoading)
  const hasMedia = filmResults.length > 0 || seriesResults.length > 0
  const hasPeople = showPeople && peopleResults.length > 0
  const showPeopleGroup =
    showPeople &&
    query.trim().length >= 2 &&
    (peopleResults.length > 0 || query.trim().startsWith("@"))
  const hasAny = hasMedia || hasPeople
  const hasQuery = query.trim().length > 0

  const resultsSignature = [
    filmResults.map((f) => f.id).join(","),
    seriesResults.map((s) => s.id).join(","),
    peopleResults.map((p) => p.id).join(","),
  ].join("|")

  const [glassReveal, setGlassReveal] = useState(false)

  useEffect(() => {
    if (!isGlass) {
      setGlassReveal(true)
      return
    }
    if (!hasQuery || !querySettled || anyLoading) {
      setGlassReveal(false)
      return
    }
    const t = window.setTimeout(() => setGlassReveal(true), GLASS_REVEAL_MS)
    return () => window.clearTimeout(t)
  }, [isGlass, hasQuery, querySettled, anyLoading, resultsSignature])

  const showResultsPanel = isGlass
    ? glassReveal && hasQuery && querySettled && !anyLoading
    : true

  let staggerIndex = 0

  const itemMotion = (i: number) =>
    isGlass
      ? {
          ...staggerItem,
          transition: {
            delay: i * 0.045,
            duration: 0.28,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        }
      : undefined

  const input = (
    <CommandInput
      placeholder={inputPlaceholder}
      value={query}
      onValueChange={onQueryChange}
      wrapperClassName={isGlass ? "border-0 bg-transparent px-4" : undefined}
      className={cn(
        isGlass && "h-12 text-[15px] text-white placeholder:text-white/40",
        commandInputClassName,
      )}
    />
  )

  const resultsBody = (
    <>
      {!isGlass && anyLoading && <CommandEmpty>Searching...</CommandEmpty>}
      {!anyLoading && !hasAny && query && (
        <CommandEmpty className={cn(isGlass && "text-white/45")}>
          No results found.
        </CommandEmpty>
      )}
      {!anyLoading && hasAny && (
        <>
          {showPeopleGroup ? (
            <CommandGroup
              heading="People"
              data-cmdk-no-filter
              className={cn(
                isGlass &&
                  "bg-transparent p-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-white/35",
              )}
            >
              {peopleResults.length === 0 ? (
                <CommandItem
                  disabled
                  className={cn(
                    "mx-2 h-9 px-3 text-xs",
                    isGlass ? "text-white/40" : "text-muted-foreground",
                  )}
                >
                  No people found
                </CommandItem>
              ) : (
                peopleResults.map((person) => {
                  const i = staggerIndex++
                  const motionProps = itemMotion(i)
                  return (
                    <MotionCommandItem
                      key={`user-${person.id}`}
                      value={`${person.username} ${person.display_name || ""}`}
                      data-cmdk-no-filter
                      onSelect={() => onSelectPerson?.(person)}
                      className={cn(
                        "mx-2 flex h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium",
                        isGlass && "bg-transparent text-white/90 aria-selected:bg-white/[0.08]",
                      )}
                      initial={motionProps?.initial}
                      animate={motionProps?.animate}
                      transition={motionProps?.transition}
                    >
                      <Avatar
                        className={cn(
                          "size-7 rounded-md border",
                          isGlass ? "border-white/10" : "border-border",
                        )}
                      >
                        <AvatarImage
                          src={avatarDisplaySrc(person.avatar_url) ?? undefined}
                          alt=""
                        />
                        <AvatarFallback className="rounded-md text-[10px]">
                          {(person.display_name?.[0] || person.username[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1 truncate">
                        {person.display_name || person.username}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs",
                          isGlass ? "text-white/40" : "text-muted-foreground",
                        )}
                      >
                        @{person.username}
                      </span>
                    </MotionCommandItem>
                  )
                })
              )}
            </CommandGroup>
          ) : null}

          <CommandGroup
            heading="Films"
            data-cmdk-no-filter
            className={cn(
              isGlass &&
                "bg-transparent p-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-white/35",
            )}
          >
            {filmResults.length === 0 ? (
              <CommandItem
                disabled
                className={cn(
                  "mx-2 h-9 px-3 text-xs",
                  isGlass ? "text-white/40" : "text-muted-foreground",
                )}
              >
                No films found
              </CommandItem>
            ) : (
              filmResults.map((movie) => {
                const title = movie.title || ""
                const original =
                  movie.original_title?.trim() &&
                  movie.original_title.trim().toLowerCase() !== title.trim().toLowerCase()
                    ? movie.original_title.trim()
                    : null
                const i = staggerIndex++
                const motionProps = itemMotion(i)
                return (
                  <HoverCard key={`film-${movie.id}`} openDelay={120} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <MotionCommandItem
                        value={`${title} ${original || ""} ${movie.release_date || ""}`}
                        data-cmdk-no-filter
                        onSelect={() => {
                          if (!pickFilms) onSelectFilm(movie)
                        }}
                        className={cn(
                          "mx-2 flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium",
                          isGlass && "bg-transparent text-white/90 aria-selected:bg-white/[0.08]",
                        )}
                        initial={motionProps?.initial}
                        animate={motionProps?.animate}
                        transition={motionProps?.transition}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          <span className="truncate">{title}</span>
                          {original ? (
                            <span
                              className={cn(
                                "ml-1.5 truncate text-xs font-normal",
                                isGlass ? "text-white/40" : "text-muted-foreground",
                              )}
                            >
                              {original}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-xs tabular-nums",
                            isGlass ? "text-white/40" : "text-muted-foreground",
                            !pickFilms && "ml-auto pl-3",
                          )}
                        >
                          {movie.release_date
                            ? new Date(movie.release_date).getFullYear()
                            : "----"}
                        </span>
                        {pickFilms && (
                          <button
                            type="button"
                            className={cn(
                              "ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors",
                              isGlass
                                ? "border-white/15 text-white/50 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                : "border-border/60 text-muted-foreground hover:border-brand/40 hover:bg-brand/10 hover:text-brand",
                            )}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onSelectFilm(movie)
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </MotionCommandItem>
                    </HoverCardTrigger>
                    <PreviewCard
                      title={title}
                      original={original}
                      overview={movie.overview}
                      backdropPath={movie.backdrop_path}
                      posterPath={movie.poster_path}
                      isGlass={isGlass}
                      emptyOverview="Sem descricao disponivel."
                    />
                  </HoverCard>
                )
              })
            )}
          </CommandGroup>
          <CommandGroup
            heading="Series"
            data-cmdk-no-filter
            className={cn(
              isGlass &&
                "bg-transparent p-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-white/35",
            )}
          >
            {seriesResults.length === 0 ? (
              <CommandItem
                disabled
                className={cn(
                  "mx-2 h-9 px-3 text-xs",
                  isGlass ? "text-white/40" : "text-muted-foreground",
                )}
              >
                No series found
              </CommandItem>
            ) : (
              seriesResults.map((series) => {
                const name = series.name || ""
                const original =
                  series.original_name?.trim() &&
                  series.original_name.trim().toLowerCase() !== name.trim().toLowerCase()
                    ? series.original_name.trim()
                    : null
                const i = staggerIndex++
                const motionProps = itemMotion(i)
                return (
                  <HoverCard key={`series-${series.id}`} openDelay={120} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <MotionCommandItem
                        value={`${name} ${original || ""} ${series.first_air_date || ""}`}
                        data-cmdk-no-filter
                        onSelect={() => {
                          if (!pickSeries) onSelectSeries(series)
                        }}
                        className={cn(
                          "mx-2 flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium",
                          isGlass && "bg-transparent text-white/90 aria-selected:bg-white/[0.08]",
                        )}
                        initial={motionProps?.initial}
                        animate={motionProps?.animate}
                        transition={motionProps?.transition}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          <span className="truncate">{name}</span>
                          {original ? (
                            <span
                              className={cn(
                                "ml-1.5 truncate text-xs font-normal",
                                isGlass ? "text-white/40" : "text-muted-foreground",
                              )}
                            >
                              {original}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-xs tabular-nums",
                            isGlass ? "text-white/40" : "text-muted-foreground",
                            !pickSeries && "ml-auto pl-3",
                          )}
                        >
                          {series.first_air_date
                            ? new Date(series.first_air_date).getFullYear()
                            : "----"}
                        </span>
                        {pickSeries && (
                          <button
                            type="button"
                            className={cn(
                              "ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors",
                              isGlass
                                ? "border-white/15 text-white/50 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                : "border-border/60 text-muted-foreground hover:border-brand/40 hover:bg-brand/10 hover:text-brand",
                            )}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onSelectSeries(series)
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </MotionCommandItem>
                    </HoverCardTrigger>
                    <PreviewCard
                      title={name}
                      original={original}
                      overview={series.overview}
                      backdropPath={series.backdrop_path}
                      posterPath={series.poster_path}
                      isGlass={isGlass}
                      emptyOverview="Series description not available."
                    />
                  </HoverCard>
                )
              })
            )}
          </CommandGroup>
        </>
      )}
    </>
  )

  const results = !showResultsPanel
    ? null
    : isGlass
      ? (
          <GlassScrollFade
            className="mt-3"
            listKey={resultsSignature}
            listClassName="max-h-[min(52vh,420px)] border-0 bg-transparent p-0 shadow-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {resultsBody}
          </GlassScrollFade>
        )
      : (
          <CommandList
            className={commandListClassName ?? "custom-scrollbar max-h-[460px] pb-3"}
          >
            {resultsBody}
          </CommandList>
        )

  if (!isGlass) {
    return (
      <>
        {!suppressDialogTitle ? (
          <DialogTitle className="flex items-center gap-2 text-sm" />
        ) : null}
        {input}
        {results}
      </>
    )
  }

  return (
    <>
      {!suppressDialogTitle ? (
        <DialogTitle className="flex items-center gap-2 text-sm" />
      ) : null}
      <div className="flex w-full flex-col">
        <LiquidGlass
          className="w-full !rounded-full !bg-[rgba(22,23,25,0.42)] shadow-[0_24px_64px_-18px_rgba(0,0,0,0.7)]"
          blur={22}
          saturation={1.25}
        >
          {input}
        </LiquidGlass>
        <div className="min-h-0 w-full">{results}</div>
      </div>
    </>
  )
}
