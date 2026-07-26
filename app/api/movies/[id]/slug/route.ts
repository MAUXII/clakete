import { NextResponse } from "next/server"

import { canonicalMovieSlugById } from "@/lib/canonical-media-slug"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const tmdbId = Number(id)
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const hit = await canonicalMovieSlugById(tmdbId)
    if (!hit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(hit)
  } catch (error) {
    console.error("canonical movie slug:", error)
    return NextResponse.json({ error: "Failed to resolve slug" }, { status: 500 })
  }
}
