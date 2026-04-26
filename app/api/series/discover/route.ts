import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

const LOCKED_PARAM_KEYS = new Set([
  'api_key',
  'language',
  'include_adult',
  'type',
])

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page') || '1'
    const with_genres = searchParams.get('with_genres') || undefined
    const vote_average_lte = searchParams.get('vote_average.lte') || undefined
    const sort_by = searchParams.get('sort_by') || 'popularity.desc'
    const type = searchParams.get('type') || undefined

    const params: Record<string, string | number | boolean> = {
      api_key: TMDB_API_KEY || '',
      language: 'en-US',
      sort_by,
      include_adult: false,
      page,
    }

    if (type === 'upcoming') {
      const today = new Date()
      const minDate = today.toISOString().split('T')[0]
      const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]
      params['first_air_date.gte'] = minDate
      params['first_air_date.lte'] = maxDate
    }

    if (with_genres) params.with_genres = with_genres
    if (vote_average_lte) params['vote_average.lte'] = vote_average_lte

    searchParams.forEach((value, key) => {
      if (LOCKED_PARAM_KEYS.has(key) || value === '') return
      if (key === 'page') {
        params.page = value
        return
      }
      if (key === 'sort_by') {
        params.sort_by = value
        return
      }
      params[key] = value
    })

    params.include_adult = false

    const response = await axios.get(`${TMDB_BASE_URL}/discover/tv`, {
      params,
    })
    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Erro ao buscar séries (discover):', error)
    return NextResponse.json(
      { error: 'Erro ao buscar séries (discover)' },
      { status: 500 },
    )
  }
}
