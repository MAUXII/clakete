"use client";

import Image from "next/image";
import Link from "next/link";
import { seriesHref } from "@/lib/media-href";
import { useDesignMode } from "@/hooks/use-design-mode";

interface Season {
  id: number;
  name: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  overview?: string;
}

export default function SeasonsList({
  seriesId,
  seriesName,
  seriesOriginalName,
  seriesFirstAirDate,
  seasons,
}: {
  seriesId: number
  seriesName?: string | null
  seriesOriginalName?: string | null
  seriesFirstAirDate?: string | null
  seasons: Season[]
}) {
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"

  if (!seasons || seasons.length === 0) {
    return <div className="text-muted-foreground">Nenhuma temporada encontrada.</div>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const filteredSeasons = seasons.filter(
    (season) => season.season_number > 0 && !!season.air_date && season.air_date <= today
  );

  if (filteredSeasons.length === 0) {
    return <div className="text-muted-foreground">Nenhuma temporada encontrada.</div>;
  }

  const base = seriesHref({
    id: seriesId,
    name: seriesName,
    original_name: seriesOriginalName,
    first_air_date: seriesFirstAirDate,
  })

  if (isGlass) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {filteredSeasons.map((season) => (
          <Link
            key={season.id}
            href={`${base}/season/${season.season_number}`}
            className="group flex flex-col rounded-xl transition duration-150"
            title={season.name}
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[12px] bg-white/[0.04] shadow-md ring-1 ring-white/10 transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:ring-white/25">
              {season.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${season.poster_path}`}
                  alt={season.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-white/30">
                  ?
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredSeasons.map((season) => (
        <Link
          key={season.id}
          href={`${base}/season/${season.season_number}`}
          className="group block rounded-md border border-black/20 bg-muted-foreground/10 overflow-hidden transition-opacity hover:opacity-90 dark:border-white/20"
        >
          <div className="relative w-full aspect-[2/3]">
            {season.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${season.poster_path}`}
                alt={season.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-medium text-2xl bg-muted-foreground/10">
                ?
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
