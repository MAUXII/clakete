"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Series } from "@/types/series"
import { SeriesCard } from "@/components/series/series-card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface SeriesResponse {
  results: Series[]
}

function SeriesRow({
  title,
  subtitle,
  viewAllHref,
  items,
}: {
  title: string
  subtitle: string
  viewAllHref: string
  items: Series[]
}) {
  if (!items.length) return null

  return (
    <section className="mb-14 sm:mb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          View all →
        </Link>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="mt-8 w-full"
      >
        <CarouselContent className="-ml-3 sm:-ml-2">
          {items.map((show) => (
            <CarouselItem key={show.id} className="basis-1/3 pl-3 sm:basis-1/6 sm:pl-2">
              <SeriesCard series={show} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 z-10 h-7 w-7 border border-border bg-background/80 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground" />
        <CarouselNext className="right-2 z-10 h-7 w-7 border border-border bg-background/80 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground" />
      </Carousel>
    </section>
  )
}

export default function SeriesPage() {
  const [popular, setPopular] = useState<Series[]>([])
  const [trending, setTrending] = useState<Series[]>([])
  const [topRated, setTopRated] = useState<Series[]>([])
  const [onTheAir, setOnTheAir] = useState<Series[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [popRes, trendRes, topRes, airRes] = await Promise.all([
          fetch("/api/series?type=popular&page=1"),
          fetch("/api/series?type=trending_week&page=1"),
          fetch("/api/series?type=top_rated&page=1"),
          fetch("/api/series?type=on_the_air&page=1"),
        ])
        const [popData, trendData, topData, airData] = await Promise.all([
          popRes.json() as Promise<SeriesResponse>,
          trendRes.json() as Promise<SeriesResponse>,
          topRes.json() as Promise<SeriesResponse>,
          airRes.json() as Promise<SeriesResponse>,
        ])
        if (cancelled) return
        setPopular(Array.isArray(popData.results) ? popData.results.slice(0, 18) : [])
        setTrending(Array.isArray(trendData.results) ? trendData.results.slice(0, 18) : [])
        setTopRated(Array.isArray(topData.results) ? topData.results.slice(0, 18) : [])
        setOnTheAir(Array.isArray(airData.results) ? airData.results.slice(0, 18) : [])
      } catch {
        if (!cancelled) {
          setPopular([])
          setTrending([])
          setTopRated([])
          setOnTheAir([])
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="py-8 mt-20 w-full max-w-6xl">
      <div className="mb-10 sm:mb-12">
        <h1 className="text-3xl font-semibold sm:text-4xl">Series</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse popular, trending, and top-rated TV — same catalog flow as films, tuned for shows.
        </p>
      </div>

      <SeriesRow
        title="Popular on TV"
        subtitle="What everyone is watching right now."
        viewAllHref="/series/popular"
        items={popular}
      />
      <SeriesRow
        title="Trending this week"
        subtitle="Buzzworthy series climbing the charts."
        viewAllHref="/series/discover"
        items={trending}
      />
      <SeriesRow
        title="Top rated"
        subtitle="Critically acclaimed television worth your time."
        viewAllHref="/series/top-rated"
        items={topRated}
      />
      <SeriesRow
        title="On the air"
        subtitle="Episodes airing this week — stay current."
        viewAllHref="/series/upcoming"
        items={onTheAir}
      />
    </div>
  )
}
