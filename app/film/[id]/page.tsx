"use client";

import { useEffect, useState, use, type ReactNode, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilmActions } from "@/components/movies/film-actions";
import { LogWatchDialog } from "@/components/movies/log-watch-dialog";
import { ConfirmUnwatchDialog } from "@/components/movies/confirm-unwatch-dialog";
import { ShareCardDialog } from "@/components/movies/share-card-dialog";
import { StarRating } from "@/components/movies/star-rating";
import { FilmReviewsList } from "@/components/movies/film-reviews-list";
import { useFilmInteractions } from "@/hooks/use-film-interactions";
import { formatRewatchLabel, formatWatchedDate } from "@/lib/watched-date";
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
import { useLocalePrefs } from "@/hooks/use-locale-prefs";
import type { TmdbRegionProviders } from "@/lib/locale-prefs";
import { useT } from "@/components/providers/i18n-provider";
import { filmHref, parseMediaParam } from "@/lib/media-href";
import { prefetchDiaryArt } from "@/lib/client/diary-dialog-art";
import { toast } from "sonner";

export interface Movie {
  id: number;
  title: string;
  original_title?: string | null;
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
      original_title?: string | null;
      poster_path: string;
      id: number;
      release_date?: string | null;
    }>;
  };
  recommendations: {
    results: Array<{
      title: string;
      original_title?: string | null;
      poster_path: string;
      id: number;
      release_date?: string | null;
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
    results: Record<string, TmdbRegionProviders>;
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
      <h2 className="shrink-0 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{children}</h2>
      <div className="h-px min-w-0 flex-1 bg-muted" aria-hidden />
    </div>
  );
}

const FILM_LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)"
const FILM_POSTER_ALIGN_MARGIN = `max(-5rem, calc(min(92vw, 304px) * 0.75 + 8rem - ${FILM_LETTERBOX_HEIGHT}))`

