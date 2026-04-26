import { NextResponse } from 'next/server'
import axios from 'axios'

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const [seriesResponse, watchProvidersResponse, videosResponse, similarResponse, recommendationsResponse, imagesResponse] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/tv/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          append_to_response: 'credits',
        },
      }),
      axios.get(`${TMDB_BASE_URL}/tv/${id}/watch/providers`, {
        params: { api_key: TMDB_API_KEY },
      }),
      axios.get(`${TMDB_BASE_URL}/tv/${id}/videos`, {
        params: { api_key: TMDB_API_KEY },
      }),
      axios.get(`${TMDB_BASE_URL}/tv/${id}/similar`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
        },
      }),
      axios.get(`${TMDB_BASE_URL}/tv/${id}/recommendations`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
        },
      }),
      axios.get(`${TMDB_BASE_URL}/tv/${id}/images`, {
        params: { api_key: TMDB_API_KEY },
      }),
    ])

    const seriesData = seriesResponse.data
    const watchProvidersData = watchProvidersResponse.data
    const videosData = videosResponse.data
    const similarData = similarResponse.data
    const recommendationsData = recommendationsResponse.data
    const imagesData = imagesResponse.data

    const director = seriesData.credits?.crew?.find(
      (person: { job: string }) => person.job === 'Director',
    )?.name

    const creator =
      seriesData.created_by?.[0]?.name ||
      seriesData.credits?.crew?.find(
        (person: { job: string }) => person.job === 'Creator',
      )?.name

    const today = new Date().toISOString().slice(0, 10)
    const validSeasons = (seriesData.seasons || []).filter(
      (season: { season_number?: number; air_date?: string | null }) =>
        (season.season_number || 0) > 0,
    )
    const releasedSeasonsCount = validSeasons.filter(
      (season: { air_date?: string | null }) =>
        !!season.air_date && season.air_date <= today,
    ).length

    const formattedSeries = {
      id: seriesData.id,
      title: seriesData.name,
      name: seriesData.name,
      poster_path: seriesData.poster_path,
      backdrop_path: seriesData.backdrop_path,
      release_date: seriesData.first_air_date,
      first_air_date: seriesData.first_air_date,
      overview: seriesData.overview,
      runtime: seriesData.episode_run_time?.[0] || 0,
      number_of_seasons: releasedSeasonsCount || validSeasons.length || 0,
      seasons: seriesData.seasons || [],
      vote_average: seriesData.vote_average,
      genres: seriesData.genres,
      director: director || creator,
      cast: seriesData.credits?.cast || [],
      crew: seriesData.credits?.crew || [],
      tagline: seriesData.tagline,
      watchProviders: watchProvidersData,
      videos: videosData,
      similar: {
        ...similarData,
        results: (similarData.results || []).map((item: any) => ({
          ...item,
          title: item.name,
          name: item.name,
          release_date: item.first_air_date,
        })),
      },
      recommendations: {
        ...recommendationsData,
        results: (recommendationsData.results || []).map((item: any) => ({
          ...item,
          title: item.name,
          name: item.name,
          release_date: item.first_air_date,
        })),
      },
      images: imagesData,
    }

    return NextResponse.json(formattedSeries)
  } catch (error) {
    console.error('Error fetching series details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch series details' },
      { status: 500 },
    )
  }
}
