import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY; 
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const type = searchParams.get('type') || 'popular'; // default to popular

  try {
    const endpoint = type;
    // Monta os parâmetros para o TMDB
    const params: Record<string, string | number | boolean | undefined> = {
      api_key: TMDB_API_KEY,
      language: 'en-US',
      page: page,
      region: 'BR',
    };
    // Adiciona todos os outros parâmetros da query string
    searchParams.forEach((value, key) => {
      if (!['type', 'page'].includes(key) && value !== null) {
        params[key] = value;
      }
    });
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${endpoint}`, {
      params,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar filmes' },
      { status: 500 }
    );
  }
}
