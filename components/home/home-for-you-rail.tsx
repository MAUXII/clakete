"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useLocalePrefs } from "@/hooks/use-locale-prefs"
import { filmHref } from "@/lib/media-href"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useDesignMode } from "@/hooks/use-design-mode"

type DiscoverMovie = {
  id: number
  title: string
  original_title?: string | null
  poster_path: string | null
  release_date?: string | null
}

export function HomeForYouRail({
  genreIds,
  className,
}: {
  genreIds: number[]
  className?: string
}) {
  const { localeQs, loading: localeLoading } = useLocalePrefs()
  const [movies, setMovies] = useState<DiscoverMovie[]>([])
  const [loading, setLoading] = useState(true)
  const isGlass = useDesignMode() === "glass"

  useEffect(() => {
    if (localeLoading || !genreIds.length) {
      setMovies([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        const genres = genreIds.slice(0, 3).join("|")
        const res = await fetch(
          `/api/movies/discover?with_genres=${encodeURIComponent(genres)}&sort_by=popularity.desc&page=1&${localeQs}`,
        )
        if (!res.ok) throw new Error("discover failed")
        const data = (await res.json()) as { results?: DiscoverMovie[] }
        if (!cancelled) setMovies((data.results ?? []).slice(0, 12))
      } catch {
        if (!cancelled) setMovies([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [genreIds, localeLoading, localeQs])

  if (!genreIds.length) return null
  if (!loading && movies.length === 0) return null

  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      className={cn("w-full", className)}
    >
      <CarouselContent className="-ml-2">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <CarouselItem
                key={i}
                className="basis-[88px] pl-2 sm:basis-[100px]"
              >
                <Skeleton className="aspect-[2/3] w-full rounded-md" />
              </CarouselItem>
            ))
          : movies.map((movie) => (
              <CarouselItem
                key={movie.id}
                className="basis-[88px] pl-2 sm:basis-[100px]"
              >
                <Link
                  href={filmHref({
                    id: movie.id,
                    title: movie.title,
                    original_title: movie.original_title,
                    release_date: movie.release_date,
                  })}
                  className="block"
                >
                  <div
                    className={cn(
                      "aspect-[2/3] w-full overflow-hidden",
                      isGlass
                        ? "rounded-[12px] bg-white/[0.04] ring-1 ring-white/10"
                        : "rounded-md border border-border bg-muted",
                    )}
                  >
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
                          : "/placeholder.png"
                      }
                      alt={movie.title || ""}
                      className="size-full object-cover transition hover:opacity-90"
                    />
                  </div>
                </Link>
              </CarouselItem>
            ))}
      </CarouselContent>
    </Carousel>
  )
}
