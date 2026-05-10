"use client";

import { useEffect, useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MovieCard } from "@/components/movies/movie-card";
import { useGenres } from "@/hooks/use-genres";
import { useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { IoOptions } from "react-icons/io5";
import { PiClover } from "react-icons/pi";
import {
  FilmsCatalogShell,
  FilmsCatalogHeader,
  FilmsScrollToTopFab,
  FilmsSubNav,
  FilmsToolbarIconButton,
  filmsPosterGridClassName,
  filmsPosterSkeletonClassName,
} from "@/components/films/films-catalog-shell";
import { cn } from "@/lib/utils";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string | null;
  vote_average?: number;
  genres?: { id: number; name: string }[];
}

interface MoviesResponse {
  results: Movie[];
  page: number;
  total_pages: number;
  total_results: number;
}

function FilmsDiscoverContent() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { genres, loading: genresLoading } = useGenres();
  const genre = searchParams.get("genres") || "";
  const voteAverageLte = Number(searchParams.get("vote_average.lte") || 10);
  const sortBy = searchParams.get("sort_by") || "popularity.desc";
  const [open, setOpen] = useState(false);
  const [localGenre, setLocalGenre] = useState(genre);
  const [localVoteAverageLte, setLocalVoteAverageLte] = useState(voteAverageLte);
  const [localSortBy, setLocalSortBy] = useState(sortBy);

  useEffect(() => {
    if (open) {
      setLocalGenre(genre);
      setLocalVoteAverageLte(voteAverageLte);
      setLocalSortBy(sortBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowScrollTop(scrollTop > 500);
      const scrollHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrolledToBottom = Math.abs(scrollHeight - windowHeight - scrollTop) < 100;
      if (scrolledToBottom && !loading && !loadingMore && hasMore) {
        fetchMoreMovies();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, loading, loadingMore, hasMore, fetchMoreMovies]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, voteAverageLte, sortBy]);

  async function fetchMovies() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      if (genre) params.set("with_genres", genre);
      if (voteAverageLte < 10) params.set("vote_average.lte", voteAverageLte.toString());
      if (sortBy && sortBy !== "popularity.desc") params.set("sort_by", sortBy);
      const response = await fetch(`/api/movies/discover?${params.toString()}`);
      const data: MoviesResponse = await response.json();
      setMovies(Array.isArray(data.results) ? data.results : []);
      setPage(1);
      setHasMore(1 < data.total_pages);
    } catch {
      setMovies([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMoreMovies() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      params.set("page", nextPage.toString());
      if (genre) params.set("with_genres", genre);
      if (voteAverageLte < 10) params.set("vote_average.lte", voteAverageLte.toString());
      if (sortBy && sortBy !== "popularity.desc") params.set("sort_by", sortBy);
      const response = await fetch(`/api/movies/discover?${params.toString()}`);
      const data: MoviesResponse = await response.json();
      setMovies(prev => [...prev, ...(Array.isArray(data.results) ? data.results : [])]);
      setPage(nextPage);
      setHasMore(nextPage < data.total_pages);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleSaveFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (localGenre) {
      params.set("genres", localGenre);
    } else {
      params.delete("genres");
    }
    if (localVoteAverageLte < 10) {
      params.set("vote_average.lte", localVoteAverageLte.toString());
    } else {
      params.delete("vote_average.lte");
    }
    if (localSortBy && localSortBy !== "popularity.desc") {
      params.set("sort_by", localSortBy);
    } else {
      params.delete("sort_by");
    }
    setOpen(false);
    router.push(`/films/discover?${params.toString()}`);
  }

  // Função para buscar um filme popular aleatório e redirecionar
  async function handleFeelingLucky() {
    try {
      // Busca filmes populares (primeira página)
      const response = await fetch("/api/movies/discover?sort_by=popularity.desc&page=1");
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        // Escolhe um filme aleatório da lista
        const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
        if (randomMovie && randomMovie.id) {
          router.push(`/film/${randomMovie.id}`);
        }
      }
    } catch (error) {
      // Pode exibir um toast ou alert se quiser
      console.error("Erro ao buscar filme aleatório:", error);
    }
  }

  return (
    <FilmsCatalogShell>
      <FilmsCatalogHeader
        eyebrow="Catalog"
        title="Discover"
        description="Browse by genre, cap by rating and sort — filters apply to the full TMDB discover index."
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
                        <div className="px-3 py-2 text-muted-foreground text-sm">No genres found</div>
                      )}
                      {genres.map(g => (
                        <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
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
                      onValueChange={v => setLocalVoteAverageLte(v[0])}
                      className="w-full"
                    />
                    <span className="text-sm font-medium w-10 text-right">{localVoteAverageLte}</span>
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
                      <SelectItem value="release_date.desc">Most recent</SelectItem>
                      <SelectItem value="release_date.asc">Oldest</SelectItem>
                      <SelectItem value="vote_average.desc">Highest rated</SelectItem>
                      <SelectItem value="vote_average.asc">Lowest rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button
                  className="mt-2 rounded-xl bg-[#FF0048] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e60042]"
                  onClick={handleSaveFilters}
                  type="button"
                >
                  Apply filters
                </button>
              </div>
            </SheetContent>
          </Sheet>
          </>
        }
      />
      <FilmsSubNav />
      {loading ? (
        <div className={cn(filmsPosterGridClassName)}>
          {[...Array(18)].map((_, i) => (
            <Skeleton key={i} className={filmsPosterSkeletonClassName} />
          ))}
        </div>
      ) : (
        <>
          <div className={filmsPosterGridClassName}>
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
            {loadingMore &&
              [...Array(12)].map((_, i) => (
                <Skeleton key={`loading-${i}`} className={filmsPosterSkeletonClassName} />
              ))}
          </div>
          <FilmsScrollToTopFab visible={showScrollTop} onClick={scrollToTop} />
        </>
      )}
    </FilmsCatalogShell>
  );
}

export default function FilmsDiscoverPage() {
  return (
    <Suspense
      fallback={
        <FilmsCatalogShell>
          <div className="py-16 text-center text-sm text-zinc-500">Loading catalog…</div>
        </FilmsCatalogShell>
      }
    >
      <FilmsDiscoverContent />
    </Suspense>
  );
} 