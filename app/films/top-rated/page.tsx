"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MovieCard } from "@/components/movies/movie-card";
import {
  FilmsCatalogShell,
  FilmsCatalogHeader,
  FilmsScrollToTopFab,
  FilmsSubNav,
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

export default function FilmsTopRatedPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
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
      params.set("type", "top_rated");
      const response = await fetch(`/api/movies?${params.toString()}`);
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
      params.set("type", "top_rated");
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
    <FilmsCatalogShell>
      <FilmsCatalogHeader
        eyebrow="Catalog"
        title="Top rated"
        description="Highest vote averages on TMDB — the crowd’s canon, with enough votes to mean something."
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