export default function FilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawParam } = use(params);
  const parsed = parseMediaParam(rawParam);
  const router = useRouter();
  const { t } = useT();
  const [filmId, setFilmId] = useState<number | null>(
    parsed?.kind === "id" ? parsed.id : null,
  );
  const [resolveFailed, setResolveFailed] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [posterTrailerHover, setPosterTrailerHover] = useState(false);
  const [trailerBtnFocused, setTrailerBtnFocused] = useState(false);
  const [logWatchOpen, setLogWatchOpen] = useState(false);
  const [unwatchOpen, setUnwatchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { tmdbLanguage, loading: localeLoading } = useLocalePrefs();
  const {
    rating,
    review,
    isWatched,
    isLiked,
    isInWatchlist,
    watchedDate,
    rewatchCount,
    loading: interactionsLoading,
    updating,
    setRating,
    logWatch,
    removeFromDiary,
    unwatch,
    toggleWatched,
    toggleLiked,
    toggleWatchlist,
    hasDiaryLogs,
  } = useFilmInteractions(
    filmId ?? 0,
    movie?.poster_path,
    movie?.title,
    movie?.release_date,
    "movie",
    movie?.original_title,
  );

  // Resolve Letterboxd-style slug → TMDB id (or use id from legacy URLs).
  useEffect(() => {
    if (!parsed) {
      setResolveFailed(true);
      setLoading(false);
      return;
    }
    if (parsed.kind === "id") {
      setFilmId(parsed.id);
      setResolveFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setResolveFailed(false);
    void fetch(`/api/movies/resolve?slug=${encodeURIComponent(parsed.slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not found")
        const data = (await res.json()) as { id?: number; slug?: string }
        if (cancelled) return
        if (data.id) {
          setFilmId(data.id)
          if (data.slug && data.slug !== parsed.slug) {
            router.replace(`/film/${data.slug}`)
          }
        } else setResolveFailed(true)
      })
      .catch(() => {
        if (!cancelled) setResolveFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [rawParam]);

  useEffect(() => {
    if (localeLoading || filmId == null) return;

    let cancelled = false;
    async function fetchMovie() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/movies/${filmId}?language=${encodeURIComponent(tmdbLanguage)}`,
        );
        const data = await response.json();

        if (cancelled) return;
        if (response.ok) {
          setMovie(data);
        } else {
          console.error("Error fetching movie:", data.error);
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchMovie();
    return () => {
      cancelled = true;
    };
  }, [filmId, tmdbLanguage, localeLoading]);

  // Canonicalize → plain slug when unique / primary, or `title-year` for remakes.
  useEffect(() => {
    if (!movie?.id) return;
    const canonical = filmHref({
      id: movie.id,
      original_title: movie.original_title,
      title: movie.title,
      release_date: movie.release_date,
    });
    // Prefer server-side Letterboxd rule (strip year for primary / unique titles).
    const probe = canonical.replace(/^\/film\//, "");
    let cancelled = false;
    void fetch(`/api/movies/resolve?slug=${encodeURIComponent(probe)}`)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { id?: number; slug?: string };
        if (!data.slug || data.id !== movie.id) return;
        const next = `/film/${data.slug}`;
        if (`/film/${rawParam}` !== next) router.replace(next);
      })
      .catch(() => {
        if (`/film/${rawParam}` !== canonical) router.replace(canonical);
      });
    return () => {
      cancelled = true;
    };
  }, [movie, rawParam, router]);

  if (resolveFailed || (!loading && filmId == null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Filme não encontrado
      </div>
    );
  }

  if (loading || filmId == null) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-background">
        <FilmsCatalogShell>
          <div
            className="pointer-events-none relative left-1/2 z-0 mt-[3.75rem] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-background"
            style={{ height: FILM_LETTERBOX_HEIGHT }}
            aria-hidden
          >
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            <div
              className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background))_0%,hsl(var(--background)/0.55)_32%,transparent_62%)]"
              aria-hidden
            />
          </div>

          <div className="relative z-10 flex flex-col gap-12 pt-2 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
            <aside
              className="z-20 w-full shrink-0 self-start -mt-20 sm:-mt-24 lg:mx-0 lg:max-w-[304px] lg:[margin-top:var(--poster-mt)]"
              style={{ "--poster-mt": FILM_POSTER_ALIGN_MARGIN } as CSSProperties}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-end gap-4 lg:block">
                  <div className="w-[44%] max-w-[210px] shrink-0 lg:w-full lg:max-w-none">
                    <div className="overflow-hidden rounded-2xl border border-border bg-card lg:-mt-36">
                      <Skeleton className="aspect-[2/3] w-full rounded-none" />
                      <div className="hidden space-y-2 border-t border-border p-3 lg:block">
                        <Skeleton className="h-3 w-20" />
                        <div className="flex gap-2">
                          <Skeleton className="size-9 rounded-full" />
                          <Skeleton className="size-9 rounded-full" />
                          <Skeleton className="size-9 rounded-full" />
                          <Skeleton className="size-9 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2 pb-1 lg:hidden">
                    <Skeleton className="h-7 w-[92%]" />
                    <Skeleton className="h-3 w-[70%]" />
                    <Skeleton className="h-3 w-[55%]" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </aside>

            <div className="mt-6 flex min-w-0 flex-1 flex-col gap-12 sm:mt-8 lg:mt-8 lg:max-w-none">
              <div className="hidden flex-col gap-8 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-12 xl:gap-16">
                <div className="min-w-0 max-w-xl space-y-4">
                  <Skeleton className="h-10 w-[min(100%,420px)]" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="mt-1 h-4 w-28" />
              </div>

              <div className="-mt-2 flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-2.5 w-16 shrink-0" />
                    <div className="h-px min-w-0 flex-1 bg-muted" aria-hidden />
                  </div>
                  <div className="mt-4 max-w-3xl space-y-2 lg:max-w-4xl">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[72%]" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                </div>
              </div>

              <section className="flex flex-col gap-8" aria-hidden>
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <Skeleton className="h-8 w-40" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full rounded-lg" />
              </section>

              <div className="w-full space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  <Skeleton className="aspect-[2/3] w-full rounded-md" />
                  <Skeleton className="aspect-[2/3] w-full rounded-md" />
                  <Skeleton className="aspect-[2/3] w-full rounded-md" />
                  <Skeleton className="hidden aspect-[2/3] w-full rounded-md sm:block" />
                  <Skeleton className="hidden aspect-[2/3] w-full rounded-md md:block" />
                </div>
              </div>
            </div>
          </div>
        </FilmsCatalogShell>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-background">
      <FilmsCatalogShell>
        <h1 className="text-2xl font-semibold tracking-tight">{t("film.notFound")}</h1>
        <Link
          href="/films/discover"
          className="-mt-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {t("film.backToCatalog")}
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
    "flex h-auto w-full flex-wrap gap-1 rounded-lg border border-border bg-transparent p-1 sm:grid sm:grid-cols-4 sm:gap-1";
  const tabTriggerClass = cn(
    "min-w-0 flex-1 rounded-md px-3 py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    "data-[state=active]:bg-brand/10 data-[state=active]:text-brand-muted",
    "hover:text-muted-foreground",
  );

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-background">
    <FilmsCatalogShell>
      <div
        className="pointer-events-none mt-[3.75rem] relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-background"
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
          className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0.18)_0%,transparent_38%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/10"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background))_0%,hsl(var(--background)/0.55)_32%,transparent_62%)]"
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
          className="z-20 w-full shrink-0 self-start -mt-20 sm:-mt-24 lg:mx-0 lg:max-w-[304px] lg:[margin-top:var(--poster-mt)] lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)+12rem)]"
          style={{ "--poster-mt": FILM_POSTER_ALIGN_MARGIN } as CSSProperties}
        >
          <div className="flex flex-col gap-3">
            <Link
              href="/films/discover"
              className="pointer-events-auto inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              {t("film.backToCatalog")}
            </Link>
            {/* Mobile: poster left + title/meta right. Desktop: poster only. */}
            <div className="flex items-end gap-4 lg:block">
              <div className="w-[44%] max-w-[210px] shrink-0 lg:w-full lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-border bg-card lg:-mt-36">
              <div
                className="relative aspect-[2/3] w-full overflow-hidden bg-card"
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
                      "outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                    onClick={() => setTrailerOpen(true)}
                    onFocus={() => setTrailerBtnFocused(true)}
                    onBlur={() => setTrailerBtnFocused(false)}
                  >
                    <motion.span
                      className={cn(
                        "pointer-events-none inline-flex origin-center items-center gap-3 rounded-full border border-border",
                        "bg-muted/50 px-1.5 py-1.5 pl-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-border",
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
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                        <FaPlay className="ml-0.5 h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="pr-4 text-sm font-medium tracking-tight text-foreground">
                        {t("film.trailer")}
                      </span>
                    </motion.span>
                  </motion.button>
                ) : null}
              </div>
              <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} />
              <div className="hidden border-t border-border lg:block">
                <WatchProviders movie={movie} hideHeading omitTrailerButton />
              </div>
            </div>
              </div>
              {/* Mobile-only meta beside the poster */}
              <div className="min-w-0 flex-1 space-y-2 pb-1 lg:hidden">
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
                  {movie.title}
                </h1>
                {movie.tagline ? (
                  <p className="text-pretty text-xs leading-snug text-muted-foreground">{movie.tagline}</p>
                ) : null}
                {movie.director ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground">{t("film.directedBy")}</span> {movie.director}
                  </p>
                ) : null}
                {metaLine ? (
                  <p className="text-xs tabular-nums text-muted-foreground">{metaLine}</p>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <div className="mt-6 flex min-w-0 flex-1 flex-col gap-12 sm:mt-8 lg:mt-8 lg:max-w-none">
          <div className="hidden flex-col gap-8 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-12 xl:gap-16">
            <header className="min-w-0 max-w-xl space-y-4">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{movie.title}</h1>
              {movie.tagline ? (
                <p className="text-pretty text-sm leading-snug text-muted-foreground sm:text-[0.9375rem]">{movie.tagline}</p>
              ) : null}
              {movie.director ? (
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground">{t("film.directedBy")}</span> {movie.director}
                </p>
              ) : null}
            </header>

            {metaLine ? (
              <div className="w-full shrink-0 border-t border-border pt-6 text-sm tabular-nums text-muted-foreground sm:w-auto lg:border-t-0 lg:pt-1 lg:text-right">
                {metaLine}
              </div>
            ) : null}
          </div>

          {(movie.overview || (movie.genres && movie.genres.length > 0)) ? (
            <div className="-mt-2 flex flex-col gap-4">
              {movie.overview ? (
                <div>
                  <SectionLabel>{t("film.overview")}</SectionLabel>
                  <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] lg:max-w-4xl">
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
                      className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-muted ring-1 ring-brand-muted/35 transition-colors hover:bg-brand/18 hover:ring-brand/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  onWatchClick={async () => {
                    const result = await toggleWatched();
                    if (result === "needs-unwatch-confirm") {
                      setUnwatchOpen(true);
                      return;
                    }
                    toast.success(t("watch.markedWatched"));
                  }}
                  onLogDiaryClick={() => {
                    void prefetchDiaryArt("movie", movie.id, movie.poster_path);
                    setLogWatchOpen(true);
                  }}
                  onLikeClick={toggleLiked}
                  onWatchlistClick={toggleWatchlist}
                  onShareClick={() => setShareOpen(true)}
                  loading={loading || interactionsLoading}
                  updating={updating}
                />
              </div>
              {isWatched && (watchedDate || rewatchCount > 0) ? (
                <p className="-mt-4 text-sm text-muted-foreground">
                  {formatWatchedDate(watchedDate)
                    ? t("film.watchedOn", { date: formatWatchedDate(watchedDate)! })
                    : t("film.watched")}
                  {formatRewatchLabel(rewatchCount)
                    ? ` · ${formatRewatchLabel(rewatchCount)}`
                    : null}
                </p>
              ) : null}
              {review?.trim() ? (
                <div className="rounded-md border border-border bg-muted/50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {review}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <LogWatchDialog
            open={logWatchOpen}
            onOpenChange={setLogWatchOpen}
            title={movie.title}
            year={movie.release_date?.slice(0, 4) ?? null}
            posterPath={movie.poster_path}
            backdropPath={movie.backdrop_path}
            tmdbId={movie.id}
            mediaType="movie"
            isWatched={isWatched}
            isLiked={isLiked}
            watchedDate={watchedDate}
            rewatchCount={rewatchCount}
            hasDiaryLogs={hasDiaryLogs}
            initialRating={rating}
            initialReview={review}
            loading={updating}
            onLog={async (payload) => {
              await logWatch(payload);
              toast.success(
                payload.shareToFeed
                  ? t("watch.sharedToFeed")
                  : isWatched && payload.isRewatch
                    ? t("watch.rewatchSaved")
                    : t("watch.savedToDiary"),
              );
            }}
            onRemoveFromDiary={hasDiaryLogs ? removeFromDiary : undefined}
          />

          <ConfirmUnwatchDialog
            open={unwatchOpen}
            onOpenChange={setUnwatchOpen}
            title={movie.title}
            loading={updating}
            onConfirm={async () => {
              await unwatch();
              toast.success(t("watch.unmarkedWatched"));
            }}
          />

          <ShareCardDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            fileBase={`clakete-${(movie.original_title || movie.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "film"}`}
            data={{
              title: movie.original_title || movie.title,
              year: movie.release_date ? movie.release_date.slice(0, 4) : null,
              posterUrl: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null,
              backdropUrl: movie.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
                : null,
              rating,
              watchedLabel: formatWatchedDate(watchedDate),
              director: movie.director || null,
              caption: t("share.caption"),
              handle: t("share.handle"),
            }}
          />

          <Tabs defaultValue="credits" className="w-full">
            <TabsList className={tabListClass}>
              <TabsTrigger className={tabTriggerClass} value="credits">
                {t("film.credits")}
              </TabsTrigger>
              <TabsTrigger className={tabTriggerClass} value="similar">
                {t("film.similar")}
              </TabsTrigger>
              <TabsTrigger className={tabTriggerClass} value="recommended">
                {t("film.recommended")}
              </TabsTrigger>
              <TabsTrigger className={tabTriggerClass} value="images">
                {t("film.images")}
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

          {/* Mobile-only watch providers, just before reviews */}
          <div className="overflow-hidden rounded-2xl border border-border bg-muted/40 lg:hidden ">
            <WatchProviders movie={movie} hideHeading omitTrailerButton />
          </div>

          <div>
            <SectionLabel>{t("film.recentReviews")}</SectionLabel>
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
