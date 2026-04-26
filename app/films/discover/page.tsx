"use client";

import { useEffect, useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MovieCard } from "@/components/movies/movie-card";
import { useGenres } from "@/hooks/use-genres";
import { useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FaStarOfLife } from "react-icons/fa6";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { MdOutlineKeyboardDoubleArrowUp } from "react-icons/md";
import { Slider } from "@/components/ui/slider";
import { IoOptions } from "react-icons/io5";
import { PiClover } from "react-icons/pi";

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
  const [totalMovies, setTotalMovies] = useState(0);
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
      setTotalMovies(data.total_results || 0);
      setPage(1);
      setHasMore(1 < data.total_pages);
    } catch {
      setMovies([]);
      setTotalMovies(0);
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
    <div className="py-8 mt-20 w-full max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-semibold ">Discover</h1>
          <span className="text-muted-foreground">Find movies by genre and more</span>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 bg-[#FF0048]/10 text-[#FF0048] border border-[#FF0048]/20 px-3 py-3 rounded-md font-medium hover:bg-[#FF0048]/20 transition-all"
            onClick={handleFeelingLucky}
            type="button"
            aria-label="I'm Feeling Lucky"
          >
            <PiClover className="w-5 h-5" />
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 bg-[#FF0048]/10 text-[#FF0048] border border-[#FF0048]/20 px-3 py-3 rounded-md font-medium hover:bg-[#FF0048]/20 transition-all">
                <IoOptions />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="max-w-sm w-full">
              <SheetHeader>
                <SheetTitle>Filter Movies</SheetTitle>
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
                      {genres.map(g => (
                        <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
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
                      onValueChange={v => setLocalVoteAverageLte(v[0])}
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
                      <SelectItem value="release_date.desc">Most recent</SelectItem>
                      <SelectItem value="release_date.asc">Oldest</SelectItem>
                      <SelectItem value="vote_average.desc">Highest rated</SelectItem>
                      <SelectItem value="vote_average.asc">Lowest rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button
                  className="mt-4 bg-[#FF0048] text-white rounded-md py-2 font-medium hover:bg-[#FF0048]/90 transition-all"
                  onClick={handleSaveFilters}
                  type="button"
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
      <FaStarOfLife className="mr-2" /> There are {totalMovies.toLocaleString()} films
      </span>
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...Array(18)].map((_, i) => (
            <Skeleton key={i} className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
            {loadingMore && 
              [...Array(20)].map((_, i) => (
                <Skeleton key={`loading-${i}`} className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden" />
              ))
            }
          </div>
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 bg-[#FF0048]/10 text-[#FF0048] p-3 rounded-md border border-black/10 dark:border-white/10 hover:opacity-90 hover:bg-[#FF0048]/20 hover:text-[#FF0048]/90 transition-all h-12 aspect-square flex items-center justify-center"
              aria-label="Scroll to top">
              <MdOutlineKeyboardDoubleArrowUp />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function FilmsDiscoverPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FilmsDiscoverContent />
    </Suspense>
  );
} 