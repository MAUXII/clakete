"use client";

import { useEffect, useState, use, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilmActions } from "@/components/movies/film-actions";
import { StarRating } from "@/components/movies/star-rating";
import { FilmReview } from "@/components/movies/film-review";
import { FilmReviewsList } from "@/components/movies/film-reviews-list";
import { useFilmInteractions } from "@/hooks/use-film-interactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WatchProviders from "@/components/movies/watchproviders";
import Trailer, { type Video } from "@/components/movies/trailer";
import { FaPlay } from "react-icons/fa6";
import CreditsList from "@/components/movies/credits";
import SimilarList from "@/components/movies/similar";
import RecommendationsList from "@/components/movies/recommendations";
import ImagesList from "@/components/movies/imagesList";
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  tagline: string | null;
  overview: string;
  runtime: number;
  images: {
    backdrops: Array<{ file_path: string }>;
    posters: Array<{ file_path: string }>;
  };
  director: string;
  similar: {
    results: Array<{
      title: string;
      poster_path: string;
      id: number;
    }>;
  };
  recommendations: {
    results: Array<{
      title: string;
      poster_path: string;
      id: number;
    }>;
  };
  cast: {
    character: string;
    name: string;
    profile_path: string;
    id: number;
  }[];
  crew: {
    department: string;
    name: string;
    profile_path: string;
    id: number;
    job: string;
  }[];
  vote_average: number;
  genres: { id: number; name: string }[];
  videos: {
    results: Video[];
  } | null;
  watchProviders: {
    results: {
      US?: {
        link: string;
        flatrate?: Array<{
          logo_path: string;
          provider_name: string;
          provider_id: number;
        }>;
        rent?: Array<{
          logo_path: string;
          provider_name: string;
          provider_id: number;
        }>;
        buy?: Array<{
          logo_path: string;
          provider_name: string;
          provider_id: number;
        }>;
      };
    };
  };
  trailer: {
    key: string;
    site: string;
    type: string;
    name: string;
  } | null;
}

function formatRuntime(minutes: number) {
  if (!minutes || minutes < 1) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">{children}</h2>
      <div className="h-px min-w-0 flex-1 bg-white/[0.08]" aria-hidden />
    </div>
  );
}

const FILM_LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)"
const FILM_POSTER_ALIGN_MARGIN = `max(-5rem, calc(min(92vw, 304px) * 0.75 + 8rem - ${FILM_LETTERBOX_HEIGHT}))`

