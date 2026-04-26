"use client";

import { useEffect, useState, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilmActions } from "@/components/movies/film-actions";
import { StarRating } from "@/components/movies/star-rating";
import { FilmReview } from "@/components/movies/film-review";
import { FilmReviewsList } from "@/components/movies/film-reviews-list";
import { useFilmInteractions } from "@/hooks/use-film-interactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WatchProviders from "@/components/movies/watchproviders";
import { Video } from "@/components/movies/trailer";
import SimilarSeriesList from "@/components/series/similar";
import RecommendedSeriesList from "@/components/series/recommendations";
import SeasonsList from "@/components/series/seasons";
import CreditsList from "@/components/series/credits";
import ImagesList from "@/components/movies/imagesList";

interface SeriesDetail {
  id: number;
  title: string;
  name: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  first_air_date: string;
  tagline: string | null;
  overview: string;
  runtime: number;
  number_of_seasons: number;
  seasons: Array<{
    id: number;
    name: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
    air_date: string | null;
    overview?: string;
  }>;
  images: {
    backdrops: Array<{ file_path: string }>;
    posters: Array<{ file_path: string }>;
  };
  director: string;
  similar: { results: Array<{ name: string; poster_path: string; id: number; vote_average?: number }> };
  recommendations: { results: Array<{ name: string; poster_path: string; id: number; vote_average?: number }> };
  cast: { character: string; name: string; profile_path: string; id: number }[];
  crew: { department: string; name: string; profile_path: string; id: number; job: string }[];
  vote_average: number;
  genres: { id: number; name: string }[];
  videos: { results: Video[] } | null;
  watchProviders: {
    results: {
      US?: {
        link: string;
        flatrate?: Array<{ logo_path: string; provider_name: string; provider_id: number }>;
        rent?: Array<{ logo_path: string; provider_name: string; provider_id: number }>;
        buy?: Array<{ logo_path: string; provider_name: string; provider_id: number }>;
      };
    };
  };
}

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const seriesId = parseInt(id);
  const {
    rating,
    review,
    isWatched,
    isLiked,
    isInWatchlist,
    loading: interactionsLoading,
    updating,
    setRating,
    setReview,
    toggleWatched,
    toggleLiked,
    toggleWatchlist,
  } = useFilmInteractions(seriesId, series?.poster_path, series?.title, series?.release_date);

  useEffect(() => {
    async function fetchSeries() {
      try {
        const response = await fetch(`/api/series/${id}`);
        const data = await response.json();
        if (response.ok) {
          setSeries(data);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSeries();
  }, [id]);

  if (loading) {
    return (
      <div className="py-8 mt-20 w-full max-w-6xl">
        <Skeleton className="w-full h-[550px] rounded-lg" />
        <div className="px-8">
          <Skeleton className="aspect-[2/3] -mt-48  w-56 rounded-2xl object-cover" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="py-8 mt-20 w-full max-w-6xl">
        <h1 className="text-2xl font-bold">Série não encontrada</h1>
      </div>
    );
  }

  return (
    <div className="py-8 mt-20 w-full max-w-6xl">
      <div
        className="w-full h-[500px] border dark:border-white/20 border-black/20 rounded-lg bg-cover bg-center relative"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${series.backdrop_path})`,
          backgroundPosition: "center 20%",
        }}
      >
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="px-8 w-full">
        <div className="relative z-10">
          <div className="flex gap-6">
            <div className="relative w-72 ">
              <div className="sticky top-4">
                <img
                  src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                  alt={series.title}
                  className="aspect-[2/3] -mt-36 w-full rounded-2xl ring-1 dark:ring-white/20 ring-black/20 object-cover"
                />
                <div className="w-full flex flex-col">
                  <h2 className="font-medium text-muted-foreground/50 text-sm uppercase mt-4">{series.tagline}</h2>
                  <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
                  <WatchProviders movie={series as never} />
                </div>
              </div>
            </div>

            <div className="flex-1 ml-6 mt-6 flex-col flex">
              <div className="flex flex-col">
                <div className="flex flex-1 justify-between items-center">
                  <h1 className="text-3xl font-bold mb-2 max-w-96">{series.title}</h1>
                  {series.director && (
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-medium">Created by</h2>
                      <p className="text-muted-foreground text-sm">{series.director}</p>
                    </div>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {series.release_date?.split("-")[0]} • {series.number_of_seasons} seasons
                </div>
              </div>

              <div className="flex items-center justify-between w-full mt-4 gap-4">
                {series.genres && series.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {series.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="bg-[#FF0048]/10 text-[#FF0048] font-medium px-3 py-1 rounded-md border dark:border-white/10 border-black/10 text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}
                <StarRating
                  initialRating={rating}
                  onRate={setRating}
                  readonly={loading || interactionsLoading || updating}
                />
              </div>

              {series.overview && (
                <div className="mt-4">
                  <p className="text-muted-foreground leading-relaxed">{series.overview}</p>
                </div>
              )}

              <div className="mt-6 flex w-full items-start gap-3">
                <FilmActions
                  filmId={series.id}
                  isWatched={isWatched}
                  isLiked={isLiked}
                  isInWatchlist={isInWatchlist}
                  onWatchClick={toggleWatched}
                  onLikeClick={toggleLiked}
                  onWatchlistClick={toggleWatchlist}
                  loading={loading || interactionsLoading}
                  updating={updating}
                />
                <FilmReview
                  filmId={series.id}
                  initialReview={review}
                  existingReview={review}
                  onReviewSubmit={setReview}
                  disabled={loading || interactionsLoading || updating}
                />
              </div>

              <Tabs defaultValue="credits" className="w-full mt-4">
                <TabsList className="bg-[#111111] h-12 w-full grid grid-cols-5">
                  <TabsTrigger className="w-full min-w-0 px-2 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048]" value="credits">Credits</TabsTrigger>
                  <TabsTrigger className="w-full min-w-0 px-2 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048]" value="seasons">Seasons</TabsTrigger>
                  <TabsTrigger className="w-full min-w-0 px-2 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048]" value="similar">Similar</TabsTrigger>
                  <TabsTrigger className="w-full min-w-0 px-2 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048]" value="recommended">Recommended</TabsTrigger>
                  <TabsTrigger className="w-full min-w-0 px-2 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048]" value="images">Images</TabsTrigger>
                </TabsList>
                <TabsContent className="w-full" value="credits">
                  <div>
                    <CreditsList cast={series.cast || []} crew={series.crew || []} />
                  </div>
                </TabsContent>
                <TabsContent value="seasons">
                  <div>
                    <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Seasons</h2>
                    <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
                    <SeasonsList seriesId={series.id} seasons={series.seasons || []} />
                  </div>
                </TabsContent>
                <TabsContent value="similar">
                  <div>
                    <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Similar</h2>
                    <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
                    <SimilarSeriesList series={series} />
                  </div>
                </TabsContent>
                <TabsContent value="recommended">
                  <div>
                    <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Recommended</h2>
                    <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
                    <RecommendedSeriesList series={series} />
                  </div>
                </TabsContent>
                <TabsContent value="images">
                  <div>
                    <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Images</h2>
                    <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
                    <ImagesList movie={series as never} />
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <h2 className="font-medium text-muted-foreground/50 text-sm uppercase mt-4">Recent reviews</h2>
                <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
                <FilmReviewsList filmId={series.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
