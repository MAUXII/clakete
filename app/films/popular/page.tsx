"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MovieCard } from "@/components/movies/movie-card";
import { MdOutlineKeyboardDoubleArrowUp } from "react-icons/md";
import { FaStarOfLife } from "react-icons/fa6";

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

export default function FilmsPopularPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
  }, []);

  async function fetchMovies() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("type", "popular");
      const response = await fetch(`/api/movies?${params.toString()}`);
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
      params.set("type", "popular");
      const response = await fetch(`/api/movies?${params.toString()}`);
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

  return (
    <div className="py-8 mt-20 px-4 w-full max-w-[1280px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-semibold ">Popular</h1>
          <span className="text-muted-foreground">Discover the most talked-about and trending films that are capturing audiences worldwide.</span>
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


