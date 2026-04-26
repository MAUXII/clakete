import Image from "next/image";
import Link from "next/link";

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
  seasons,
}: {
  seriesId: number;
  seasons: Season[];
}) {
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredSeasons.map((season) => (
        <Link
          key={season.id}
          href={`/series/${seriesId}/season/${season.season_number}`}
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
