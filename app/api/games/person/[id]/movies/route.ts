import { NextResponse } from "next/server"
import axios from "axios"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import { gamesTmdbConfig } from "@/lib/games/tmdb-cache"

/** Person → notable movie credits for inspect panel / Connect the Stars. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const language = resolveTmdbLanguage(
      new URL(request.url).searchParams.get("language"),
    )
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }
    const { TMDB_API_KEY, TMDB_BASE_URL } = gamesTmdbConfig()
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    const { data } = await axios.get(
      `${TMDB_BASE_URL}/person/${id}/movie_credits`,
      { params: { api_key: TMDB_API_KEY, language } },
    )

    const cast = Array.isArray(data.cast) ? data.cast : []
    const movies = cast
      .filter(
        (m: {
          id?: number
          title?: string
          adult?: boolean
          vote_count?: number
          poster_path?: string | null
        }) =>
          m?.id &&
          m?.title &&
          !m.adult &&
          (m.vote_count ?? 0) >= 25 &&
          Boolean(m.poster_path),
      )
      .sort(
        (a: { popularity?: number }, b: { popularity?: number }) =>
          (b.popularity ?? 0) - (a.popularity ?? 0),
      )
      .slice(0, 24)
      .map(
        (m: {
          id: number
          title: string
          poster_path: string | null
          release_date?: string
          character?: string
        }) => ({
          id: m.id,
          kind: "movie" as const,
          name: m.title,
          imagePath: m.poster_path,
          subtitle: m.release_date?.slice(0, 4) || m.character || null,
        }),
      )

    return NextResponse.json({ results: movies, count: movies.length })
  } catch (error) {
    console.error("game person movies error:", error)
    return NextResponse.json(
      { error: "Failed to fetch person movies" },
      { status: 500 },
    )
  }
}
