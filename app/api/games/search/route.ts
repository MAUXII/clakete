import { NextResponse } from "next/server"
import axios from "axios"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import { gamesTmdbConfig } from "@/lib/games/tmdb-cache"

/**
 * Free-form guess search: movies + people (used after the first film is on the board).
 * Validity of the move is checked later via /api/games/validate.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || searchParams.get("query") || "").trim()
    const language = resolveTmdbLanguage(searchParams.get("language"))
    if (!q) return NextResponse.json({ results: [] })
    const { TMDB_API_KEY, TMDB_BASE_URL } = gamesTmdbConfig()
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    const { data } = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        query: q,
        language,
        include_adult: false,
        page: 1,
      },
    })

    const results = (data.results ?? [])
      .filter(
        (r: { media_type?: string; id?: number; adult?: boolean }) =>
          r?.id &&
          !r.adult &&
          (r.media_type === "movie" || r.media_type === "person"),
      )
      .slice(0, 14)
      .map(
        (r: {
          id: number
          media_type: "movie" | "person"
          title?: string
          name?: string
          poster_path?: string | null
          profile_path?: string | null
          release_date?: string
          known_for_department?: string
        }) => {
          if (r.media_type === "movie") {
            return {
              id: r.id,
              kind: "movie" as const,
              name: r.title || "Untitled",
              imagePath: r.poster_path ?? null,
              subtitle: r.release_date?.slice(0, 4) || null,
            }
          }
          return {
            id: r.id,
            kind: "person" as const,
            name: r.name || "Unknown",
            imagePath: r.profile_path ?? null,
            subtitle: r.known_for_department || null,
          }
        },
      )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("game multi search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
