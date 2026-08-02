import { NextResponse } from "next/server";
import {
  getFilmExternalRatingsCached,
  MdbListApiError,
  RATINGS_CACHE_TTL_SECONDS,
  type MdbListMediaType,
} from "@/lib/mdblist";

export const runtime = "nodejs";

/**
 * Avaliações agregadas (IMDb, RT, Metacritic, Letterboxd, Trakt, TMDb…).
 * Query: ?mediaType=movie|show (default movie).
 *
 * Fluxo: cache Supabase (TTL 2d + cache_version) → MDBList → upsert.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ ratings: [], error: "Invalid id" }, { status: 400 });
  }

  if (!process.env.MDBLIST_API_KEY?.trim()) {
    return NextResponse.json(
      { ratings: [], error: "MDBLIST_API_KEY missing" },
      { status: 503 }
    );
  }

  const mediaParam = new URL(request.url).searchParams.get("mediaType");
  const mediaType: MdbListMediaType =
    mediaParam === "show" || mediaParam === "tv" ? "show" : "movie";

  const tmdbId = parseInt(id, 10);

  try {
    const { ratings, source, expiresAt } = await getFilmExternalRatingsCached(
      tmdbId,
      { mediaType }
    );

    const maxAge =
      source === "cache" ? Math.min(3600, RATINGS_CACHE_TTL_SECONDS) : 300;

    return NextResponse.json(
      { ratings, tmdbId, mediaType, source, expiresAt },
      {
        headers: {
          "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=86400`,
          "X-Ratings-Cache": source,
        },
      }
    );
  } catch (err) {
    const message =
      err instanceof MdbListApiError ? err.message : "Failed to fetch ratings";
    const status =
      err instanceof MdbListApiError && err.status && err.status >= 400
        ? err.status
        : 502;
    console.error("[mdblist/ratings]", message);
    return NextResponse.json(
      { ratings: [], error: message, tmdbId },
      {
        status,
        headers: { "Cache-Control": "public, max-age=60, s-maxage=60" },
      }
    );
  }
}
