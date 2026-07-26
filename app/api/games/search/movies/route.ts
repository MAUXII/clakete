import { NextResponse } from "next/server"
import axios from "axios"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import { gamesTmdbConfig } from "@/lib/games/tmdb-cache"

/**
 * Search movies. Optional `personId` filters to credits of that person
 * (used when the current canvas node is an actor).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || searchParams.get("query") || "").trim()
    const personId = searchParams.get("personId")
    const language = resolveTmdbLanguage(searchParams.get("language"))
    if (!q) return NextResponse.json({ results: [] })
    const { TMDB_API_KEY, TMDB_BASE_URL } = gamesTmdbConfig()
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    if (personId && /^\d+$/.test(personId)) {
      const { data } = await axios.get(
        `${TMDB_BASE_URL}/person/${personId}/movie_credits`,
        { params: { api_key: TMDB_API_KEY, language } },
      )
      const needle = q.toLowerCase()
      const results = (data.cast ?? [])
        .filter(
          (m: { id?: number; title?: string; adult?: boolean }) =>
            m?.id && m?.title && !m.adult && m.title.toLowerCase().includes(needle),
        )
        .sort(
          (a: { popularity?: number }, b: { popularity?: number }) =>
            (b.popularity ?? 0) - (a.popularity ?? 0),
        )
        .slice(0, 12)
        .map(
          (m: {
            id: number
            title: string
            poster_path: string | null
            release_date?: string
          }) => ({
            id: m.id,
            kind: "movie" as const,
            name: m.title,
            imagePath: m.poster_path,
            subtitle: m.release_date?.slice(0, 4) || null,
          }),
        )
      return NextResponse.json({ results })
    }

    const { data } = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: q,
        language,
        include_adult: false,
        page: 1,
      },
    })

    const results = (data.results ?? [])
      .filter((m: { id?: number; title?: string }) => m?.id && m?.title)
      .slice(0, 12)
      .map(
        (m: {
          id: number
          title: string
          poster_path: string | null
          release_date?: string
        }) => ({
          id: m.id,
          kind: "movie" as const,
          name: m.title,
          imagePath: m.poster_path,
          subtitle: m.release_date?.slice(0, 4) || null,
        }),
      )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("game movie search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
