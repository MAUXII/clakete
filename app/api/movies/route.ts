import { NextResponse } from 'next/server';
import axios from 'axios';
import { DEFAULT_TMDB_LANGUAGE, DEFAULT_WATCH_REGION, resolveTmdbLanguage, resolveWatchRegion } from '@/lib/locale-prefs';

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY; 
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const type = searchParams.get('type') || 'popular'; // default to popular
  const language = resolveTmdbLanguage(searchParams.get('language') ?? DEFAULT_TMDB_LANGUAGE);
  const region = resolveWatchRegion(searchParams.get('region') ?? DEFAULT_WATCH_REGION);

  try {
    /** Em alta no TMDB (não usa o prefixo /movie/). */
    if (type === 'trending_day' || type === 'trending_week') {
      const timeWindow = type === 'trending_day' ? 'day' : 'week';
      const params: Record<string, string | number | boolean | undefined> = {
        api_key: TMDB_API_KEY,
        language,
        page,
      };
      searchParams.forEach((value, key) => {
        if (!['type', 'page', 'language', 'region'].includes(key) && value !== null && value !== '') {
          params[key] = value;
        }
      });
      const response = await axios.get(
        `${TMDB_BASE_URL}/trending/movie/${timeWindow}`,
        { params },
      );
      return NextResponse.json(response.data);
    }

    const endpoint = type;
    const params: Record<string, string | number | boolean | undefined> = {
      api_key: TMDB_API_KEY,
      language,
      page: page,
      region,
    };
    searchParams.forEach((value, key) => {
      if (!['type', 'page', 'language', 'region'].includes(key) && value !== null) {
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