export default function FilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [posterTrailerHover, setPosterTrailerHover] = useState(false);
  const [trailerBtnFocused, setTrailerBtnFocused] = useState(false);
  const filmId = parseInt(id);
  const {
    rating,
    review,
    isWatched,
    isLiked,
    isInWatchlist,
    loading: interactionsLoading,
    updating,
    setRating,
    setReview,
    toggleWatched,
    toggleLiked,
    toggleWatchlist,
  } = useFilmInteractions(filmId, movie?.poster_path, movie?.title, movie?.release_date, "movie");

  useEffect(() => {
    async function fetchMovie() {
      try {
        const response = await fetch(`/api/movies/${id}`);
        const data = await response.json();

        if (response.ok) {
          setMovie(data);
        } else {
          console.error("Error fetching movie:", data.error);
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-[#09090B]">
      <FilmsCatalogShell>
        <div
          className="relative left-1/2  z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#09090B]"
          style={{ height: FILM_LETTERBOX_HEIGHT }}
          aria-hidden
        />
        <div className="relative z-10 mt-0 flex flex-col gap-12 px-5 pt-2 sm:px-8 lg:flex-row lg:items-start lg:gap-16 lg:px-10 xl:gap-20">
          <div
            className="mx-auto flex w-full max-w-[260px] shrink-0 flex-col gap-3 self-start sm:max-w-[280px] lg:mx-0 lg:max-w-[304px]"
            style={{ marginTop: FILM_POSTER_ALIGN_MARGIN }}
          >
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="-mt-36 aspect-[2/3] w-full rounded-2xl" />
          </div>
          <div className="min-w-0 flex-1 space-y-6 pt-1">
            <div className="space-y-3">
              <Skeleton className="h-9 w-[min(100%,420px)]" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-24 w-full  rounded-lg" />
          </div>
        </div>
      </FilmsCatalogShell>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-[#09090B]">
      <FilmsCatalogShell>
        <h1 className="text-2xl font-semibold tracking-tight">Movie not found</h1>
        <Link
          href="/films/discover"
          className="-mt-10 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to catalog
        </Link>
      </FilmsCatalogShell>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder.png";
  const year = movie.release_date?.split("-")[0];
  const runtimeLabel = formatRuntime(movie.runtime);
  const metaLine = [year, runtimeLabel].filter(Boolean).join(" · ");
  const youtubeTrailer = movie.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  );
  const trailerPosterUiActive = posterTrailerHover || trailerBtnFocused;

  const tabListClass =
    "flex h-auto w-full flex-wrap gap-1 rounded-lg border border-white/[0.08] bg-transparent p-1 sm:grid sm:grid-cols-4 sm:gap-1";
  const tabTriggerClass = cn(
    "min-w-0 flex-1 rounded-md px-3 py-2.5 text-center text-sm font-medium text-zinc-500 transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    "data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#e8486b]",
    "hover:text-zinc-300",
  );

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#09090B]">
    <FilmsCatalogShell>
      <div
        className="pointer-events-none mt-[3.75rem] relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#09090B]"
        style={{ height: FILM_LETTERBOX_HEIGHT }}
        aria-hidden
      >
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.06),transparent_55%)]" />
        )}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.18)_0%,transparent_38%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/10"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,#09090B_0%,#09090B_0%,rgba(9,9,11,0.55)_32%,transparent_62%)]"
          aria-hidden
        />
        <img
          src="/noise.avif"
          alt=""
          className="pointer-events-none absolute inset-0 z-[4] h-full w-full object-cover opacity-[0.02]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex flex-col gap-12  pt-2 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
        <aside
          className="sticky top-[calc(env(safe-area-inset-top,0px)+12rem)] z-20 mx-auto w-full max-w-[260px] shrink-0 self-start sm:max-w-[280px] lg:mx-0 lg:max-w-[304px]"
          style={{ marginTop: FILM_POSTER_ALIGN_MARGIN }}
        >
          <div className="flex flex-col gap-3">
            <Link
              href="/films/discover"
              className="pointer-events-auto inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Back to catalog
            </Link>
            <div className="-mt-36  overflow-hidden rounded-2xl border border-white/[0.1] bg-zinc-950">
              <div
                className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950"
                onMouseEnter={() => {
                  if (youtubeTrailer) setPosterTrailerHover(true);
                }}
                onMouseLeave={() => setPosterTrailerHover(false)}
              >
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="absolute inset-0 block h-full w-full object-cover"
                />
                {youtubeTrailer ? (
                  <motion.button
                    type="button"
                    aria-label="Watch trailer"
                    initial={false}
                    animate={{
                      opacity: trailerPosterUiActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ pointerEvents: trailerPosterUiActive ? "auto" : "none" }}
                    className={cn(
                      "absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/10",
                      "outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                    )}
                    onClick={() => setTrailerOpen(true)}
                    onFocus={() => setTrailerBtnFocused(true)}
                    onBlur={() => setTrailerBtnFocused(false)}
                  >
                    <motion.span
                      className={cn(
                        "pointer-events-none inline-flex origin-center items-center gap-3 rounded-full border border-white/[0.08]",
                        "bg-zinc-950/50 px-1.5 py-1.5 pl-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-white/[0.05]",
                      )}
                      initial={false}
                      animate={
                        trailerPosterUiActive
                          ? { opacity: 1, scale: 1 }
                          : { opacity: 0, scale: 0 }
                      }
                      transition={{
                        duration: 0.4,
                        opacity: { duration: 0.4 },
                        scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
                      }}
                      whileTap={{ scale: 0.94 }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF0048] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                        <FaPlay className="ml-0.5 h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="pr-4 text-sm font-medium tracking-tight text-white/95">Trailer</span>
                    </motion.span>
                  </motion.button>
                ) : null}
              </div>
              <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} />
              <WatchProviders movie={movie} hideHeading omitTrailerButton />
            </div>
          </div>
        </aside>

        <div className="mt-6 flex min-w-0 flex-1 flex-col gap-12 sm:mt-8 lg:mt-8 lg:max-w-none">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12 xl:gap-16">
            <header className="min-w-0 max-w-xl space-y-4">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{movie.title}</h1>
              {movie.tagline ? (
                <p className="text-pretty text-sm leading-snug text-zinc-500 sm:text-[0.9375rem]">{movie.tagline}</p>
              ) : null}
              {movie.director ? (
                <p className="text-sm text-zinc-500">
                  <span className="text-foreground">Directed by</span> {movie.director}
                </p>
              ) : null}
            </header>

            {metaLine ? (
              <div className="w-full shrink-0 border-t border-white/[0.08] pt-6 text-sm tabular-nums text-zinc-400 sm:w-auto lg:border-t-0 lg:pt-1 lg:text-right">
                {metaLine}
              </div>
            ) : null}
          </div>

          {(movie.overview || (movie.genres && movie.genres.length > 0)) ? (
            <div className="-mt-2 flex flex-col gap-4">
              {movie.overview ? (
                <div>
                  <SectionLabel>Overview</SectionLabel>
                  <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-zinc-500 sm:text-[0.9375rem] lg:max-w-4xl">
                    {movie.overview}
                  </p>
                </div>
              ) : null}
              {movie.genres && movie.genres.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/films/discover?genres=${genre.id}`}
                      className="rounded-full bg-[#FF0048]/10 px-3 py-1 text-xs font-medium text-[#e8486b] ring-1 ring-[#e8486b]/35 transition-colors hover:bg-[#FF0048]/18 hover:ring-[#FF0048]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <section className="" aria-label="Your rating and actions">
            <div className="flex flex-col gap-8">
              <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <StarRating
                  initialRating={rating}
                  onRate={setRating}
                  readonly={loading || interactionsLoading || updating}
                />
                <FilmActions
                  filmId={movie.id}
                  isWatched={isWatched}
                  isLiked={isLiked}
                  isInWatchlist={isInWatchlist}
                  onWatchClick={toggleWatched}
                  onLikeClick={toggleLiked}
                  onWatchlistClick={toggleWatchlist}
                  loading={loading || interactionsLoading}
                  updating={updating}
                />
              </div>
              <FilmReview
                filmId={movie.id}
                initialReview={review}
                existingReview={review}
                onReviewSubmit={setReview}
                disabled={loading || interactionsLoading || updating}
              />
            </div>
          </section>

          <Tabs defaultValue="credits" className="w-full">
            <TabsList className={tabListClass}>
              <TabsTrigger className={tabTriggerClass} value="credits">
                Credits
              </TabsTrigger>
              <TabsTrigger className={tabTriggerClass} value="similar">
                Similar
              </TabsTrigger>
              <TabsTrigger className={tabTriggerClass} value="recommended">
                Recommended
              </TabsTrigger>
              <TabsTrigger className={tabTriggerClass} value="images">
                Images
              </TabsTrigger>
            </TabsList>
            <TabsContent className="mt-6 w-full outline-none" value="credits">
              <CreditsList cast={movie.cast || []} crew={movie.crew || []} />
            </TabsContent>
            <TabsContent className="mt-6 outline-none" value="similar">
              <SimilarList movie={movie} />
            </TabsContent>
            <TabsContent className="mt-6 outline-none" value="recommended">
              <RecommendationsList movie={movie} />
            </TabsContent>
            <TabsContent className="mt-6 outline-none" value="images">
              <ImagesList movie={movie} />
            </TabsContent>
          </Tabs>

          <div>
            <SectionLabel>Recent reviews</SectionLabel>
            <div className="mt-6">
              <FilmReviewsList filmId={movie.id} />
            </div>
          </div>
        </div>
      </div>
    </FilmsCatalogShell>
    </div>
  );
}
