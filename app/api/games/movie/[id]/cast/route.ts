import { NextResponse } from "next/server"
import axios from "axios"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import { gamesTmdbConfig } from "@/lib/games/tmdb-cache"

/** Movie → billed cast for inspect panel / Connect the Stars. */
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

    const { data } = await axios.get(`${TMDB_BASE_URL}/movie/${id}/credits`, {
      params: { api_key: TMDB_API_KEY, language },
    })

    const cast = Array.isArray(data.cast) ? data.cast : []
    const people = cast
      .filter((p: { id?: number; name?: string }) => p?.id && p?.name)
      .sort(
        (a: { order?: number }, b: { order?: number }) =>
          (a.order ?? 999) - (b.order ?? 999),
      )
      .slice(0, 24)
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

    return NextResponse.json({ results: people, count: people.length })
  } catch (error) {
    console.error("game movie cast error:", error)
    return NextResponse.json(
      { error: "Failed to fetch movie cast" },
      { status: 500 },
    )
  }
}
