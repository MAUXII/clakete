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
import { SeriesDetailClassic } from "@/components/series/series-detail-classic";
import { SeriesDetailGlass } from "@/components/series/series-detail-glass";
import type { SeriesDetail, SeriesDetailViewProps } from "@/components/series/series-detail-types";

export type { SeriesDetail };

const SERIES_LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)";
const SERIES_POSTER_ALIGN_MARGIN = `max(-5rem, calc(min(92vw, 304px) * 0.75 + 8rem - ${SERIES_LETTERBOX_HEIGHT}))`;

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawParam } = use(params);
  const parsed = parseMediaParam(rawParam);
  const router = useRouter();
  const { t } = useT();
  const designMode = useDesignMode();

  const [seriesId, setSeriesId] = useState<number | null>(
    parsed?.kind === "id" ? parsed.id : null,
  );
  const [resolveFailed, setResolveFailed] = useState(false);
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const { tmdbLanguage, loading: localeLoading } = useLocalePrefs();
  const displayTitle = series?.title || series?.name || "";

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
    seriesId ?? 0,
    series?.poster_path,
    displayTitle,
    series?.release_date || series?.first_air_date,
    "tv",
    series?.original_name,
  );

  useEffect(() => {
    if (!parsed) {
      setResolveFailed(true);
      setLoading(false);
      return;
    }
    if (parsed.kind === "id") {
      setSeriesId(parsed.id);
      setResolveFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setResolveFailed(false);
    void fetch(`/api/series/resolve?slug=${encodeURIComponent(parsed.slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not found");
        const data = (await res.json()) as { id?: number; slug?: string };
        if (cancelled) return;
        if (data.id) {
          setSeriesId(data.id);
          if (data.slug && data.slug !== parsed.slug) {
            router.replace(`/series/${data.slug}`);
          }
        } else setResolveFailed(true);
      })
      .catch(() => {
        if (!cancelled) setResolveFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [rawParam]);

  useEffect(() => {
    if (localeLoading || seriesId == null) return;

    let cancelled = false;
    async function fetchSeries() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/series/${seriesId}?language=${encodeURIComponent(tmdbLanguage)}`,
        );
        const data = await response.json();
        if (cancelled) return;
        if (response.ok) {
          setSeries(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchSeries();
    return () => {
      cancelled = true;
    };
  }, [seriesId, tmdbLanguage, localeLoading]);

  useEffect(() => {
    if (!series?.id) return;
    let cancelled = false;
    void fetch(`/api/series/${series.id}/slug`)
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { slug?: string };
        if (!data.slug) return;
        const next = `/series/${data.slug}`;
        if (`/series/${rawParam}` !== next) router.replace(next);
      })
      .catch(() => {
        /* keep current URL */
      });
    return () => {
      cancelled = true;
    };
  }, [series, rawParam, router]);

  if (resolveFailed || (!loading && seriesId == null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        {t("film.seriesNotFound")}
      </div>
    );
  }

  if (loading || seriesId == null) {
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
            style={{ height: SERIES_LETTERBOX_HEIGHT }}
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
              style={{ "--poster-mt": SERIES_POSTER_ALIGN_MARGIN } as CSSProperties}
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

  if (!series) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-background">
        <FilmsCatalogShell>
          <h1 className="text-2xl font-semibold tracking-tight">{t("film.seriesNotFound")}</h1>
          <Link
            href="/series/discover"
            className="-mt-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {t("film.backToCatalog")}
          </Link>
        </FilmsCatalogShell>
      </div>
    );
  }

  const viewProps: SeriesDetailViewProps = {
    series,
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
  };

  if (designMode === "glass") {
    return <SeriesDetailGlass {...viewProps} />;
  }

  return <SeriesDetailClassic {...viewProps} />;
}
