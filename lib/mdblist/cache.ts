import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { Json } from "@/lib/supabase/database.types";
import type { FilmExternalRating, MdbListMediaType } from "./types";
import {
  getFilmExternalRatings,
  MdbListApiError,
} from "./client";

/** TTL do cache no Supabase (2 dias). */
export const RATINGS_CACHE_TTL_MS = 2 * 24 * 60 * 60 * 1000;
export const RATINGS_CACHE_TTL_SECONDS = Math.floor(RATINGS_CACHE_TTL_MS / 1000);

/**
 * Bump quando mudar ordem/fontes/normalização — invalida rows antigas.
 * v2: Trakt + TMDb na ordem IMDb→RT→Meta→LB→TMDb→Trakt.
 */
export const RATINGS_CACHE_VERSION = 2;

type CacheRow = {
  tmdb_id: number;
  media_type: string;
  ratings: FilmExternalRating[];
  fetched_at: string;
  expires_at: string;
  cache_version: number;
};

function isRatingArray(value: unknown): value is FilmExternalRating[] {
  return Array.isArray(value);
}

async function readCacheRow(
  tmdbId: number,
  mediaType: MdbListMediaType
): Promise<CacheRow | null> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("film_external_ratings_cache")
      .select(
        "tmdb_id, media_type, ratings, fetched_at, expires_at, cache_version"
      )
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .maybeSingle();

    if (error || !data) return null;
    if (!isRatingArray(data.ratings)) return null;

    const version =
      typeof data.cache_version === "number" ? data.cache_version : 1;

    return {
      tmdb_id: data.tmdb_id,
      media_type: data.media_type,
      ratings: data.ratings,
      fetched_at: data.fetched_at,
      expires_at: data.expires_at,
      cache_version: version,
    };
  } catch (err) {
    console.error("[ratings-cache] read failed", err);
    return null;
  }
}

async function writeCacheRow(
  tmdbId: number,
  mediaType: MdbListMediaType,
  ratings: FilmExternalRating[]
): Promise<void> {
  try {
    const supabase = createSupabaseAdmin();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RATINGS_CACHE_TTL_MS);

    const { error } = await supabase.from("film_external_ratings_cache").upsert(
      {
        tmdb_id: tmdbId,
        media_type: mediaType,
        ratings: ratings as unknown as Json,
        fetched_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        cache_version: RATINGS_CACHE_VERSION,
      },
      { onConflict: "tmdb_id,media_type" }
    );

    if (error) {
      console.error("[ratings-cache] write failed", error.message);
    }
  } catch (err) {
    console.error("[ratings-cache] write failed", err);
  }
}

export type RatingsCacheSource = "cache" | "api" | "stale";

export type RatingsCacheResult = {
  ratings: FilmExternalRating[];
  source: RatingsCacheSource;
  expiresAt: string | null;
};

/**
 * 1) Lê cache fresco no Supabase (mesma cache_version)
 * 2) Se expirado/versão antiga/ausente → MDBList → grava no banco
 * 3) Se a API falhar e houver cache velho → devolve stale
 */
export async function getFilmExternalRatingsCached(
  tmdbId: number,
  opts: { mediaType?: MdbListMediaType } = {}
): Promise<RatingsCacheResult> {
  const mediaType = opts.mediaType ?? "movie";
  const row = await readCacheRow(tmdbId, mediaType);
  const now = Date.now();

  const versionOk = row && row.cache_version === RATINGS_CACHE_VERSION;
  const fresh =
    versionOk && row && new Date(row.expires_at).getTime() > now;

  if (fresh && row) {
    return {
      ratings: row.ratings,
      source: "cache",
      expiresAt: row.expires_at,
    };
  }

  try {
    const ratings = await getFilmExternalRatings(tmdbId, {
      mediaType,
      skipCache: true,
    });
    await writeCacheRow(tmdbId, mediaType, ratings);
    return {
      ratings,
      source: "api",
      expiresAt: new Date(now + RATINGS_CACHE_TTL_MS).toISOString(),
    };
  } catch (err) {
    if (row) {
      console.warn(
        "[ratings-cache] API failed, serving stale",
        err instanceof Error ? err.message : err
      );
      return {
        ratings: row.ratings,
        source: "stale",
        expiresAt: row.expires_at,
      };
    }
    if (err instanceof MdbListApiError) throw err;
    throw new MdbListApiError(
      err instanceof Error ? err.message : "Failed to fetch ratings"
    );
  }
}
