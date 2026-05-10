"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { SeriesCard } from "@/components/series/series-card"
import {
  SeriesCatalogShell,
  FilmsCatalogHeader,
  FilmsScrollToTopFab,
  SeriesSubNav,
  filmsPosterGridClassName,
  filmsPosterSkeletonClassName,
} from "@/components/films/films-catalog-shell"
import { cn } from "@/lib/utils"

interface TvShow {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  overview: string | null
  vote_average?: number
  genres?: { id: number; name: string }[]
}

interface SeriesResponse {
  results: TvShow[]
  page: number
  total_pages: number
  total_results: number
}

export default function SeriesPopularPage() {
  const [shows, setShows] = useState<TvShow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setShowScrollTop(scrollTop > 500)
      const scrollHeight = document.documentElement.scrollHeight
      const windowHeight = window.innerHeight
      const scrolledToBottom = Math.abs(scrollHeight - windowHeight - scrollTop) < 100
      if (scrolledToBottom && !loading && !loadingMore && hasMore) {
        fetchMoreShows()
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [page, loading, loadingMore, hasMore, fetchMoreShows])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    fetchShows()
  }, [])

  async function fetchShows() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", "1")
      params.set("type", "popular")
      const response = await fetch(`/api/series?${params.toString()}`)
      const data: SeriesResponse = await response.json()
      setShows(Array.isArray(data.results) ? data.results : [])
      setPage(1)
      setHasMore(1 < data.total_pages)
    } catch {
      setShows([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMoreShows() {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const params = new URLSearchParams()
      params.set("page", nextPage.toString())
      params.set("type", "popular")
      const response = await fetch(`/api/series?${params.toString()}`)
      const data: SeriesResponse = await response.json()
      setShows((prev) => [...prev, ...(Array.isArray(data.results) ? data.results : [])])
      setPage(nextPage)
      setHasMore(nextPage < data.total_pages)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <SeriesCatalogShell>
      <FilmsCatalogHeader
        eyebrow="Catalog"
        title="Popular"
        description="What people are watching right now — buzzy TV from TMDB’s popularity index."
      />
      <SeriesSubNav />
      {loading ? (
        <div className={cn(filmsPosterGridClassName)}>
          {[...Array(18)].map((_, i) => (
            <Skeleton key={i} className={filmsPosterSkeletonClassName} />
          ))}
        </div>
      ) : (
        <>
          <div className={filmsPosterGridClassName}>
            {shows.map((show) => (
              <SeriesCard key={show.id} series={show} />
            ))}
            {loadingMore &&
              [...Array(12)].map((_, i) => (
                <Skeleton key={`loading-${i}`} className={filmsPosterSkeletonClassName} />
              ))}
          </div>
          <FilmsScrollToTopFab visible={showScrollTop} onClick={scrollToTop} />
        </>
      )}
    </SeriesCatalogShell>
  )
}
