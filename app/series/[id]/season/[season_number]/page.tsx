"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell";
import { useLocalePrefs } from "@/hooks/use-locale-prefs";
import { parseMediaParam, seriesHref } from "@/lib/media-href";
import { useDesignMode } from "@/hooks/use-design-mode";
import { glassWideContainerClass } from "@/lib/page-container";
import { cn } from "@/lib/utils";
import type { SeasonDetail } from "@/components/series/season-detail-types";
import { SeasonDetailClassic } from "@/components/series/season-detail-classic";
import { SeasonDetailGlass } from "@/components/series/season-detail-glass";

const SEASON_LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)";
const SEASON_POSTER_ALIGN_MARGIN = `max(-5rem, calc(min(92vw, 304px) * 0.75 + 8rem - ${SEASON_LETTERBOX_HEIGHT}))`;

export default function SeriesSeasonPage({
  params,
}: {
  params: Promise<{ id: string; season_number: string }>;
}) {
  const { id: rawParam, season_number } = use(params);
  const parsed = parseMediaParam(rawParam);
  const [seriesId, setSeriesId] = useState<number | null>(
    parsed?.kind === "id" ? parsed.id : null,
  );
  const [resolveFailed, setResolveFailed] = useState(false);
  const [season, setSeason] = useState<SeasonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { tmdbLanguage, loading: localeLoading } = useLocalePrefs();
  const designMode = useDesignMode();
  const isGlass = designMode === "glass";

  const [seasonProgress, setSeasonProgress] = useState<{
    watched: number;
    total: number;
  } | null>(null);

  const onProgressChange = useCallback((watched: number, total: number) => {
    setSeasonProgress({ watched, total });
  }, []);

  const seriesPath =
    seriesId != null
      ? seriesHref({ id: seriesId, name: season?.seriesName })
      : `/series/${rawParam}`;

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
    void fetch(`/api/series/resolve?slug=${encodeURIComponent(parsed.slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not found");
        const data = (await res.json()) as { id?: number };
        if (cancelled) return;
        if (data.id) setSeriesId(data.id);
        else setResolveFailed(true);
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
    async function fetchSeason() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/series/${seriesId}/season/${season_number}?language=${encodeURIComponent(tmdbLanguage)}`,
        );
        const data = await response.json();
        if (response.ok) {
          setSeason(data);
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchSeason();
  }, [seriesId, season_number, tmdbLanguage, localeLoading]);

  if (resolveFailed || (!loading && seriesId == null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Series not found
      </div>
    );
  }

  if (loading || seriesId == null) {
    if (isGlass) {
      return (
        <div className="min-h-screen w-full overflow-x-clip bg-background">
          <div
            className={cn(
              glassWideContainerClass,
              "mt-[calc(var(--ck-nav-h,3.25rem)+var(--clakete-promo-h,0px))] pb-24 pt-6 md:pt-10"
            )}
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr] md:gap-10 lg:grid-cols-[300px_1fr] lg:gap-12">
              <div className="flex flex-col gap-3">
                <Skeleton className="aspect-[2/3] w-full rounded-[14px]" />
                <Skeleton className="h-12 w-full rounded-[12px]" />
                <Skeleton className="h-24 w-full rounded-[14px]" />
              </div>
              <div className="space-y-4 pt-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-3/4 max-w-md" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-1.5 w-64 rounded-full" />
                <Skeleton className="h-28 w-full rounded-lg" />
                <div className="space-y-4 pt-4">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
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
            className="relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-background"
            style={{ height: SEASON_LETTERBOX_HEIGHT }}
            aria-hidden
          />
          <div className="relative z-10 mt-0 flex flex-col gap-12 px-5 pt-2 sm:px-8 lg:flex-row lg:items-start lg:gap-10 lg:px-10 xl:gap-12">
            <div
              className="mx-auto flex w-full max-w-[260px] shrink-0 flex-col gap-3 self-start sm:max-w-[280px] lg:mx-0 lg:max-w-[304px]"
              style={{ marginTop: `calc((${SEASON_POSTER_ALIGN_MARGIN}) - 9rem)` }}
            >
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
            </div>
            <div className="min-w-0 flex-1 space-y-6 pt-1">
              <div className="space-y-3">
                <Skeleton className="h-9 w-[min(100%,420px)]" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        </FilmsCatalogShell>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-background">
        <FilmsCatalogShell>
          <h1 className="text-2xl font-semibold tracking-tight">Season not found</h1>
          <Link
            href={seriesPath}
            className="-mt-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to series
          </Link>
        </FilmsCatalogShell>
      </div>
    );
  }

  if (isGlass) {
    return (
      <SeasonDetailGlass
        seriesId={seriesId}
        season={season}
        seriesPath={seriesPath}
        seasonProgress={seasonProgress}
        onProgressChange={onProgressChange}
      />
    );
  }

  return (
    <SeasonDetailClassic
      seriesId={seriesId}
      season={season}
      seriesPath={seriesPath}
      seasonProgress={seasonProgress}
      onProgressChange={onProgressChange}
    />
  );
}
