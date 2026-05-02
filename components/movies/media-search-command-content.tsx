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
}: MediaSearchCommandContentProps) {
  const pickFilms = filmRowMode === "pick"
  const pickSeries = seriesRowMode === "pick"

  return (
    <>
      <DialogTitle className="flex items-center gap-2 text-sm" />
      <CommandInput
        placeholder={inputPlaceholder}
        value={query}
        onValueChange={onQueryChange}
        className={commandInputClassName}
      />
      <CommandList className={commandListClassName ?? "custom-scrollbar max-h-[460px]"}>
        {loading && <CommandEmpty>Searching...</CommandEmpty>}
        {!loading && filmResults.length === 0 && seriesResults.length === 0 && query && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {!loading && (filmResults.length > 0 || seriesResults.length > 0) && (
          <>
            <CommandGroup heading="Films" data-cmdk-no-filter>
              {filmResults.length === 0 ? (
                <CommandItem disabled className="mx-2 h-9 px-3 text-xs text-muted-foreground">
                  No films found
                </CommandItem>
              ) : (
                filmResults.map((movie) => (
                  <HoverCard key={`film-${movie.id}`} openDelay={120} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <CommandItem
                        value={`${movie.title || ""} ${movie.release_date || ""}`}
                        data-cmdk-no-filter
                        onSelect={() => {
                          if (!pickFilms) onSelectFilm(movie)
                        }}
                        className="mx-2 flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium"
                      >
                        <span className="min-w-0 flex-1 truncate">{movie.title}</span>
                        <span
                          className={`shrink-0 text-xs text-muted-foreground tabular-nums ${!pickFilms ? "ml-auto pl-3" : ""}`}
                        >
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : "----"}
                        </span>
                        {pickFilms && (
                          <button
                            type="button"
                            className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-[#FF0048]/40 hover:bg-[#FF0048]/10 hover:text-[#FF0048]"
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
                      className="w-[360px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0d13] p-0 text-white shadow-2xl"
                    >
                      <div className="relative h-32 w-full">
                        {movie.backdrop_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500/${movie.backdrop_path}`}
                            alt={movie.title || ""}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-zinc-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                        <div className="absolute left-3 top-full aspect-[2/3] h-[154px] w-auto -translate-y-1/4 overflow-hidden rounded border border-white/10 bg-zinc-900 shadow-lg">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185/${movie.poster_path}`}
                              alt={movie.title || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-zinc-800" />
                          )}
                        </div>
                      </div>
                      <div className="flex min-h-[126px] items-start gap-3 px-5 py-3">
                        <div className="w-24 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{movie.title}</p>
                          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-300">
                            {movie.overview?.trim() || "Sem descricao disponivel."}
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))
              )}
            </CommandGroup>
            <CommandGroup heading="Series" data-cmdk-no-filter>
              {seriesResults.length === 0 ? (
                <CommandItem disabled className="mx-2 h-9 px-3 text-xs text-muted-foreground">
                  No series found
                </CommandItem>
              ) : (
                seriesResults.map((series) => (
                  <HoverCard key={`series-${series.id}`} openDelay={120} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <CommandItem
                        value={`${series.name || ""} ${series.first_air_date || ""}`}
                        data-cmdk-no-filter
                        onSelect={() => {
                          if (!pickSeries) onSelectSeries(series)
                        }}
                        className="mx-2 flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium"
                      >
                        <span className="min-w-0 flex-1 truncate">{series.name}</span>
                        <span
                          className={`shrink-0 text-xs text-muted-foreground tabular-nums ${!pickSeries ? "ml-auto pl-3" : ""}`}
                        >
                          {series.first_air_date ? new Date(series.first_air_date).getFullYear() : "----"}
                        </span>
                        {pickSeries && (
                          <button
                            type="button"
                            className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-[#FF0048]/40 hover:bg-[#FF0048]/10 hover:text-[#FF0048]"
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
                      className="w-[360px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0d13] p-0 text-white shadow-2xl"
                    >
                      <div className="relative h-32 w-full">
                        {series.backdrop_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500/${series.backdrop_path}`}
                            alt={series.name || ""}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-zinc-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                        <div className="absolute left-3 top-full aspect-[2/3] h-[154px] w-auto -translate-y-1/4 overflow-hidden rounded border border-white/10 bg-zinc-900 shadow-lg">
                          {series.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185/${series.poster_path}`}
                              alt={series.name || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-zinc-800" />
                          )}
                        </div>
                      </div>
                      <div className="flex min-h-[126px] items-start gap-3 px-5 py-3">
                        <div className="w-24 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{series.name}</p>
                          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-300">
                            {series.overview?.trim() || "Series description not available."}
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </>
  )
}
