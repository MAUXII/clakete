import { NextResponse } from 'next/server'
import axios from 'axios'

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL

export async function GET() {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/genre/tv/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
      },
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Erro ao buscar gêneros (tv):', error)
    return NextResponse.json(
      { error: 'Erro ao buscar gêneros' },
      { status: 500 },
    )
  }
}
