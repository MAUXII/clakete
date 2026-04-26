import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type LandingSpotlightMovie = {
  id: number
  title: string
  backdrop_path: string | null
  overview: string | null
  vote_average?: number | null
}

type Props = {
  movie: LandingSpotlightMovie | null
}

export function LandingSpotlight({ movie }: Props) {
  const backdropUrl = movie?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null

  return (
    <section
      aria-label="Trending spotlight"
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 "
    >
      <div className="relative min-h-[620px] w-full overflow-hidden bg-black md:min-h-[80svh]">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-[center_22%]"
          />
        ) : (
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.06),transparent_60%)]"
            aria-hidden
          />
        )}

        <div
          className="absolute inset-0 bg-gradient-to-r from-black via-black/88 to-black/30"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_100%_50%,transparent_0%,rgba(0,0,0,0.35)_70%)]"
          aria-hidden
        />
         
       <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black from-[0%] via-black/55 via-[22%] to-transparent to-[55%]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex min-h-[620px] w-full max-w-[1280px] flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 md:min-h-[80svh] md:pb-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-neutral-500">
              Trending
            </p>

            {movie ? (
              <>
                <h2 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                  {movie.title}
                </h2>

                {movie.vote_average != null && (
                  <p className="mt-3 text-sm tabular-nums text-neutral-400">
                    {movie.vote_average.toFixed(1)}
                    <span className="text-neutral-600"> /10</span>
                  </p>
                )}

                {movie.overview ? (
                  <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-neutral-400 sm:text-base line-clamp-3">
                    {movie.overview.length > 160
                      ? `${movie.overview.slice(0, 160).trim()}…`
                      : movie.overview}
                  </p>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/film/${movie.id}`}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black",
                      "transition hover:bg-neutral-200 active:scale-[0.98]",
                    )}
                  >
                    View movie
                    <ArrowUpRight className="h-4 w-4 opacity-70" aria-hidden />
                  </Link>
                  <Link
                    href="/films/discover"
                    className={cn(
                      "inline-flex items-center rounded-full border border-white/10 bg-transparent px-5 py-2.5 text-sm font-medium text-neutral-200",
                      "transition hover:border-white/20 hover:bg-white/[0.04]",
                    )}
                  >
                    Catalog
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="h-14 max-w-md animate-pulse rounded-lg bg-white/10 sm:h-16 w-[85%]" />
                <div className="h-4 w-full max-w-lg animate-pulse rounded bg-white/10" />
                <div className="h-4 w-full max-w-lg animate-pulse rounded bg-white/5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
