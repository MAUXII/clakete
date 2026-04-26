import { NextResponse } from 'next/server'
import axios from 'axios'

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') || '1'
  const type = searchParams.get('type') || 'popular'

  try {
    if (type === 'trending_day' || type === 'trending_week') {
      const timeWindow = type === 'trending_day' ? 'day' : 'week'
      const params: Record<string, string | number | boolean | undefined> = {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page,
      }
      searchParams.forEach((value, key) => {
        if (!['type', 'page'].includes(key) && value !== null && value !== '') {
          params[key] = value
        }
      })
      const response = await axios.get(
        `${TMDB_BASE_URL}/trending/tv/${timeWindow}`,
        { params },
      )
      return NextResponse.json(response.data)
    }

    const endpoint = type
    const params: Record<string, string | number | boolean | undefined> = {
      api_key: TMDB_API_KEY,
      language: 'en-US',
      page: page,
    }
    searchParams.forEach((value, key) => {
      if (!['type', 'page'].includes(key) && value !== null) {
        params[key] = value
      }
    })
    const response = await axios.get(`${TMDB_BASE_URL}/tv/${endpoint}`, {
      params,
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Erro ao buscar séries:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar séries' },
      { status: 500 },
    )
  }
}
