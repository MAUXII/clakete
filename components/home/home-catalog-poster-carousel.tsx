"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { filmHref } from "@/lib/media-href"
import { cn } from "@/lib/utils"
import type { Movie } from "@/types/movie"

/** Horizontal poster rail for the home feed left column — larger cards, auto-advances. */
export function HomeCatalogPosterCarousel({
  movies,
  className,
  intervalMs = 3200,
}: {
  movies: Movie[]
  className?: string
  intervalMs?: number
}) {
  const [api, setApi] = useState<CarouselApi>()
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!api || paused || movies.length < 2) return
    const id = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext()
      else api.scrollTo(0)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [api, intervalMs, movies.length, paused])

  if (movies.length === 0) return null

  return (
    <div
      className={cn("min-w-0", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <Carousel
        opts={{ align: "start", loop: true, dragFree: true }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {movies.map((movie) => (
            <CarouselItem
              key={movie.id}
              className="basis-[42%] pl-2 sm:basis-[38%] lg:basis-[72%]"
            >
              <Link
                href={filmHref({
                  id: movie.id,
                  title: movie.title,
                  original_title: movie.original_title,
                  release_date: movie.release_date,
                })}
                className="group block"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                        : "/placeholder.png"
                    }
                    alt={movie.title || "Poster"}
                    className="h-full w-full object-cover opacity-95 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100"
                  />
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
