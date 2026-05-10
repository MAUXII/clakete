import { NextResponse } from 'next/server'

interface TMDBMovie {
  id: number
  title: string
  backdrop_path: string | null
  poster_path: string | null
  release_date: string
  overview: string
  vote_average: number
}

interface TMDBTv {
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
    const query = searchParams.get('q') || searchParams.get('query')
    const page = searchParams.get('page') || '1'
    /** Só o ImageEditDialog usa `include_tv=1`; demais rotas continuam só filmes. */
    const includeTv =
      searchParams.get('include_tv') === '1' ||
      searchParams.get('media') === 'all'

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const base = `api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&include_adult=false&page=${encodeURIComponent(page)}`

    const movieRes = await fetch(
      `${TMDB_BASE_URL}/search/movie?${base}&region=US`,
      { next: { revalidate: 60 } },
    )
    if (!movieRes.ok) {
      throw new Error('Falha ao buscar filmes TMDB')
    }
    const movieData = await movieRes.json()
    const movieRows = Array.isArray(movieData.results) ? movieData.results : []

    const moviesFormatted = movieRows
      .filter(
        (movie: TMDBMovie) =>
          movie.title || movie.backdrop_path || movie.poster_path,
      )
      .map((movie: TMDBMovie) => ({
        id: movie.id,
        title: movie.title,
        backdrop_path: movie.backdrop_path,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
        media_type: 'movie' as const,
      }))

    if (!includeTv) {
      const onlyMovies = [...moviesFormatted].sort(
        (a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0),
      )
      return NextResponse.json({ results: onlyMovies })
    }

    const tvRes = await fetch(`${TMDB_BASE_URL}/search/tv?${base}`, {
      next: { revalidate: 60 },
    })
    if (!tvRes.ok) {
      throw new Error('Falha ao buscar séries TMDB')
    }
    const tvData = await tvRes.json()
    const tvRows = Array.isArray(tvData.results) ? tvData.results : []

    const tvFormatted = tvRows
      .filter(
        (show: TMDBTv) =>
          show.name || show.backdrop_path || show.poster_path,
      )
      .map((show: TMDBTv) => ({
        id: show.id,
        title: show.name,
        backdrop_path: show.backdrop_path,
        poster_path: show.poster_path,
        release_date: show.first_air_date,
        overview: show.overview,
        vote_average: show.vote_average,
        media_type: 'tv' as const,
      }))

    /** Filmes primeiro, séries depois; cada bloco por nota; no máx. 10 no total (picker). */
    const sortByVote = (
      a: { vote_average?: number | null },
      b: { vote_average?: number | null },
    ) => (b.vote_average ?? 0) - (a.vote_average ?? 0)
    const moviesSorted = [...moviesFormatted].sort(sortByVote)
    const tvSorted = [...tvFormatted].sort(sortByVote)
    const maxCombo = 10
    const formattedResults = [...moviesSorted, ...tvSorted].slice(0, maxCombo)

    return NextResponse.json({ results: formattedResults })
  } catch (error) {
    console.error('Erro na busca TMDB:', error)
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
  }
}