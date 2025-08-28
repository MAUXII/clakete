import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY;

export async function GET() {
  try {
    // Get total movies count from TMDB's /discover/movie endpoint
    const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        sort_by: 'popularity.desc',
        include_adult: false,
        include_video: false,
        page: 1
      },
    });

    return NextResponse.json({
      total_movies: response.data.total_results
    });
  } catch (error) {
    console.error('Error fetching total movies count:', error);
    return NextResponse.json(
      { error: 'Error fetching total movies count' },
      { status: 500 }
    );
  }
}
