import { NextResponse } from "next/server";
import { listGenres, SuperflixApiError } from "@/lib/superflix";
import type { SuperflixCatalogCategory } from "@/lib/superflix";

const ALLOWED: SuperflixCatalogCategory[] = [
  "filme",
  "serie",
  "anime",
  "dorama",
];

export async function GET(request: Request) {
  const categoryParam =
    new URL(request.url).searchParams.get("category") ?? "filme";
  const category = ALLOWED.includes(categoryParam as SuperflixCatalogCategory)
    ? (categoryParam as SuperflixCatalogCategory)
    : "filme";

  try {
    const genres = await listGenres(category);
    return NextResponse.json({ genres });
  } catch (err) {
    const message =
      err instanceof SuperflixApiError
        ? err.message
        : "Falha ao listar gêneros";
    return NextResponse.json({ genres: [], error: message }, { status: 502 });
  }
}
