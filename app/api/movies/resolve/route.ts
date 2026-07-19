import { NextResponse } from "next/server"
import { resolveMovieBySlug } from "@/lib/tmdb-search"

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug")?.trim() || ""
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }
    const hit = await resolveMovieBySlug(slug)
    if (!hit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ id: hit.id, slug: hit.canonicalSlug })
  } catch (error) {
    console.error("Error resolving movie slug:", error)
    return NextResponse.json({ error: "Failed to resolve" }, { status: 500 })
  }
}
