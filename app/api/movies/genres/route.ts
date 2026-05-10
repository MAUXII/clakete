import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY;
const TMDB_BASE_URL =
  process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';

export async function GET(req: NextRequest) {
  try {
    const language = req.nextUrl.searchParams.get('language') ?? 'en-US';
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar gêneros:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar gêneros' },
      { status: 500 }
    );
  }
}
