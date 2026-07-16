import { NextResponse } from "next/server"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import { searchTvWithAliases } from "@/lib/tmdb-search"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || searchParams.get("query")
    const language = resolveTmdbLanguage(searchParams.get("language"))

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const rows = await searchTvWithAliases({
      query,
      preferredLanguage: language,
    })

    const formattedResults = rows.map((series) => ({
      id: series.id,
      name: series.name,
      original_name: series.original_name ?? null,
      backdrop_path: series.backdrop_path,
      poster_path: series.poster_path,
      first_air_date: series.first_air_date,
      overview: series.overview,
      vote_average: series.vote_average,
    }))

    return NextResponse.json({ results: formattedResults })
  } catch (error) {
    console.error("Erro na busca de series:", error)
    return NextResponse.json({ error: "Erro ao buscar series" }, { status: 500 })
  }
}
