"use client";

import { useEffect, useState, use, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilmInteractions } from "@/hooks/use-film-interactions";
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell";
import { cn } from "@/lib/utils";
import { useLocalePrefs } from "@/hooks/use-locale-prefs";
import { useT } from "@/components/providers/i18n-provider";
import { parseMediaParam } from "@/lib/media-href";
import { useDesignMode } from "@/hooks/use-design-mode";
import { glassWideContainerClass } from "@/lib/page-container";
import { FilmDetailClassic } from "@/components/movies/film-detail-classic";
import { FilmDetailGlass } from "@/components/movies/film-detail-glass";
import type { Movie, FilmDetailViewProps } from "@/components/movies/film-detail-types";

export type { Movie };

const FILM_LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)";
const FILM_POSTER_ALIGN_MARGIN = `max(-5rem, calc(min(92vw, 304px) * 0.75 + 8rem - ${FILM_LETTERBOX_HEIGHT}))`;

export default function FilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawParam } = use(params);
  const parsed = parseMediaParam(rawParam);
  const router = useRouter();
  const { t } = useT();
  const designMode = useDesignMode();

  const [filmId, setFilmId] = useState<number | null>(
    parsed?.kind === "id" ? parsed.id : null,
  );
  const [resolveFailed, setResolveFailed] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  const { tmdbLanguage, loading: localeLoading } = useLocalePrefs();

  // Slug resolution
  useEffect(() => {
    if (!rawParam || parsed?.kind === "id") return;
    const slug = rawParam.trim();
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/movies/resolve?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) {
            setResolveFailed(true);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as { id?: number };
        if (!cancelled && typeof data.id === "number") {
          setFilmId(data.id);
        } else if (!cancelled) {
          setResolveFailed(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolveFailed(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [rawParam, parsed?.kind]);

  const {
    isWatched,
    isLiked,
    isInWatchlist,
    rating,
    review,
    watchedDate,
    rewatchCount,
    hasDiaryLogs,
    loading: interactionsLoading,
    updating,
    setRating,
    toggleWatched,
    toggleLiked,
    toggleWatchlist,
    logWatch,
    unwatch,
    removeFromDiary,
  } = useFilmInteractions(
    filmId ?? 0,
    movie?.poster_path ?? undefined,
    movie?.title ?? undefined,
    movie?.release_date ?? undefined,
    "movie",
    movie?.original_title ?? undefined,
  );

  // Fetch TMDB film details
  useEffect(() => {
    if (filmId == null || localeLoading) return;
    let cancelled = false;
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/movies/${filmId}?language=${encodeURIComponent(tmdbLanguage)}`,
        );
        if (!res.ok) {
          if (!cancelled) setMovie(null);
          return;
        }
        const data = await res.json();
        const directorFromCredits = data.credits?.crew?.find(
          (person: { job: string }) => person.job === "Director",
        )?.name;
        const movieData: Movie = {
          ...data,
          director: data.director || directorFromCredits || "",
          similar: data.similar || { results: [] },
          recommendations: data.recommendations || { results: [] },
          cast: data.cast || data.credits?.cast || [],
          crew: data.crew || data.credits?.crew || [],
          genres: data.genres || [],
          videos: data.videos || null,
          watchProviders: data["watch/providers"] || data.watchProviders || { results: {} },
          trailer: null,
        };
        if (!cancelled) setMovie(movieData);
      } catch (error) {
        console.error("Error fetching movie:", error);
        if (!cancelled) setMovie(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMovie();
    return () => {
      cancelled = true;
    };
  }, [filmId, tmdbLanguage, localeLoading]);

  // Canonicalize slug via server map (never invent from localized title)
  useEffect(() => {
    if (!movie?.id) return;
    let cancelled = false;
    void fetch(`/api/movies/${movie.id}/slug`)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { slug?: string };
        if (!data.slug) return;
        const next = `/film/${data.slug}`;
        if (`/film/${rawParam}` !== next) router.replace(next);
      })
      .catch(() => {
        /* keep current URL */
      });
    return () => {
      cancelled = true;
    };
  }, [movie, rawParam, router]);

  if (resolveFailed || (!loading && filmId == null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        {t("film.notFound") || "Filme não encontrado"}
      </div>
    );
  }

  if (loading || filmId == null) {
    if (designMode === "glass") {
      return (
        <div
          className={cn(
            "relative z-[1] min-h-screen bg-transparent",
            glassWideContainerClass,
            "mt-[calc(var(--ck-nav-h,3.25rem)+var(--clakete-promo-h,0px))] pb-24 pt-6 md:pt-10",
          )}
        >
          <div className="grid w-full gap-8 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start md:gap-14 lg:gap-16">
            <aside className="relative mx-auto w-[min(100%,280px)] md:mx-0 md:w-full">
              <Skeleton className="aspect-[2/3] w-full rounded-[14px]" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-12 w-full rounded-[12px]" />
                <Skeleton className="h-11 w-full rounded-[12px]" />
              </div>
            </aside>
            <div className="space-y-4 md:pt-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-[70%]" />
              <Skeleton className="h-4 w-48" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen w-full overflow-x-clip bg-background">
        <FilmsCatalogShell>
          <div
            className="pointer-events-none relative left-1/2 z-0 mt-[calc(3.75rem+var(--clakete-promo-h,0px))] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-background"
            style={{ height: FILM_LETTERBOX_HEIGHT }}
            aria-hidden
          >
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            <div
              className="absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--background))_0%,hsl(var(--background))_0%,hsl(var(--background)/0.55)_32%,transparent_62%)]"
              aria-hidden
            />
          </div>

          <div className="relative z-10 flex flex-col gap-12 pt-2 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
            <aside
              className="z-20 w-full shrink-0 self-start -mt-20 sm:-mt-24 lg:mx-0 lg:max-w-[304px] lg:[margin-top:calc(var(--poster-mt)_-_9rem)]"
              style={{ "--poster-mt": FILM_POSTER_ALIGN_MARGIN } as CSSProperties}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-end gap-4 lg:block">
                  <div className="w-[44%] max-w-[210px] shrink-0 lg:w-full lg:max-w-none">
                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
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

  const viewProps: FilmDetailViewProps = {
    movie,
    isWatched,
    isLiked,
    isInWatchlist,
    rating,
    review,
    watchedDate,
    rewatchCount,
    hasDiaryLogs,
    loading,
    interactionsLoading,
    updating,
    setRating,
    toggleWatched,
    toggleLiked,
    toggleWatchlist,
    logWatch,
    unwatch,
    removeFromDiary,
    onShareClick: () => {},
  };

  if (designMode === "glass") {
    return <FilmDetailGlass {...viewProps} />;
  }

  return <FilmDetailClassic {...viewProps} />;
}
