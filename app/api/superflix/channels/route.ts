import { NextResponse } from "next/server";
import {
  listChannelCategories,
  listChannels,
  SuperflixApiError,
} from "@/lib/superflix";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre")?.trim() || undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const includeCategories = searchParams.get("categories") === "1";

  try {
    const channels = await listChannels({ genre, q });

    let categories: Awaited<ReturnType<typeof listChannelCategories>> | undefined;
    if (includeCategories) {
      try {
        categories = await listChannelCategories();
      } catch {
        categories = undefined;
      }
    }

    return NextResponse.json({
      channels,
      categories,
    });
  } catch (err) {
    const message =
      err instanceof SuperflixApiError
        ? err.message
        : "Falha ao listar canais";
    console.error("[superflix/channels]", message, err);
    return NextResponse.json(
      { channels: [], error: message },
      { status: 502 }
    );
  }
}
