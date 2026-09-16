"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import Trailer from "./trailer";
import type { Movie } from "@/app/film/[id]/page";
import { FaPlay } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalePrefs } from "@/hooks/use-locale-prefs";
import { pickRegionProviders, watchRegionLabel } from "@/lib/locale-prefs";
import { getProviderWatchHref } from "@/lib/provider-links";
import { justWatchLocaleForRegion } from "@/lib/justwatch";
import { useT } from "@/components/providers/i18n-provider";
import { useSubscription } from "@/hooks/use-subscription";
import { useClaketeWatch } from "@/hooks/use-clakete-watch";
import { ClaketeWatchDialog } from "@/components/movies/clakete-watch-dialog";
import {
  ClaketeSeasonWatchDialog,
  type ClaketeSeasonEpisode,
} from "@/components/movies/clakete-season-watch-dialog";
import { ClaketeLogo } from "@/components/ui/clakete-logo";
import { FilmNearbyCinemasSheet } from "@/components/cinemas/film-nearby-cinemas";
import { useDesignMode } from "@/hooks/use-design-mode";

interface WatchProvider {
  logo_path: string;
  provider_name: string;
  provider_id: number;
}

type ProviderRow =
  | WatchProvider
  | { kind: "clakete"; provider_name: string }
  | { kind: "cinemas"; provider_name: string };

const CLAKETE_ROW: ProviderRow = { kind: "clakete", provider_name: "Clakete" };

function isClaketeRow(
  provider: ProviderRow
): provider is { kind: "clakete"; provider_name: string } {
  return "kind" in provider && provider.kind === "clakete";
}

function isCinemasRow(
  provider: ProviderRow
): provider is { kind: "cinemas"; provider_name: string } {
  return "kind" in provider && provider.kind === "cinemas";
}

const trailerIconBtnClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-brand/12 text-brand transition-colors hover:bg-brand/22";

