"use client"

import { useEffect, useState, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { SeriesCard } from "@/components/series/series-card"
import { useTvGenres } from "@/hooks/use-tv-genres"
import { useRouter, useSearchParams } from "next/navigation"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FaStarOfLife } from "react-icons/fa6"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { MdOutlineKeyboardDoubleArrowUp } from "react-icons/md"
import { Slider } from "@/components/ui/slider"
import { IoOptions } from "react-icons/io5"

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
  const [totalSeries, setTotalSeries] = useState(0)
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
      setTotalSeries(data.total_results || 0)
      setPage(1)
      setHasMore(1 < data.total_pages)
    } catch {
      setShows([])
      setTotalSeries(0)
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

  return (
    <div className="py-8 mt-20 w-full max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-semibold ">Discover</h1>
          <span className="text-muted-foreground">Find TV series by genre and more</span>
        </div>
        <div className="flex gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 bg-[#FF0048]/10 text-[#FF0048] border border-[#FF0048]/20 px-3 py-3 rounded-md font-medium hover:bg-[#FF0048]/20 transition-all"
              >
                <IoOptions />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="max-w-sm w-full">
              <SheetHeader>
                <SheetTitle>Filter TV shows</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Genre</label>
                  <Select value={localGenre} onValueChange={setLocalGenre} disabled={genresLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={genresLoading ? "Loading genres..." : "All genres"} />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.length === 0 && !genresLoading && (
                        <div className="px-3 py-2 text-muted-foreground text-sm">No genres found</div>
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
                  <label className="block text-sm font-medium mb-1">Max rating</label>
                  <div className="flex items-center gap-2">
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={[localVoteAverageLte]}
                      onValueChange={(v) => setLocalVoteAverageLte(v[0])}
                      className="w-full"
                    />
                    <span className="text-sm font-medium w-10 text-right">{localVoteAverageLte}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sort by</label>
                  <Select value={localSortBy} onValueChange={setLocalSortBy}>
                    <SelectTrigger>
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
                  className="mt-4 bg-[#FF0048] text-white rounded-md py-2 font-medium hover:bg-[#FF0048]/90 transition-all"
                  onClick={handleSaveFilters}
                >
                  Save changes
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="bg-muted-foreground/20 w-full h-[0.8px] mb-4"></div>
      <span className="w-full font-medium bg-[#FF0048]/10 text-[#FF0048]/70  h-auto border border-black/10 dark:border-white/10 py-3 rounded-md mb-8 flex items-center justify-center">
        <FaStarOfLife className="mr-2" /> There are {totalSeries.toLocaleString()} series
      </span>
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...Array(18)].map((_, i) => (
            <Skeleton
              key={i}
              className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {shows.map((show) => (
              <SeriesCard key={show.id} series={show} />
            ))}
            {loadingMore &&
              [...Array(20)].map((_, i) => (
                <Skeleton
                  key={`loading-${i}`}
                  className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden"
                />
              ))}
          </div>
          {showScrollTop && (
            <button
              type="button"
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 bg-[#FF0048]/10 text-[#FF0048] p-3 rounded-md border border-black/10 dark:border-white/10 hover:opacity-90 hover:bg-[#FF0048]/20 hover:text-[#FF0048]/90 transition-all h-12 aspect-square flex items-center justify-center"
              aria-label="Scroll to top"
            >
              <MdOutlineKeyboardDoubleArrowUp />
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default function SeriesDiscoverPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SeriesDiscoverContent />
    </Suspense>
  )
}
