import { NextResponse } from "next/server"

interface TMDBSeries {
  id: number
  name: string
  backdrop_path: string | null
  poster_path: string | null
  first_air_date: string
  overview: string
  vote_average: number
}

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || searchParams.get("query")

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&include_adult=false`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      throw new Error("Falha ao buscar series")
    }

    const data = await response.json()

    if (!data.results || !Array.isArray(data.results)) {
      return NextResponse.json({ results: [] })
    }

    const formattedResults = data.results
      .filter((series: TMDBSeries) => series.name || series.backdrop_path || series.poster_path)
      .map((series: TMDBSeries) => ({
        id: series.id,
        name: series.name,
        backdrop_path: series.backdrop_path,
        poster_path: series.poster_path,
        first_air_date: series.first_air_date,
        overview: series.overview,
        vote_average: series.vote_average,
      }))
      .sort((a: TMDBSeries, b: TMDBSeries) => b.vote_average - a.vote_average)

    return NextResponse.json({ results: formattedResults })
  } catch (error) {
    console.error("Erro na busca de series:", error)
    return NextResponse.json({ error: "Erro ao buscar series" }, { status: 500 })
  }
}
