"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { SiLetterboxd, SiMetacritic } from "react-icons/si";
import { cn } from "@/lib/utils";
import type { FilmExternalRating, MdbListRatingSourceId } from "@/lib/mdblist";
import { useT } from "@/components/providers/i18n-provider";
import { useDesignMode } from "@/hooks/use-design-mode";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

type FilmExternalRatingsProps = {
  tmdbId: number;
  /** movie (default) | show — MDBList usa "show" pra TV. */
  mediaType?: "movie" | "show";
};

type DisplayItem =
  | { kind: "single"; rating: FilmExternalRating }
  | {
      kind: "rt";
      critics: FilmExternalRating | null;
      audience: FilmExternalRating | null;
    };

const KEEP: MdbListRatingSourceId[] = [
  "imdb",
  "tomatoes",
  "popcorn",
  "metacritic",
  "letterboxd",
  "tmdb",
  "trakt",
];

/** Ícones oficiais do RT (marca), em /public/ratings. */
const RT_ICONS = {
  fresh: "/ratings/rt-fresh.svg",
  rotten: "/ratings/rt-rotten.svg",
  audienceFresh: "/ratings/rt-audience-fresh.svg",
  audienceSpilled: "/ratings/rt-audience-spilled.svg",
} as const;

const IMDB_ICON = "/ratings/imdb.svg";
const TRAKT_ICON = "/ratings/trakt.svg";
const TMDB_ICON = "/ratings/tmdb.svg";

function sanitizeRating(rating: FilmExternalRating): FilmExternalRating {
  if (rating.scale === "10") {
    let value = rating.value;
    if (value > 10 && value <= 100) value = value / 10;
    if (value > 10) value = value / 10;
    value = Math.min(10, Math.max(0, value));
    return { ...rating, value, display: `${value.toFixed(1)}/10` };
  }
  return rating;
}

function splitDisplay(display: string): { main: string; suffix: string } {
  const pct = display.match(/^(\d+)%$/);
  if (pct) return { main: pct[1], suffix: "%" };
  const frac = display.match(/^([\d.]+)(\/\d+)$/);
  if (frac) return { main: frac[1], suffix: frac[2] };
  return { main: display, suffix: "" };
}

function RtIcon({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG de marca estático em /public
    <img
      src={src}
      alt=""
      width={32}
      height={32}
      className={cn("size-8 object-contain", className)}
      draggable={false}
    />
  );
}

function ScoreText({
  display,
  size = "lg",
  isGlass = false,
}: {
  display: string;
  size?: "lg" | "md";
  isGlass?: boolean;
}) {
  const { main, suffix } = splitDisplay(display);
  return (
    <span className="inline-flex items-baseline gap-0.5 leading-none tabular-nums">
      <span
        className={cn(
          "font-semibold tracking-tight",
          isGlass ? "text-white" : "text-foreground",
          size === "lg" ? "text-2xl" : "text-xl"
        )}
      >
        {main}
      </span>
      {suffix ? (
        <span
          className={cn(
            "text-[11px] font-medium",
            isGlass ? "text-white/45" : "text-muted-foreground",
          )}
        >
          {suffix}
        </span>
      ) : null}
    </span>
  );
}

function BrandIcon({
  id,
  value,
}: {
  id: MdbListRatingSourceId;
  value: number;
}) {
  if (id === "tomatoes") {
    return <RtIcon src={value >= 60 ? RT_ICONS.fresh : RT_ICONS.rotten} />;
  }
  if (id === "popcorn") {
    return (
      <RtIcon
        src={value >= 60 ? RT_ICONS.audienceFresh : RT_ICONS.audienceSpilled}
      />
    );
  }

  if (id === "imdb") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo estático em /public
      <img
        src={IMDB_ICON}
        alt=""
        width={40}
        height={20}
        className="h-5 w-auto object-contain"
        draggable={false}
      />
    );
  }

  if (id === "trakt") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={TRAKT_ICON}
        alt=""
        width={28}
        height={28}
        className="size-7 object-contain"
        draggable={false}
      />
    );
  }

  if (id === "tmdb") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={TMDB_ICON}
        alt=""
        width={28}
        height={28}
        className="size-7 object-contain"
        draggable={false}
      />
    );
  }

  const map: Partial<Record<MdbListRatingSourceId, ReactNode>> = {
    metacritic: <SiMetacritic className="size-7 text-[#66CC33]" />,
    letterboxd: <SiLetterboxd className="size-7 text-[#00E054]" />,
  };
  return map[id] ?? null;
}

const cardShell =
  "flex h-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md px-3 py-4 text-center select-none shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]";

