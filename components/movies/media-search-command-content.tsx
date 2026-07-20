"use client"

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
import type { SeriesSearchResult } from "@/hooks/use-media-search"
import type { UserSearchResult } from "@/hooks/use-user-search"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarDisplaySrc } from "@/lib/next-remote-image"

export type { SeriesSearchResult }

export type FilmRowMode = "navigate" | "pick"
export type SeriesRowMode = "navigate" | "pick"

export interface MediaSearchCommandContentProps {
  query: string
  onQueryChange: (value: string) => void
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
}

export function MediaSearchCommandContent({
  query,
  onQueryChange,
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
}: MediaSearchCommandContentProps) {
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

  return (
    <>
      {!suppressDialogTitle ? (
        <DialogTitle className="flex items-center gap-2 text-sm" />
      ) : null}
      <CommandInput
        placeholder={inputPlaceholder}
        value={query}
        onValueChange={onQueryChange}
        className={commandInputClassName}
      />
      <CommandList className={commandListClassName ?? "custom-scrollbar max-h-[460px] pb-3"}>
        {anyLoading && <CommandEmpty>Searching...</CommandEmpty>}
        {!anyLoading && !hasAny && query && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {!anyLoading && hasAny && (
          <>
            {showPeopleGroup ? (
              <CommandGroup heading="People" data-cmdk-no-filter>
                {peopleResults.length === 0 ? (
                  <CommandItem disabled className="mx-2 h-9 px-3 text-xs text-muted-foreground">
                    No people found
                  </CommandItem>
                ) : (
                  peopleResults.map((person) => (
                    <CommandItem
                      key={`user-${person.id}`}
                      value={`${person.username} ${person.display_name || ""}`}
                      data-cmdk-no-filter
                      onSelect={() => onSelectPerson?.(person)}
                      className="mx-2 flex h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium"
                    >
                      <Avatar className="size-7 rounded-md border border-border">
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
                      <span className="shrink-0 text-xs text-muted-foreground">
                        @{person.username}
                      </span>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            ) : null}

            <CommandGroup heading="Films" data-cmdk-no-filter>
              {filmResults.length === 0 ? (
                <CommandItem disabled className="mx-2 h-9 px-3 text-xs text-muted-foreground">
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
                  return (
                  <HoverCard key={`film-${movie.id}`} openDelay={120} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <CommandItem
                        value={`${title} ${original || ""} ${movie.release_date || ""}`}
                        data-cmdk-no-filter
                        onSelect={() => {
                          if (!pickFilms) onSelectFilm(movie)
                        }}
                        className="mx-2 flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          <span className="truncate">{title}</span>
                          {original ? (
                            <span className="ml-1.5 truncate text-xs font-normal text-muted-foreground">
                              {original}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={`shrink-0 text-xs text-muted-foreground tabular-nums ${!pickFilms ? "ml-auto pl-3" : ""}`}
                        >
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : "----"}
                        </span>
                        {pickFilms && (
                          <button
                            type="button"
                            className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
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
                      </CommandItem>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="start"
                      sideOffset={10}
                      className="w-[360px] overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl"
                    >
                      <div className="relative h-32 w-full">
                        {movie.backdrop_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500/${movie.backdrop_path}`}
                            alt={title}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                        <div className="absolute left-3 top-full aspect-[2/3] h-[154px] w-auto -translate-y-1/4 overflow-hidden rounded border border-border bg-muted shadow-lg">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185/${movie.poster_path}`}
                              alt={title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                        </div>
                      </div>
                      <div className="flex min-h-[126px] items-start gap-3 px-5 py-3">
                        <div className="w-24 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{title}</p>
                          {original ? (
                            <p className="truncate text-xs text-muted-foreground">{original}</p>
                          ) : null}
                          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                            {movie.overview?.trim() || "Sem descricao disponivel."}
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  )
                })
              )}
            </CommandGroup>
            <CommandGroup heading="Series" data-cmdk-no-filter>
              {seriesResults.length === 0 ? (
                <CommandItem disabled className="mx-2 h-9 px-3 text-xs text-muted-foreground">
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
                  return (
                  <HoverCard key={`series-${series.id}`} openDelay={120} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <CommandItem
                        value={`${name} ${original || ""} ${series.first_air_date || ""}`}
                        data-cmdk-no-filter
                        onSelect={() => {
                          if (!pickSeries) onSelectSeries(series)
                        }}
                        className="mx-2 flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          <span className="truncate">{name}</span>
                          {original ? (
                            <span className="ml-1.5 truncate text-xs font-normal text-muted-foreground">
                              {original}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={`shrink-0 text-xs text-muted-foreground tabular-nums ${!pickSeries ? "ml-auto pl-3" : ""}`}
                        >
                          {series.first_air_date ? new Date(series.first_air_date).getFullYear() : "----"}
                        </span>
                        {pickSeries && (
                          <button
                            type="button"
                            className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
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
                      </CommandItem>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="start"
                      sideOffset={10}
                      className="w-[360px] overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl"
                    >
                      <div className="relative h-32 w-full">
                        {series.backdrop_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500/${series.backdrop_path}`}
                            alt={name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                        <div className="absolute left-3 top-full aspect-[2/3] h-[154px] w-auto -translate-y-1/4 overflow-hidden rounded border border-border bg-muted shadow-lg">
                          {series.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185/${series.poster_path}`}
                              alt={name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                        </div>
                      </div>
                      <div className="flex min-h-[126px] items-start gap-3 px-5 py-3">
                        <div className="w-24 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{name}</p>
                          {original ? (
                            <p className="truncate text-xs text-muted-foreground">{original}</p>
                          ) : null}
                          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                            {series.overview?.trim() || "Series description not available."}
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  )
                })
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </>
  )
}
