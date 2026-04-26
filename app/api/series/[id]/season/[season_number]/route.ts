import { NextResponse } from 'next/server'
import axios from 'axios'

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; season_number: string }> },
) {
  try {
    const { id, season_number } = await params

    const [seasonResponse, seriesResponse] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/tv/${id}/season/${season_number}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
        },
      }),
      axios.get(`${TMDB_BASE_URL}/tv/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
        },
      }),
    ])

    const seasonData = seasonResponse.data
    const seriesData = seriesResponse.data
    const today = new Date().toISOString().slice(0, 10)

    const rawEpisodes = seasonData.episodes || []
    const episodes = rawEpisodes
      .filter(
        (ep: { air_date?: string | null }) =>
          !!ep.air_date && ep.air_date <= today,
      )
      .map(
        (ep: {
          id: number
          name: string
          overview: string
          still_path: string | null
          episode_number: number
          air_date: string | null
          runtime: number | null
          vote_average: number
        }) => ({
          id: ep.id,
          name: ep.name,
          overview: ep.overview || '',
          still_path: ep.still_path,
          episode_number: ep.episode_number,
          air_date: ep.air_date,
          runtime: ep.runtime,
          vote_average: ep.vote_average,
        }),
      )

    return NextResponse.json({
      id: seasonData.id,
      name: seasonData.name,
      overview: seasonData.overview || '',
      season_number: seasonData.season_number,
      air_date: seasonData.air_date,
      poster_path: seasonData.poster_path,
      seriesName: seriesData.name,
      seriesBackdrop: seriesData.backdrop_path,
      episodes,
    })
  } catch (error) {
    console.error('Error fetching season details:', error)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch season details' },
      { status: 500 },
    )
  }
}
