import { NextResponse } from "next/server"
import axios from "axios"

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL =
  process.env.NEXT_PUBLIC_TMDB_BASE_URL || "https://api.themoviedb.org/3"

/** Lightweight TMDB images endpoint for diary dialog art picking. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const mediaType = searchParams.get("mediaType") === "tv" ? "tv" : "movie"

    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    const { data } = await axios.get(
      `${TMDB_BASE_URL}/${mediaType}/${id}/images`,
      {
        params: {
          api_key: TMDB_API_KEY,
          // Include null-language (textless) + en + pt for better art picks.
          include_image_language: "null,en,pt,pt-BR",
        },
      },
    )

    return NextResponse.json({
      posters: data.posters ?? [],
      backdrops: data.backdrops ?? [],
    })
  } catch (error) {
    console.error("Error fetching TMDB images:", error)
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    )
  }
}
