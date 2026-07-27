import { NextResponse } from "next/server";
import {
  buildMoviePlayerUrl,
  listCatalogIds,
  SuperflixApiError,
} from "@/lib/superflix";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genero = searchParams.get("genero")?.trim() || undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const idType =
    searchParams.get("type") === "tmdb" ? ("tmdb" as const) : ("imdb" as const);
  const limitRaw = parseInt(searchParams.get("limit") ?? "40", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 100)
    : 40;

  try {
    const ids = await listCatalogIds({
      category: "filme",
      idType,
      genero,
      q,
    });
    const sliced = ids.slice(0, limit);
    const items = sliced.map((id) => ({
      id,
      playerUrl: buildMoviePlayerUrl(id),
    }));
    return NextResponse.json({
      items,
      total: ids.length,
      type: idType,
      genero: genero ?? null,
    });
  } catch (err) {
    const message =
      err instanceof SuperflixApiError
        ? err.message
        : "Falha ao listar filmes";
    return NextResponse.json(
      { items: [], total: 0, error: message },
      { status: 502 }
    );
  }
}
