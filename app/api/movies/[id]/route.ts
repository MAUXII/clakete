import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY;
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch movie details, watch providers, and videos
    const [movieResponse, watchProvidersResponse, videosResponse, similarResponse, recommendationsResponse, imagesResponse] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          append_to_response: 'credits',
        },
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${id}/watch/providers`, {
        params: {
          api_key: TMDB_API_KEY,
        },
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${id}/videos`, {
        params: {
          api_key: TMDB_API_KEY,
        },
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${id}/similar`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
        },
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${id}/recommendations`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
        },
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${id}/images`, {
        params: {
          api_key: TMDB_API_KEY,
        },
      }),
    ]);

    const movieData = movieResponse.data;
    const watchProvidersData = watchProvidersResponse.data;
    const videosData = videosResponse.data;
    const similarData = similarResponse.data;
    const recommendationsData = recommendationsResponse.data;
    const imagesData = imagesResponse.data;
    
    // Extract director from crew
    const director = movieData.credits.crew.find(
      (person: { job: string }) => person.job === 'Director'
    )?.name;

    // Format the response
    const formattedMovie = {
      id: movieData.id,
      title: movieData.title,
      poster_path: movieData.poster_path,
      backdrop_path: movieData.backdrop_path,
      release_date: movieData.release_date,
      overview: movieData.overview,
      runtime: movieData.runtime,
      vote_average: movieData.vote_average,
      genres: movieData.genres,
      director,
      cast: movieData.credits.cast,
      crew: movieData.credits.crew,
      tagline: movieData.tagline,
      watchProviders: watchProvidersData,
      videos: videosData,
      similar: similarData,
      recommendations: recommendationsData,
      images: imagesData,
    };

    return NextResponse.json(formattedMovie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}
