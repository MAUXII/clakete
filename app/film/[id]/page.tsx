"use client";

import { useEffect, useState, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FilmActions } from "@/components/movies/film-actions";
import { StarRating } from "@/components/movies/star-rating";
import { FilmReview } from "@/components/movies/film-review";
import { FilmReviewsList } from "@/components/movies/film-reviews-list";
import { useFilmInteractions } from "@/hooks/use-film-interactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CastList from "@/components/movies/castlist";
import WatchProviders from "@/components/movies/watchproviders";
import { Video } from "@/components/movies/trailer";
import CrewList from "@/components/movies/crewlist";
import SimilarList from "@/components/movies/similar";
import RecommendationsList from "@/components/movies/recommendations";
import ImagesList from "@/components/movies/imagesList";

export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  tagline: string | null;
  overview: string;
  runtime: number;
  images: { 
    backdrops: Array<{ file_path: string }>,
    posters: Array<{ file_path: string }>
  };
  director: string;
  similar: {
    results: Array<{
      title: string;
      poster_path: string;
      id: number;
    }>;
  }
  recommendations: {
    results: Array<{
      title: string;
      poster_path: string;
      id: number;
    }>;
  }
  cast: {
    character: string;
    name: string;
    profile_path: string;
    id: number;
  }[];
  crew: {
    department: string
    name: string;
    profile_path: string;
    id: number;
    job: string;
  }[];
  vote_average: number;
  genres: { id: number; name: string }[];
    videos: {
      results: Video[];
    } | null;
  watchProviders: {
    results: {
      US?: {
        link: string;
        flatrate?: Array<{
          logo_path: string;
          provider_name: string;
          provider_id: number;
        }>;
        rent?: Array<{
          logo_path: string;
          provider_name: string;
          provider_id: number;
        }>;
        buy?: Array<{
          logo_path: string;
          provider_name: string;
          provider_id: number;
        }>;
      };
    };
  };
  trailer: {
    key: string;
    site: string;
    type: string;
    name: string;
  } | null;
}


export default function FilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const filmId = parseInt(id);
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
  } = useFilmInteractions(filmId, movie?.poster_path, movie?.title, movie?.release_date);

  console.log(movie?.videos)
  
  useEffect(() => {
    async function fetchMovie() {
      try {
        const response = await fetch(`/api/movies/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setMovie(data);
        } else {
          console.error("Error fetching movie:", data.error);
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="py-8 mt-20 px-4 w-full max-w-[1152px]">
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

  if (!movie) {
    return (
      <div className="py-8 mt-20 px-4 w-full max-w-[1152px]">
        <h1 className="text-2xl font-bold">Filme não encontrado</h1>
        <Link href="/films" className="text-blue-500 hover:underline flex items-center gap-2 mt-4">
          <ArrowLeft size={20} />
          Voltar para lista de filmes
        </Link>
      </div>
    );
  }

  

  return (
    <div className="py-8 mt-20 px-4 w-full max-w-[1152px]">
      {/* Banner (Backdrop) */}
      <div 
        className="w-full h-[500px] border  dark:border-white/20 border-black/20 rounded-lg bg-cover bg-center relative"
        style={{ 
          backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
          backgroundPosition: 'center 20%'
        }}
      >
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      
      {/* Movie info */}
      <div className="px-8 w-full">
        <div className="relative z-10">
          <div className="flex gap-6">
            {/* Poster */}
            <div className="relative w-72 ">
            <div className="sticky top-4">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="aspect-[2/3]  -mt-36 w-full rounded-2xl ring-1 dark:ring-white/20 ring-black/20 object-cover"
              />
                 {/* Estrelas */}
                 <div className=" w-full flex justify-center flex-wrap text-wrap  flex-col">
                 <h2 className="font-medium  text-muted-foreground/50 text-sm uppercase mt-4">{movie.tagline}</h2>
                 <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
                 <WatchProviders movie={movie} />
                </div>
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 ml-6 mt-6 flex-col flex">
              <div className="flex flex-col">
                <div className="flex flex-1 justify-between items-center">
                <h1 className="text-3xl font-bold mb-2 max-w-96">{movie.title}</h1>
                {movie.director && (
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-medium">Directed by</h2>
                  <p className="text-muted-foreground text-sm">{movie.director}</p>
                </div>
              )}
              </div>
                <div className="text-muted-foreground">
                  {movie.release_date?.split("-")[0]} • {movie.runtime} minutes
                </div>
                
              </div>
              
                   {/* Genres */}
                   <div className="flex items-center justify-between w-full mt-4 gap-4">
                {movie.genres && movie.genres.length > 0 && (
                  
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
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

             
              
              {movie.overview && (
                <div className="mt-4">
                  <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
                </div>
              )}

              {/* Film Actions */}
              <div className="mt-6 flex w-full items-start  gap-3">
                <FilmActions
                  filmId={movie.id}
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
                  filmId={movie.id}
                  initialReview={review}
                  existingReview={review}
                  onReviewSubmit={setReview}
                  disabled={loading || interactionsLoading || updating}
                />
              </div>
                {/* COmeço das reviews */}
             
                
             

  <Tabs defaultValue="cast" className="w-full mt-4">
  <TabsList className="bg-[#111111] h-12">
    <TabsTrigger className="px-12 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="cast">Cast</TabsTrigger>
    <TabsTrigger className="px-12 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="crew">Crew</TabsTrigger>
    <TabsTrigger className="px-12 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="similar">Similar</TabsTrigger>
    <TabsTrigger className="px-12 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="recommended">Recommended</TabsTrigger>
    <TabsTrigger className="px-12 py-2 font-medium data-[state=active]:bg-[#FF0048]/10 data-[state=active]:text-[#FF0048] " value="images">Images</TabsTrigger>  
  </TabsList>
  <TabsContent className="w-full" value="cast">
    <div className="">
    <h2 className="font-medium text-muted-foreground/50 text-sm uppercase ">Cast</h2>
    <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
    <CastList movie={movie} />
    </div>


  </TabsContent>
  <TabsContent value="crew">
  <div className="">
    <h2 className="font-medium text-muted-foreground/50 text-sm uppercase ">Crew</h2>
    <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
    <CrewList movie={movie} />
    </div>
    </TabsContent>
  <TabsContent value="similar">
  <div className="">
  <h2 className="font-medium text-muted-foreground/50 text-sm uppercase ">Similar</h2>
    <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
    <SimilarList movie={movie} />
    </div>
    </TabsContent>
  <TabsContent value="recommended">
    <h2 className="font-medium text-muted-foreground/50 text-sm uppercase ">Recommended</h2>
    <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
    <RecommendationsList movie={movie} />
  </TabsContent>
  <TabsContent value="images">

<h2 className="font-medium text-muted-foreground/50 text-sm uppercase ">Images</h2>
<div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
<ImagesList movie={movie} />
</TabsContent>
</Tabs>
              <div>
                <h2 className="font-medium text-muted-foreground/50 text-sm uppercase mt-4">Recent reviews</h2>
                <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
                <FilmReviewsList filmId={movie.id} />
              </div>
            
          {/* Final das reviews */}
            
         
            </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="fixed top-4 left-4">
        <Link
          href="/films"
          className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90 px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </Link>
      </div>
    </div>
  );
}