function RatingsCarousel({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) return;

    const update = () => {
      const progress = api.scrollProgress();
      setCanScrollPrev(api.canScrollPrev() && progress > 0.02);
      setCanScrollNext(api.canScrollNext() && progress < 0.98);
    };

    update();
    api.on("select", update);
    api.on("reInit", update);
    api.on("scroll", update);

    return () => {
      api.off("select", update);
      api.off("reInit", update);
      api.off("scroll", update);
    };
  }, [api]);

  const maskStyle = useMemo<React.CSSProperties>(() => {
    if (canScrollPrev && canScrollNext) {
      return {
        maskImage:
          "linear-gradient(to right, transparent 0%, black 32px, black calc(100% - 48px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 32px, black calc(100% - 48px), transparent 100%)",
      };
    }
    if (canScrollNext) {
      return {
        maskImage:
          "linear-gradient(to right, black 0%, black calc(100% - 48px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, black 0%, black calc(100% - 48px), transparent 100%)",
      };
    }
    if (canScrollPrev) {
      return {
        maskImage:
          "linear-gradient(to right, transparent 0%, black 32px, black 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 32px, black 100%)",
      };
    }
    return {};
  }, [canScrollPrev, canScrollNext]);

  return (
    <div className="relative w-full">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        className="w-full cursor-grab select-none active:cursor-grabbing"
        style={maskStyle}
      >
        {/* ml/pl zerados: o Carousel padrão usa -ml-4/pl-4 e isso corta o 1º card */}
        <CarouselContent className="!ml-0 gap-2.5">
          {children}
        </CarouselContent>
      </Carousel>

      {/* Blur/fade sutil na borda direita indicando que há mais conteúdo */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-14 transition-opacity duration-300",
          "backdrop-blur-[2.5px] [mask-image:linear-gradient(to_left,black_15%,transparent)] [-webkit-mask-image:linear-gradient(to_left,black_15%,transparent)]",
          canScrollNext ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Blur/fade sutil na borda esquerda quando scrollado */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-10 transition-opacity duration-300",
          "backdrop-blur-[2.5px] [mask-image:linear-gradient(to_right,black_15%,transparent)] [-webkit-mask-image:linear-gradient(to_right,black_15%,transparent)]",
          canScrollPrev ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

function SingleCard({
  rating,
  isGlass,
}: {
  rating: FilmExternalRating;
  isGlass: boolean;
}) {
  const inner = (
    <>
      <BrandIcon id={rating.id} value={rating.value} />
      <ScoreText display={rating.display} isGlass={isGlass} />
      <p
        className={cn(
          "text-[10px] font-medium uppercase tracking-[0.14em]",
          isGlass ? "text-white/45" : "text-muted-foreground",
        )}
      >
        {rating.label}
      </p>
    </>
  );

  if (rating.href) {
    return (
      <a
        href={rating.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          cardShell,
          isGlass
            ? "transition-colors hover:border-white/20 hover:bg-white/[0.10]"
            : "transition-colors hover:bg-muted/40",
        )}
      >
        {inner}
      </a>
    );
  }

  return <div className={cardShell}>{inner}</div>;
}

/** Um card só: Critics + Audience (ambos Rotten Tomatoes). */
function RottenTomatoesCard({
  critics,
  audience,
  isGlass,
}: {
  critics: FilmExternalRating | null;
  audience: FilmExternalRating | null;
  isGlass: boolean;
}) {
  const { t } = useT();
  const href = critics?.href || audience?.href || null;

  const body = (
    <>
      <p
        className={cn(
          "text-[10px] font-medium uppercase tracking-[0.14em]",
          isGlass ? "text-white/45" : "text-muted-foreground",
        )}
      >
        Rotten Tomatoes
      </p>
      <div className="mt-1 flex w-full items-stretch justify-center gap-0">
        {critics ? (
          <div className="flex flex-1 flex-col items-center gap-1.5 px-2">
            <span className="relative inline-flex">
              <BrandIcon id="tomatoes" value={critics.value} />
              {critics.certifiedFresh ? (
                <span
                  className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-[#FA320A] shadow-sm ring-1 ring-background"
                  title="Certified Fresh"
                  aria-label="Certified Fresh"
                >
                  <Check className="size-2.5 text-white" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </span>
            <ScoreText display={critics.display} size="md" isGlass={isGlass} />
            <span
              className={cn(
                "text-[9px] font-medium uppercase tracking-[0.12em]",
                isGlass ? "text-white/40" : "text-muted-foreground/80",
              )}
            >
              {t("catalog.rtCritics")}
            </span>
          </div>
        ) : null}
        {critics && audience ? (
          <div
            className={cn(
              "w-px self-stretch",
              isGlass ? "bg-white/15" : "bg-border/70",
            )}
            aria-hidden
          />
        ) : null}
        {audience ? (
          <div className="flex flex-1 flex-col items-center gap-1.5 px-2">
            <BrandIcon id="popcorn" value={audience.value} />
            <ScoreText display={audience.display} size="md" isGlass={isGlass} />
            <span
              className={cn(
                "text-[9px] font-medium uppercase tracking-[0.12em]",
                isGlass ? "text-white/40" : "text-muted-foreground/80",
              )}
            >
              {t("catalog.rtAudience")}
            </span>
          </div>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          cardShell,
          "gap-1",
          isGlass
            ? "transition-colors hover:border-white/20 hover:bg-white/[0.10]"
            : "transition-colors hover:bg-muted/40",
        )}
      >
        {body}
      </a>
    );
  }

  return <div className={cn(cardShell, "gap-1")}>{body}</div>;
}

function buildItems(ratings: FilmExternalRating[]): DisplayItem[] {
  const byId = new Map(ratings.map((r) => [r.id, r]));
  const items: DisplayItem[] = [];

  for (const id of KEEP) {
    if (id === "popcorn") continue;
    if (id === "tomatoes") {
      const critics = byId.get("tomatoes") ?? null;
      const audience = byId.get("popcorn") ?? null;
      if (critics || audience) {
        items.push({ kind: "rt", critics, audience });
      }
      continue;
    }
    const rating = byId.get(id);
    if (rating) items.push({ kind: "single", rating });
  }

  return items;
}

export function FilmExternalRatings({
  tmdbId,
  mediaType = "movie",
}: FilmExternalRatingsProps) {
  const { t } = useT();
  const isGlass = useDesignMode() === "glass";
  const [ratings, setRatings] = useState<FilmExternalRating[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!tmdbId) return;
    let cancelled = false;
    setRatings(null);
    setFailed(false);

    const qs =
      mediaType === "show" ? "?mediaType=show" : "";

    void fetch(`/api/movies/${tmdbId}/ratings${qs}`)
      .then(async (res) => {
        const data = (await res.json()) as { ratings?: FilmExternalRating[] };
        if (cancelled) return;
        if (!res.ok) {
          setFailed(true);
          setRatings([]);
          return;
        }
        const keep = new Set(KEEP);
        setRatings(
          (Array.isArray(data.ratings) ? data.ratings : [])
            .map(sanitizeRating)
            .filter((r) => keep.has(r.id))
        );
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setRatings([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType]);

  const items = useMemo(
    () => (ratings ? buildItems(ratings) : []),
    [ratings]
  );

  const heading = (
    <div className="flex items-center gap-4">
      <h2
        className={cn(
          "shrink-0 text-[10px] font-medium uppercase tracking-[0.24em]",
          isGlass ? "text-white/45" : "text-muted-foreground",
        )}
      >
        {t("catalog.externalRatings")}
      </h2>
      {/* Glass: soft white line so it sits on Hub Atmosphere instead of solid muted/black */}
      <div
        className={cn(
          "h-px min-w-0 flex-1",
          isGlass ? "bg-white/15" : "bg-muted",
        )}
        aria-hidden
      />
    </div>
  );

  if (ratings === null) {
    return (
      <section aria-label={t("catalog.externalRatings")} className="space-y-4">
        {heading}
        <RatingsCarousel>
          <CarouselItem className="min-w-fit basis-auto !pl-0">
            <div
              className={cn(
                "h-[7.5rem] w-[8.5rem] animate-pulse rounded-xl",
                isGlass ? "bg-white/[0.06]" : "bg-muted/40",
              )}
            />
          </CarouselItem>
          <CarouselItem className="min-w-fit basis-auto !pl-0">
            <div
              className={cn(
                "h-[7.5rem] w-[17rem] animate-pulse rounded-xl",
                isGlass ? "bg-white/[0.06]" : "bg-muted/40",
              )}
            />
          </CarouselItem>
          <CarouselItem className="min-w-fit basis-auto !pl-0">
            <div
              className={cn(
                "h-[7.5rem] w-[8.5rem] animate-pulse rounded-xl",
                isGlass ? "bg-white/[0.06]" : "bg-muted/40",
              )}
            />
          </CarouselItem>
          <CarouselItem className="min-w-fit basis-auto !pl-0">
            <div
              className={cn(
                "h-[7.5rem] w-[8.5rem] animate-pulse rounded-xl",
                isGlass ? "bg-white/[0.06]" : "bg-muted/40",
              )}
            />
          </CarouselItem>
        </RatingsCarousel>
      </section>
    );
  }

  if (failed || items.length === 0) return null;

  return (
    <section aria-label={t("catalog.externalRatings")} className="space-y-4">
      {heading}
      <RatingsCarousel>
        {items.map((item) =>
          item.kind === "rt" ? (
            <CarouselItem key="rt" className="min-w-fit basis-auto !pl-0">
              <div className="h-full w-[17rem] sm:w-[18.5rem]">
                <RottenTomatoesCard
                  critics={item.critics}
                  audience={item.audience}
                  isGlass={isGlass}
                />
              </div>
            </CarouselItem>
          ) : (
            <CarouselItem
              key={item.rating.id}
              className="min-w-fit basis-auto !pl-0"
            >
              <div className="h-full w-[8.5rem]">
                <SingleCard rating={item.rating} isGlass={isGlass} />
              </div>
            </CarouselItem>
          )
        )}
      </RatingsCarousel>
    </section>
  );
}
