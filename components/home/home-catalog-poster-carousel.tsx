"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Skeleton } from "@/components/ui/skeleton"
import { filmHref } from "@/lib/media-href"
import { cn } from "@/lib/utils"
import type { Movie } from "@/types/movie"
import { useDesignMode } from "@/hooks/use-design-mode"

const itemBasis = "basis-[42%] pl-2 sm:basis-[38%] lg:basis-[72%]"
const glassPoster =
  "rounded-[12px] bg-white/[0.04] ring-1 ring-white/10 shadow-[0_14px_32px_-14px_rgba(0,0,0,0.9)]"
const classicPoster = "rounded-lg border border-border bg-muted shadow-sm"

function PosterSkeletonItems({ count = 3 }: { count?: number }) {
  const isGlass = useDesignMode() === "glass"
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CarouselItem key={i} className={itemBasis}>
          <Skeleton
            className={cn(
              "aspect-[2/3] w-full",
              isGlass ? glassPoster : "rounded-lg border border-border",
            )}
          />
        </CarouselItem>
      ))}
    </>
  )
}

/** Horizontal poster rail for the home feed left column — larger cards, auto-advances. */
export function HomeCatalogPosterCarousel({
  movies,
  className,
  intervalMs = 3200,
  loading = false,
}: {
  movies: Movie[]
  className?: string
  intervalMs?: number
  loading?: boolean
}) {
  const [api, setApi] = useState<CarouselApi>()
  const [paused, setPaused] = useState(false)
  const isGlass = useDesignMode() === "glass"
  const posterShell = isGlass ? glassPoster : classicPoster

  useEffect(() => {
    if (!api || paused || loading || movies.length < 2) return
    const id = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext()
      else api.scrollTo(0)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [api, intervalMs, loading, movies.length, paused])

  if (!loading && movies.length === 0) return null

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
        opts={{ align: "start", loop: !loading, dragFree: true }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {loading ? (
            <PosterSkeletonItems />
          ) : (
            movies.map((movie) => (
              <CarouselItem key={movie.id} className={itemBasis}>
                <Link
                  href={filmHref({
                    id: movie.id,
                    title: movie.title,
                    original_title: movie.original_title,
                    release_date: movie.release_date,
                  })}
                  className="group block"
                >
                  <div className={cn("relative aspect-[2/3] overflow-hidden", posterShell)}>
                    <CatalogPosterImage
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                          : "/placeholder.png"
                      }
                      alt={movie.title || "Poster"}
                    />
                  </div>
                </Link>
              </CarouselItem>
            ))
          )}
        </CarouselContent>
      </Carousel>
    </div>
  )
}

function CatalogPosterImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {!loaded ? (
        <Skeleton className="absolute inset-0 rounded-none" aria-hidden />
      ) : null}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100",
          loaded ? "opacity-95" : "opacity-0",
        )}
      />
    </>
  )
}
