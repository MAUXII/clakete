import { NextResponse } from 'next/server'
import { DEFAULT_WATCH_REGION, resolveTmdbLanguage, resolveWatchRegion } from '@/lib/locale-prefs'
import { searchMoviesWithAliases, searchTvWithAliases } from '@/lib/tmdb-search'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')
    const page = searchParams.get('page') || '1'
    const language = resolveTmdbLanguage(searchParams.get('language'))
    const region = resolveWatchRegion(searchParams.get('region'))
    /** Só o ImageEditDialog usa `include_tv=1`; demais rotas continuam só filmes. */
    const includeTv =
      searchParams.get('include_tv') === '1' ||
      searchParams.get('media') === 'all'

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const movieRows = await searchMoviesWithAliases({
      query,
      preferredLanguage: language,
      region: region || DEFAULT_WATCH_REGION,
      page,
    })

    const moviesFormatted = movieRows.map((movie) => ({
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title ?? null,
      backdrop_path: movie.backdrop_path,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      vote_average: movie.vote_average,
      media_type: 'movie' as const,
    }))

    if (!includeTv) {
      return NextResponse.json({ results: moviesFormatted })
    }

    const tvRows = await searchTvWithAliases({
      query,
      preferredLanguage: language,
      page,
    })

    const tvFormatted = tvRows.map((show) => ({
      id: show.id,
      title: show.name,
      original_title: show.original_name ?? null,
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
