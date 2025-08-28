import { NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&region=US&include_adult=false`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      throw new Error('Falha ao buscar filmes')
    }

    const data = await response.json()

    // Verifica se data.results existe e é um array
    if (!data.results || !Array.isArray(data.results)) {
      return NextResponse.json({ results: [] })
    }

    // Formata os resultados para retornar apenas os dados necessários
    const formattedResults = data.results
      .filter((movie: any) => movie.title || movie.backdrop_path || movie.poster_path)
      .map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        backdrop_path: movie.backdrop_path,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
      }))
      .sort((a: any, b: any) => b.vote_average - a.vote_average)

    return NextResponse.json({ results: formattedResults })
  } catch (error) {
    console.error('Erro na busca de filmes:', error)
    return NextResponse.json({ error: 'Erro ao buscar filmes' }, { status: 500 })
  }
}