"use client"

import { useEffect, useState, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { SeriesCard } from "@/components/series/series-card"
import { useTvGenres } from "@/hooks/use-tv-genres"
import { useRouter, useSearchParams } from "next/navigation"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { IoOptions } from "react-icons/io5"
import { PiClover } from "react-icons/pi"
import {
  SeriesCatalogShell,
  FilmsCatalogHeader,
  FilmsScrollToTopFab,
  SeriesSubNav,
  FilmsToolbarIconButton,
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

function SeriesDiscoverContent() {
  const [shows, setShows] = useState<TvShow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { genres, loading: genresLoading } = useTvGenres()
  const genre = searchParams.get("genres") || ""
  const voteAverageLte = Number(searchParams.get("vote_average.lte") || 10)
  const sortBy = searchParams.get("sort_by") || "popularity.desc"
  const [open, setOpen] = useState(false)
  const [localGenre, setLocalGenre] = useState(genre)
  const [localVoteAverageLte, setLocalVoteAverageLte] = useState(voteAverageLte)
  const [localSortBy, setLocalSortBy] = useState(sortBy)

  useEffect(() => {
    if (open) {
      setLocalGenre(genre)
      setLocalVoteAverageLte(voteAverageLte)
      setLocalSortBy(sortBy)
    }
  }, [open, genre, voteAverageLte, sortBy])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, voteAverageLte, sortBy])

  async function fetchShows() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", "1")
      if (genre) params.set("with_genres", genre)
      if (voteAverageLte < 10) params.set("vote_average.lte", voteAverageLte.toString())
      if (sortBy && sortBy !== "popularity.desc") params.set("sort_by", sortBy)
      const response = await fetch(`/api/series/discover?${params.toString()}`)
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
      if (genre) params.set("with_genres", genre)
      if (voteAverageLte < 10) params.set("vote_average.lte", voteAverageLte.toString())
      if (sortBy && sortBy !== "popularity.desc") params.set("sort_by", sortBy)
      const response = await fetch(`/api/series/discover?${params.toString()}`)
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

  function handleSaveFilters() {
    const params = new URLSearchParams(searchParams.toString())
    if (localGenre) {
      params.set("genres", localGenre)
    } else {
      params.delete("genres")
    }
    if (localVoteAverageLte < 10) {
      params.set("vote_average.lte", localVoteAverageLte.toString())
    } else {
      params.delete("vote_average.lte")
    }
    if (localSortBy && localSortBy !== "popularity.desc") {
      params.set("sort_by", localSortBy)
    } else {
      params.delete("sort_by")
    }
    setOpen(false)
    router.push(`/series/discover?${params.toString()}`)
  }

  async function handleFeelingLucky() {
    try {
      const response = await fetch("/api/series/discover?sort_by=popularity.desc&page=1")
      const data = await response.json()
      if (data.results?.length) {
        const pick = data.results[Math.floor(Math.random() * data.results.length)]
        if (pick?.id) router.push(`/series/${pick.id}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <SeriesCatalogShell>
      <FilmsCatalogHeader
        eyebrow="Catalog"
        title="Discover"
        description="Browse TV by genre, cap by rating and sort — same discover index as TMDB, tuned for series."
        actions={
          <>
            <FilmsToolbarIconButton onClick={handleFeelingLucky} aria-label="I'm feeling lucky">
              <PiClover className="h-5 w-5" />
            </FilmsToolbarIconButton>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <FilmsToolbarIconButton aria-label="Filters">
                  <IoOptions className="h-5 w-5" />
                </FilmsToolbarIconButton>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full max-w-sm border-l border-white/10 bg-zinc-950 text-zinc-100"
              >
                <SheetHeader>
                  <SheetTitle className="text-left text-lg text-zinc-50">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Genre
                    </label>
                    <Select value={localGenre} onValueChange={setLocalGenre} disabled={genresLoading}>
                      <SelectTrigger className="border-white/10 bg-white/[0.04]">
                        <SelectValue placeholder={genresLoading ? "Loading genres..." : "All genres"} />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.length === 0 && !genresLoading && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No genres found</div>
                        )}
                        {genres.map((g) => (
                          <SelectItem key={g.id} value={g.id.toString()}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Max rating
                    </label>
                    <div className="flex items-center gap-2">
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[localVoteAverageLte]}
                        onValueChange={(v) => setLocalVoteAverageLte(v[0])}
                        className="w-full"
                      />
                      <span className="w-10 text-right text-sm font-medium">{localVoteAverageLte}</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Sort by
                    </label>
                    <Select value={localSortBy} onValueChange={setLocalSortBy}>
                      <SelectTrigger className="border-white/10 bg-white/[0.04]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity.desc">Most popular</SelectItem>
                        <SelectItem value="popularity.asc">Least popular</SelectItem>
                        <SelectItem value="first_air_date.desc">Most recent</SelectItem>
                        <SelectItem value="first_air_date.asc">Oldest</SelectItem>
                        <SelectItem value="vote_average.desc">Highest rated</SelectItem>
                        <SelectItem value="vote_average.asc">Lowest rated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="button"
                    className="mt-2 rounded-xl bg-[#FF0048] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e60042]"
                    onClick={handleSaveFilters}
                  >
                    Apply filters
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </>
        }
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

export default function SeriesDiscoverPage() {
  return (
    <Suspense
      fallback={
        <SeriesCatalogShell>
          <div className="py-16 text-center text-sm text-zinc-500">Loading catalog…</div>
        </SeriesCatalogShell>
      }
    >
      <SeriesDiscoverContent />
    </Suspense>
  )
}
