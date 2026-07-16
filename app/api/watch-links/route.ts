import { NextResponse } from "next/server"
import { resolveWatchRegion } from "@/lib/locale-prefs"
import { fetchProviderDeepLinks, type JustWatchMediaType } from "@/lib/justwatch"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tmdbIdRaw = searchParams.get("tmdbId") || searchParams.get("id")
    const tmdbId = tmdbIdRaw ? Number.parseInt(tmdbIdRaw, 10) : NaN
    const mediaRaw = (searchParams.get("mediaType") || searchParams.get("media") || "movie").toLowerCase()
    const mediaType: JustWatchMediaType = mediaRaw === "tv" || mediaRaw === "show" ? "tv" : "movie"
    const region = resolveWatchRegion(searchParams.get("region"))
    const titleHint = searchParams.get("title")?.trim() || undefined

    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 })
    }

    const { links } = await fetchProviderDeepLinks({
      tmdbId,
      mediaType,
      region,
      titleHint,
    })

    return NextResponse.json(
      { tmdbId, mediaType, region, links },
      {
        headers: {
          // JW data changes; short CDN/browser cache is enough.
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("watch-links error:", error)
    return NextResponse.json({ error: "Failed to resolve watch links", links: {} }, { status: 500 })
  }
}
