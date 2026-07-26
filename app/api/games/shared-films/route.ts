import { NextResponse } from "next/server"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import { gamesTmdbConfig, personMovieIds } from "@/lib/games/tmdb-cache"

/** How many shared film credits two people have (for easy-pair warnings). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const a = searchParams.get("a")
    const b = searchParams.get("b")
    const language = resolveTmdbLanguage(searchParams.get("language"))
    if (!a || !b || !/^\d+$/.test(a) || !/^\d+$/.test(b) || a === b) {
      return NextResponse.json({ shared: 0 }, { status: 400 })
    }
    const { TMDB_API_KEY } = gamesTmdbConfig()
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    const [moviesA, moviesB] = await Promise.all([
      personMovieIds(Number(a), language),
      personMovieIds(Number(b), language),
    ])
    let shared = 0
    for (const id of moviesA) {
      if (moviesB.has(id)) shared += 1
    }
    return NextResponse.json({ shared, easy: shared >= 1 })
  } catch (error) {
    console.error("game shared films error:", error)
    return NextResponse.json({ shared: 0, easy: false }, { status: 500 })
  }
}
