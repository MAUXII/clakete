import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(req: NextRequest) {
  try {
    // Parse query params
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const with_genres = searchParams.get('with_genres') || undefined;
    const vote_average_lte = searchParams.get('vote_average.lte') || undefined;
    const sort_by = searchParams.get('sort_by') || 'popularity.desc';
    const type = searchParams.get('type') || undefined;

    // Monta os parâmetros para a API do TMDB
    const params: Record<string, string | number | boolean> = {
      api_key: TMDB_API_KEY || '',
      language: 'en-US',
      sort_by,
      include_adult: false,
      include_video: false,
      page,
    };

    // Adiciona parâmetros específicos para filmes upcoming
    if (type === 'upcoming') {
      const today = new Date();
      const minDate = today.toISOString().split('T')[0]; // Data de hoje no formato YYYY-MM-DD
      const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]; // 1 ano a partir de hoje
      
      params['release_date.gte'] = minDate;
      params['release_date.lte'] = maxDate;
      params['with_release_type'] = '2|3'; // 2 = theatrical, 3 = digital
    }

    if (with_genres) params.with_genres = with_genres;
    if (vote_average_lte) params['vote_average.lte'] = vote_average_lte;

    // Faz a requisição para o TMDB
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params,
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar filmes (discover):', error);
    return NextResponse.json(
      { error: 'Erro ao buscar filmes (discover)' },
      { status: 500 }
    );
  }
} 