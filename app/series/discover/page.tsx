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
  FilmsToolbarPillButton,
  filmsPosterGridClassName,
  filmsPosterSkeletonClassName,
  CatalogCardSkeleton,
} from "@/components/films/films-catalog-shell"
import { cn } from "@/lib/utils"
import { seriesHref } from "@/lib/media-href"
import { useLocalePrefs } from "@/hooks/use-locale-prefs"
import { useT } from "@/components/providers/i18n-provider"
import { useDesignMode } from "@/hooks/use-design-mode"

interface TvShow {
  id: number
  name: string
  original_name?: string | null
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  overview: string | null
  vote_average?: number
  genres?: { id: number; name: string }[]
  director?: string | null
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
  const { withLocale, localeQs, loading: localeLoading, tmdbLanguage, watchRegion } = useLocalePrefs()
  const { t } = useT()
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"
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
    if (localeLoading) return
    fetchShows()
  }, [genre, voteAverageLte, sortBy, localeLoading, tmdbLanguage, watchRegion])

  async function fetchShows() {
    setLoading(true)
    try {
      const params = withLocale()
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
      const params = withLocale()
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
      const response = await fetch(`/api/series/discover?sort_by=popularity.desc&page=1&${localeQs}`)
      const data = await response.json()
      if (data.results?.length) {
        const pick = data.results[Math.floor(Math.random() * data.results.length)]
        if (pick?.id)
          router.push(
            seriesHref({
              id: pick.id,
              name: pick.name,
              original_name: pick.original_name,
              first_air_date: pick.first_air_date,
            }),
          )
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <SeriesCatalogShell>
      <FilmsCatalogHeader
        eyebrow={t("catalog.catalogEyebrow")}
        title={isGlass ? "Descobrir séries" : t("catalog.discoverTitle")}
        description={isGlass ? "Navegue por gênero, limite por nota e ordene — os filtros valem para o índice discover do TMDB." : t("catalog.discoverDescriptionSeries")}
        actions={
          <>
            <FilmsToolbarIconButton onClick={handleFeelingLucky} aria-label={t("catalog.feelingLucky")}>
              <PiClover className="h-4 w-4" />
            </FilmsToolbarIconButton>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <FilmsToolbarPillButton aria-label={t("catalog.filters")}>
                  <IoOptions className="h-4 w-4" />
                  <span>{t("catalog.filters")}</span>
                </FilmsToolbarPillButton>
              </SheetTrigger>
              <SheetContent
                side="right"
                className={cn(
                  "w-full max-w-sm border-l text-foreground",
                  isGlass
                    ? "border-white/10 bg-[#161719]/96 text-white backdrop-blur-2xl"
                    : "border-border bg-card",
                )}
              >
                <SheetHeader>
                  <SheetTitle className={cn("text-left text-lg", isGlass ? "text-white font-semibold" : "text-foreground")}>
                    {t("catalog.filters")}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-5">
                  <div>
                    <label className={cn("mb-2 block text-xs font-medium uppercase tracking-wide", isGlass ? "text-white/40" : "text-muted-foreground")}>
                      {t("catalog.genre")}
                    </label>
                    <Select value={localGenre} onValueChange={setLocalGenre} disabled={genresLoading}>
                      <SelectTrigger className={cn(isGlass ? "border-white/10 bg-white/[0.04] text-white" : "border-border bg-white/[0.04]")}>
                        <SelectValue placeholder={genresLoading ? t("catalog.loadingGenres") : t("catalog.allGenres")} />
                      </SelectTrigger>
                      <SelectContent className={cn(isGlass && "border-white/10 bg-[#161719] text-white")}>
                        {genres.length === 0 && !genresLoading && (
                          <div className={cn("px-3 py-2 text-sm", isGlass ? "text-white/40" : "text-muted-foreground")}>{t("catalog.noGenres")}</div>
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
                    <label className={cn("mb-2 block text-xs font-medium uppercase tracking-wide", isGlass ? "text-white/40" : "text-muted-foreground")}>
                      {t("catalog.maxRating")}
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
                      <span className={cn("w-10 text-right text-sm font-medium", isGlass && "text-white")}>{localVoteAverageLte}</span>
                    </div>
                  </div>
                  <div>
                    <label className={cn("mb-2 block text-xs font-medium uppercase tracking-wide", isGlass ? "text-white/40" : "text-muted-foreground")}>
                      {t("catalog.sortBy")}
                    </label>
                    <Select value={localSortBy} onValueChange={setLocalSortBy}>
                      <SelectTrigger className={cn(isGlass ? "border-white/10 bg-white/[0.04] text-white" : "border-border bg-white/[0.04]")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={cn(isGlass && "border-white/10 bg-[#161719] text-white")}>
                        <SelectItem value="popularity.desc">{t("catalog.sortMostPopular")}</SelectItem>
                        <SelectItem value="popularity.asc">{t("catalog.sortLeastPopular")}</SelectItem>
                        <SelectItem value="first_air_date.desc">{t("catalog.sortMostRecent")}</SelectItem>
                        <SelectItem value="first_air_date.asc">{t("catalog.sortOldest")}</SelectItem>
                        <SelectItem value="vote_average.desc">{t("catalog.sortHighestRated")}</SelectItem>
                        <SelectItem value="vote_average.asc">{t("catalog.sortLowestRated")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "mt-2 rounded-xl py-3 text-sm font-semibold transition-colors",
                      isGlass
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-brand text-white hover:bg-brand-hover",
                    )}
                    onClick={handleSaveFilters}
                  >
                    {t("catalog.applyFilters")}
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
          {[...Array(12)].map((_, i) => (
            <CatalogCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className={filmsPosterGridClassName}>
            {shows.map((show) => (
              <SeriesCard key={show.id} series={show} />
            ))}
            {loadingMore &&
              [...Array(8)].map((_, i) => (
                <CatalogCardSkeleton key={`loading-${i}`} />
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
          <div className="py-16 text-center text-sm text-muted-foreground">Loading catalog…</div>
        </SeriesCatalogShell>
      }
    >
      <SeriesDiscoverContent />
    </Suspense>
  )
}
