import { NextResponse } from "next/server"
import axios from "axios"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import { gamesTmdbConfig } from "@/lib/games/tmdb-cache"

/** Search people for Connect the Stars setup / play. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || searchParams.get("query") || "").trim()
    const movieId = searchParams.get("movieId")
    const language = resolveTmdbLanguage(searchParams.get("language"))
    if (!q) return NextResponse.json({ results: [] })
    const { TMDB_API_KEY, TMDB_BASE_URL } = gamesTmdbConfig()
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    if (movieId && /^\d+$/.test(movieId)) {
      const { data } = await axios.get(
        `${TMDB_BASE_URL}/movie/${movieId}/credits`,
        { params: { api_key: TMDB_API_KEY, language } },
      )
      const needle = q.toLowerCase()
      const results = (data.cast ?? [])
        .filter(
          (p: { id?: number; name?: string }) =>
            p?.id && p?.name && p.name.toLowerCase().includes(needle),
        )
        .slice(0, 12)
        .map(
          (p: {
            id: number
            name: string
            profile_path: string | null
            character?: string
          }) => ({
            id: p.id,
            kind: "person" as const,
            name: p.name,
            imagePath: p.profile_path,
            subtitle: p.character || null,
          }),
        )
      return NextResponse.json({ results })
    }

    const { data } = await axios.get(`${TMDB_BASE_URL}/search/person`, {
      params: {
        api_key: TMDB_API_KEY,
        query: q,
        language,
        include_adult: false,
        page: 1,
      },
    })

    const results = (data.results ?? [])
      .filter((p: { id?: number; name?: string }) => p?.id && p?.name)
      .slice(0, 10)
      .map(
        (p: {
          id: number
          name: string
          profile_path: string | null
          known_for_department?: string
        }) => ({
          id: p.id,
          kind: "person" as const,
          name: p.name,
          imagePath: p.profile_path,
          subtitle: p.known_for_department || null,
        }),
      )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("games people search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
