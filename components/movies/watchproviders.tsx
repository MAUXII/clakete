"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
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

interface WatchProvider {
  logo_path: string;
  provider_name: string;
  provider_id: number;
}

const trailerIconBtnClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-brand/12 text-brand transition-colors hover:bg-brand/22";

export default function WatchProviders({
  movie,
  hideHeading = false,
  omitTrailerButton = false,
  mediaType = "movie",
}: {
  movie: Movie;
  hideHeading?: boolean;
  omitTrailerButton?: boolean;
  /** Used to resolve JustWatch deep links (title page on Netflix etc.). */
  mediaType?: "movie" | "tv";
}) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [providersDialogOpen, setProvidersDialogOpen] = useState(false);
  const [deepLinks, setDeepLinks] = useState<Record<number, string>>({});
  const { t } = useT();
  const { watchRegion } = useLocalePrefs();
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
  const allProviders = new Map<number, WatchProvider>();
  if (providers) {
    [...(providers.flatrate || []), ...(providers.rent || []), ...(providers.buy || [])].forEach((provider) => {
      if (!allProviders.has(provider.provider_id)) {
        allProviders.set(provider.provider_id, provider);
      }
    });
  }

  if (hideHeading) {
    const getProviderTypes = (provider: WatchProvider) => {
      const types: string[] = [];
      if (!providers) return types;
      if (providers.flatrate?.some((x) => x.provider_id === provider.provider_id)) types.push("Stream");
      if (providers.rent?.some((x) => x.provider_id === provider.provider_id)) types.push("Rent");
      if (providers.buy?.some((x) => x.provider_id === provider.provider_id)) types.push("Buy");
      return types;
    };

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

          {providers ? (
            <>
              <div className="divide-y divide-border">
                {Array.from(allProviders.values())
                  .slice(0, 2)
                  .map((provider) => (
                    <Link
                      href={providerHref(provider.provider_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={provider.provider_id}
                      className="group flex w-full items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted"
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        <Image
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                          alt={provider.provider_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
                          {provider.provider_name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {getProviderTypes(provider).map((type) => (
                            <span
                              key={type}
                              className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
                            >
                              {typeLabel(type)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>

              <div className="border-t border-border px-3 py-2">
                <button
                  type="button"
                  onClick={() => setProvidersDialogOpen(true)}
                  className={cn(
                    "w-full rounded-lg py-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground transition-colors",
                    "hover:bg-muted hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/25",
                  )}
                >
                  {t("catalog.allProviders")}
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("catalog.notStreamingIn", { region: regionName })}
              </p>
            </div>
          )}
        </div>

        <Dialog open={providersDialogOpen} onOpenChange={setProvidersDialogOpen}>
          <DialogContent className="max-h-[82vh] overflow-hidden border-border bg-card p-0 text-foreground sm:max-w-lg">
            <DialogHeader className="border-b border-border px-5 py-4">
              <DialogTitle>{t("catalog.allProviders")}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t("catalog.opensOnService", { region: regionName })}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
                {Array.from(allProviders.values()).map((provider) => (
                  <Link
                    href={providerHref(provider.provider_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={provider.provider_id}
                    className="group flex w-full items-center gap-3 px-3 py-3 transition-colors hover:bg-muted"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      <Image
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate font-medium text-foreground transition-colors group-hover:text-foreground">
                        {provider.provider_name}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {getProviderTypes(provider).map((type) => (
                          <span
                            key={type}
                            className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {typeLabel(type)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-border px-5 py-3 text-center">
              <a
                href={justWatchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground underline-offset-2 hover:text-muted-foreground hover:underline"
              >
                {t("catalog.justWatchAttr")}
              </a>
            </div>
          </DialogContent>
        </Dialog>

        {!omitTrailerButton ? (
          <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} />
        ) : null}
      </>
    );
  }

  const cardClassName = "w-full overflow-hidden rounded-xl border border-border";

  if (!providers) {
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
      </>
    );
  }

  const getProviderTypes = (provider: WatchProvider) => {
    const types = [];
    if (providers.flatrate?.some((p) => p.provider_id === provider.provider_id)) {
      types.push("Stream");
    }
    if (providers.rent?.some((p) => p.provider_id === provider.provider_id)) {
      types.push("Rent");
    }
    if (providers.buy?.some((p) => p.provider_id === provider.provider_id)) {
      types.push("Buy");
    }
    return types;
  };

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
          <div className="mt-4 flex w-full flex-col space-y-4">
            {Array.from(allProviders.values())
              .slice(0, 2)
              .map((provider) => (
                <Link
                  href={providerHref(provider.provider_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={provider.provider_id}
                  className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-brand/10 group"
                >
                  <div className="relative aspect-square h-10 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                      alt={provider.provider_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <h4 className="truncate text-nowrap font-medium transition-colors group-hover:text-brand w-[10.5rem]">
                      {provider.provider_name}
                    </h4>
                    <div className="mt-1 flex gap-2">
                      {getProviderTypes(provider).map((type) => (
                        <span
                          key={type}
                          className="rounded bg-muted-foreground/10 px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {typeLabel(type)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </CardContent>
        <CardFooter>
          <button
            type="button"
            onClick={() => setProvidersDialogOpen(true)}
            className="flex h-12 w-full items-center justify-center rounded-md border border-black/10 bg-brand/10 p-3 text-brand transition-colors hover:bg-brand/20 hover:text-brand/90 dark:border-border"
          >
            + {t("catalog.allProviders")}
          </button>
        </CardFooter>
      </Card>

      <Dialog open={providersDialogOpen} onOpenChange={setProvidersDialogOpen}>
        <DialogContent className="max-h-[82vh] overflow-hidden border-border bg-card p-0 text-foreground sm:max-w-lg">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle>{t("catalog.allProviders")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("catalog.opensOnService", { region: regionName })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-3">
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
              {Array.from(allProviders.values()).map((provider) => (
                <Link
                  href={providerHref(provider.provider_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={provider.provider_id}
                  className="group flex w-full items-center gap-3 px-3 py-3 transition-colors hover:bg-muted"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <Image
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                      alt={provider.provider_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate font-medium text-foreground transition-colors group-hover:text-foreground">
                      {provider.provider_name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {getProviderTypes(provider).map((type) => (
                        <span
                          key={type}
                          className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {typeLabel(type)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-border px-5 py-3 text-center">
            <a
              href={justWatchHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground underline-offset-2 hover:text-muted-foreground hover:underline"
            >
              {t("catalog.justWatchAttr")}
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <Trailer trailerOpen={trailerOpen} setTrailerOpen={setTrailerOpen} movie={movie} />
    </>
  );
}
