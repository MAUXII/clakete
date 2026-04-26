import Image from "next/image";

export interface SeasonEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

export default function EpisodesList({ episodes }: { episodes: SeasonEpisode[] }) {
  if (!episodes.length) {
    return <div className="text-muted-foreground">Nenhum episódio encontrado.</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {episodes.map((ep) => (
        <div
          key={ep.id}
          className="flex flex-col gap-4 border-b border-black/10 pb-8 last:border-b-0 dark:border-white/10 sm:flex-row sm:gap-6"
        >
          <div className="relative w-full shrink-0 overflow-hidden rounded-md border border-black/20 dark:border-white/20 sm:max-w-[320px] sm:basis-[320px]">
            <div className="relative aspect-video w-full bg-muted-foreground/10">
              {ep.still_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${ep.still_path}`}
                  alt={ep.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[180px] w-full items-center justify-center font-medium text-2xl text-muted-foreground">
                  ?
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-muted-foreground/50 text-xs uppercase">
              Episode {ep.episode_number}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">{ep.name}</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              {ep.air_date ?? "—"}
              {ep.runtime != null && ep.runtime > 0 ? ` • ${ep.runtime} min` : ""}
              {typeof ep.vote_average === "number" && ep.vote_average > 0
                ? ` • ${ep.vote_average.toFixed(1)} ★`
                : ""}
            </p>
            {ep.overview ? (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {ep.overview}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
