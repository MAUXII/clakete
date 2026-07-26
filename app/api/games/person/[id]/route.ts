import { NextResponse } from "next/server"
import axios from "axios"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import { gamesTmdbConfig } from "@/lib/games/tmdb-cache"

/** Lightweight person profile for game seeds. */
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

    const { data } = await axios.get(`${TMDB_BASE_URL}/person/${id}`, {
      params: { api_key: TMDB_API_KEY, language },
    })

    return NextResponse.json({
      id: data.id,
      kind: "person" as const,
      name: data.name as string,
      imagePath: (data.profile_path as string | null) ?? null,
      subtitle: null,
    })
  } catch (error) {
    console.error("game person error:", error)
    return NextResponse.json(
      { error: "Failed to fetch person" },
      { status: 500 },
    )
  }
}