export default function WatchProviders({
  movie,
  hideHeading = false,
  omitTrailerButton = false,
  mediaType = "movie",
  seasonNumber,
  episodes,
  onClaketeEpisodePlay,
}: {
  movie: Movie;
  hideHeading?: boolean;
  omitTrailerButton?: boolean;
  /** Used to resolve JustWatch deep links (title page on Netflix etc.). */
  mediaType?: "movie" | "tv";
  /** Se definido com mediaType=tv, Clakete abre picker de episódios da temporada. */
  seasonNumber?: number;
  episodes?: ClaketeSeasonEpisode[];
  onClaketeEpisodePlay?: (episode: ClaketeSeasonEpisode) => void;
}) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [providersDialogOpen, setProvidersDialogOpen] = useState(false);
  const [claketeOpen, setClaketeOpen] = useState(false);
  const [cinemasOpen, setCinemasOpen] = useState(false);
  const [cinemasAvailable, setCinemasAvailable] = useState(false);
  const [cinemasCount, setCinemasCount] = useState(0);
  const [deepLinks, setDeepLinks] = useState<Record<number, string>>({});
  const { t, locale } = useT();
  const { watchRegion } = useLocalePrefs();
  const { isShining, loading: subscriptionLoading } = useSubscription();
  const designMode = useDesignMode();
  const isGlass = designMode === "glass";

  const isSeasonWatch =
    mediaType === "tv" &&
    typeof seasonNumber === "number" &&
    Array.isArray(episodes);

  // Filme: sempre (Shining). Série: só na página de temporada (com eps).
  const canUseClakete =
    !subscriptionLoading &&
    isShining &&
    (mediaType === "movie" || isSeasonWatch);

  const canUseCinemas = mediaType === "movie" && locale === "pt-BR";

  const onCinemasAvailableChange = useCallback(
    (available: boolean, cinemaCount: number) => {
      setCinemasAvailable(available);
      setCinemasCount(cinemaCount);
    },
    []
  );

  const { playback, available: claketeAvailable, loading: claketeLoading } =
    useClaketeWatch(
      movie.id,
      canUseClakete,
      isSeasonWatch
        ? { mediaType: "tv", season: seasonNumber, episode: 1 }
        : { mediaType: "movie" }
    );
  // Show in the compact provider list (not only inside "all providers" dialog).
  // Keep visible while playback options load; hide only if confirmed unavailable.
  const showClakete =
    canUseClakete && (claketeLoading || claketeAvailable);
  const showCinemas = canUseCinemas && cinemasAvailable;
  const cinemasRow: ProviderRow = {
    kind: "cinemas",
    provider_name: t("film.nearbyCinemasCta"),
  };

  const providers = pickRegionProviders(movie.watchProviders?.results, watchRegion);
  const regionName = watchRegionLabel(watchRegion);
  const title = movie.title?.trim() || "";
  const jwCountry = justWatchLocaleForRegion(watchRegion).country.toLowerCase();
  const justWatchHref = title
    ? `https://www.justwatch.com/${jwCountry}/search?q=${encodeURIComponent(title)}`
    : `https://www.justwatch.com/${jwCountry}`;

  const typeLabel = (type: string) => {
    if (type === "Stream") return t("catalog.stream");
    if (type === "Rent") return t("catalog.rent");
    if (type === "Buy") return t("catalog.buy");
    if (type === "Subscription") return t("catalog.subscription");
    return type;
  };

  useEffect(() => {
    if (!movie.id) return;
    let cancelled = false;
    const qs = new URLSearchParams({
      tmdbId: String(movie.id),
      mediaType,
      region: watchRegion,
      ...(title ? { title } : {}),
    });

    void fetch(`/api/watch-links?${qs.toString()}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { links?: Record<string, string> };
        if (cancelled || !data.links) return;
        const mapped: Record<number, string> = {};
        for (const [k, v] of Object.entries(data.links)) {
          const id = Number(k);
          if (Number.isFinite(id) && v) mapped[id] = v;
        }
        setDeepLinks(mapped);
      })
      .catch(() => {
        /* keep search fallbacks */
      });

    return () => {
      cancelled = true;
    };
  }, [movie.id, mediaType, watchRegion, title]);

  const providerHref = (providerId: number) =>
    deepLinks[providerId] ||
    getProviderWatchHref({
      providerId,
      title,
      fallbackLink: providers?.link,
    });

  const trailer = movie.videos?.results?.find((video) => video.type === "Trailer" && video.site === "YouTube");
  const hasTrailer = !!trailer;
  const showTrailerStripButton = hasTrailer && !omitTrailerButton;

  const tmdbProviders = new Map<number, WatchProvider>();
  if (providers) {
    [...(providers.flatrate || []), ...(providers.rent || []), ...(providers.buy || [])].forEach((provider) => {
      if (!tmdbProviders.has(provider.provider_id)) {
        tmdbProviders.set(provider.provider_id, provider);
      }
    });
  }

  const tmdbProviderRows = Array.from(tmdbProviders.values());
  const allProviderRows: ProviderRow[] = [
    ...(showClakete ? [CLAKETE_ROW] : []),
    ...(showCinemas ? [cinemasRow] : []),
    ...tmdbProviderRows,
  ];
  // Compact strip: Clakete first so it never gets sliced out of the preview.
  const stripRows: ProviderRow[] = (() => {
    const rows: ProviderRow[] = [];
    if (showClakete) rows.push(CLAKETE_ROW);
    if (showCinemas) rows.push(cinemasRow);
    for (const row of tmdbProviderRows) {
      if (rows.length >= 3) break;
      rows.push(row);
    }
    return rows;
  })();
  const showAllProvidersButton =
    tmdbProviderRows.length > 2 || showClakete || showCinemas;
  const hasPreviewProviders = stripRows.length > 0;
  const hasAnyProvider = hasPreviewProviders || showClakete || showCinemas;

  const getProviderTypes = (provider: ProviderRow) => {
    if (isClaketeRow(provider)) return ["Subscription"];
    if (isCinemasRow(provider)) return ["Theater"];
    if (!providers) return [] as string[];
    const types: string[] = [];
    if (providers.flatrate?.some((x) => x.provider_id === provider.provider_id)) types.push("Stream");
    if (providers.rent?.some((x) => x.provider_id === provider.provider_id)) types.push("Rent");
    if (providers.buy?.some((x) => x.provider_id === provider.provider_id)) types.push("Buy");
    return types;
  };

  const providerLogo = (provider: ProviderRow, size: "sm" | "md" = "sm") => {
    const box =
      size === "sm"
        ? "relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
        : "relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted";

    if (isClaketeRow(provider)) {
      return (
        <div className={cn(box, "flex items-center justify-center bg-brand/10")}>
          <ClaketeLogo className="h-5 w-5" />
        </div>
      );
    }

    if (isCinemasRow(provider)) {
      return (
        <div className={cn(box, "flex items-center justify-center bg-muted")}>
          <MapPin className="h-4 w-4 text-foreground/80" aria-hidden />
        </div>
      );
    }

    return (
      <div className={box}>
        <Image
          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
          alt={provider.provider_name}
          fill
          className="object-cover"
        />
      </div>
    );
  };

  const providerTypeTags = (provider: ProviderRow, variant: "compact" | "dialog" = "compact") =>
    getProviderTypes(provider).map((type) => {
      const label =
        type === "Theater"
          ? cinemasCount > 0
            ? t("cinemas.nearCount", { count: String(cinemasCount) })
            : t("home.inTheaters")
          : typeLabel(type);

      return variant === "compact" ? (
        <span
          key={type}
          className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
        >
          {label}
        </span>
      ) : (
        <span
          key={type}
          className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          {label}
        </span>
      );
    });

  const renderProviderRow = (
    provider: ProviderRow,
    variant: "strip" | "card" | "dialog"
  ) => {
    const inner = (
      <>
        {providerLogo(provider, variant === "card" ? "md" : "sm")}
        <div className="min-w-0 flex-1 text-left">
          <p
            className={cn(
              "truncate font-medium text-foreground transition-colors group-hover:text-foreground",
              variant === "card" ? "text-nowrap w-[10.5rem]" : "text-sm"
            )}
          >
            {provider.provider_name}
          </p>
          <div
            className={cn(
              "flex flex-wrap gap-1",
              variant === "card" ? "mt-1 gap-2" : "mt-0.5 gap-1"
            )}
          >
            {providerTypeTags(provider, variant === "dialog" ? "dialog" : "compact")}
          </div>
        </div>
      </>
    );

    if (isClaketeRow(provider)) {
      return (
        <button
          type="button"
          key="clakete"
          onClick={() => setClaketeOpen(true)}
          className={cn(
            "group flex w-full items-center gap-3 text-left transition-colors",
            variant === "strip" && "px-3 py-2.5 hover:bg-muted",
            variant === "card" && "rounded-lg p-2 hover:bg-brand/10",
            variant === "dialog" && "px-3 py-3 hover:bg-muted"
          )}
        >
          {inner}
        </button>
      );
    }

    if (isCinemasRow(provider)) {
      return (
        <button
          type="button"
          key="cinemas"
          onClick={() => setCinemasOpen(true)}
          className={cn(
            "group flex w-full items-center gap-3 text-left transition-colors",
            variant === "strip" && "px-3 py-2.5 hover:bg-muted",
            variant === "card" && "rounded-lg p-2 hover:bg-brand/10",
            variant === "dialog" && "px-3 py-3 hover:bg-muted"
          )}
        >
          {inner}
        </button>
      );
    }

    const linkClass =
      variant === "strip"
        ? "group flex w-full items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted"
        : variant === "card"
          ? "flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-brand/10 group"
          : "group flex w-full items-center gap-3 px-3 py-3 transition-colors hover:bg-muted";

    return (
      <Link
        href={providerHref(provider.provider_id)}
        target="_blank"
        rel="noopener noreferrer"
        key={provider.provider_id}
        className={linkClass}
      >
        {inner}
      </Link>
    );
  };

  const providersDialog = (
    <Dialog open={providersDialogOpen} onOpenChange={setProvidersDialogOpen}>
      <DialogContent className={cn(
        "max-h-[82vh] overflow-hidden p-0 sm:max-w-lg",
        isGlass
          ? "border-white/10 bg-[#161719]/96 text-white backdrop-blur-2xl shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)] sm:rounded-[24px]"
          : "border-border bg-card text-foreground"
      )}>
        <DialogHeader className={cn("border-b px-5 py-4", isGlass ? "border-white/10" : "border-border")}>
          <DialogTitle className={cn(isGlass && "text-white font-semibold")}>{t("catalog.allProviders")}</DialogTitle>
          <DialogDescription className={cn(isGlass ? "text-white/50" : "text-muted-foreground")}>
            {t("catalog.opensOnService", { region: regionName })}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          <div className={cn("flex flex-col divide-y overflow-hidden rounded-lg border", isGlass ? "divide-white/[0.08] border-white/10 bg-white/[0.02]" : "divide-border border-border")}>
            {allProviderRows.map((provider) => renderProviderRow(provider, "dialog"))}
          </div>
        </div>
        <div className={cn("border-t px-5 py-3 text-center", isGlass ? "border-white/10" : "border-border")}>
          <a
            href={justWatchHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("text-[11px] underline-offset-2 hover:underline", isGlass ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-muted-foreground")}
          >
            {t("catalog.justWatchAttr")}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );

  const claketeDialog = showClakete ? (
    isSeasonWatch && seasonNumber != null && episodes ? (
      <ClaketeSeasonWatchDialog
        open={claketeOpen}
        onOpenChange={setClaketeOpen}
        seriesId={movie.id}
        seasonNumber={seasonNumber}
        seriesName={title}
        episodes={episodes}
        onEpisodePlay={onClaketeEpisodePlay}
      />
    ) : (
      <ClaketeWatchDialog
        open={claketeOpen}
        onOpenChange={setClaketeOpen}
        title={title || "Clakete"}
        playback={playback}
      />
    )
  ) : null;

  if (hideHeading) {
    return (
      <>
        <div className="flex flex-col">
          {showTrailerStripButton ? (
            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              className={cn(
                "flex rounded-b-lg w-full items-center justify-center gap-2.5 px-4 py-3.5 text-sm font-medium text-white transition-colors",
                "-mt-px bg-brand hover:bg-brand-hover",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40",
              )}
            >
              <FaPlay className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("catalog.watchTrailer")}
            </button>
          ) : null}

          {hasAnyProvider ? (
            <>
              {hasPreviewProviders ? (
                <div className="divide-y divide-border">
                  {stripRows.map((provider) => renderProviderRow(provider, "strip"))}
                </div>
              ) : null}

              {showAllProvidersButton ? (
                <button
                  type="button"
                  onClick={() => setProvidersDialogOpen(true)}
                  className={cn(
                    "w-full py-3 text-center text-[11px] font-medium tracking-wide text-muted-foreground transition-colors",
                    hasPreviewProviders && "border-t border-border",
                    "hover:bg-muted hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/25",
                  )}
                >
                  {t("catalog.allProviders")}
                </button>
              ) : null}
            </>
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("catalog.notStreamingIn", { region: regionName })}
              </p>
            </div>
          )}
        </div>

        {providersDialog}
        {claketeDialog}
        {canUseCinemas ? (
          <FilmNearbyCinemasSheet
            open={cinemasOpen}
            onOpenChange={setCinemasOpen}
            tmdbId={movie.id}
            title={title || movie.title}
            originalTitle={movie.original_title}
            onAvailableChange={onCinemasAvailableChange}
          />
        ) : null}
        {!omitTrailerButton ? (
          <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} />
        ) : null}
      </>
    );
  }

  const cardClassName = "w-full overflow-hidden rounded-xl border border-border";

  if (!hasAnyProvider) {
    return (
      <>
        <Card className={cardClassName}>
          <CardHeader className="flex-row items-center justify-between border-b px-6 py-3">
            <CardTitle className="text-muted-foreground uppercase tracking-wide">
              {t("catalog.whereToWatch")}
            </CardTitle>
            {hasTrailer ? (
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className={trailerIconBtnClass}
                title={t("catalog.watchTrailer")}
              >
                <FaPlay className="h-4 w-auto" />
              </button>
            ) : null}
          </CardHeader>
          <CardContent className="mt-4 space-y-4 text-muted-foreground">
            {t("catalog.notStreamingIn", { region: regionName })}
          </CardContent>
        </Card>

        <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} />
        {canUseCinemas ? (
          <FilmNearbyCinemasSheet
            open={cinemasOpen}
            onOpenChange={setCinemasOpen}
            tmdbId={movie.id}
            title={title || movie.title}
            originalTitle={movie.original_title}
            onAvailableChange={onCinemasAvailableChange}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <Card className={cardClassName}>
        <CardHeader className="flex-row items-center justify-between border-b px-6 py-3">
          <CardTitle className="text-muted-foreground uppercase tracking-wide">
            {t("catalog.whereToWatch")}
          </CardTitle>
          {hasTrailer ? (
            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              className={trailerIconBtnClass}
              title={t("catalog.watchTrailer")}
            >
              <FaPlay className="h-4 w-auto" />
            </button>
          ) : null}
        </CardHeader>
        <CardContent>
          {hasPreviewProviders ? (
            <div className="mt-4 flex w-full flex-col space-y-4">
              {stripRows.map((provider) => renderProviderRow(provider, "card"))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("catalog.notStreamingIn", { region: regionName })}
            </p>
          )}
        </CardContent>
        {showAllProvidersButton ? (
          <CardFooter>
            <button
              type="button"
              onClick={() => setProvidersDialogOpen(true)}
              className="flex h-12 w-full items-center justify-center rounded-md border border-black/10 bg-brand/10 p-3 text-brand transition-colors hover:bg-brand/20 hover:text-brand/90 dark:border-border"
            >
              + {t("catalog.allProviders")}
            </button>
          </CardFooter>
        ) : null}
      </Card>

      {providersDialog}
      {claketeDialog}
      {canUseCinemas ? (
        <FilmNearbyCinemasSheet
          open={cinemasOpen}
          onOpenChange={setCinemasOpen}
          tmdbId={movie.id}
          title={title || movie.title}
          originalTitle={movie.original_title}
          onAvailableChange={onCinemasAvailableChange}
        />
      ) : null}
      <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} />
    </>
  );
}
