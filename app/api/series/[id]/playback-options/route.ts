import { NextResponse } from "next/server";
import { mergeSeriesEpisodeIframeSources } from "@/lib/series-playback-sources";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json(
      { ownUrl: null, iframeSources: [] },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const seasonRaw = parseInt(searchParams.get("season") ?? "1", 10);
  const episodeRaw = parseInt(searchParams.get("episode") ?? "1", 10);
  const season = Number.isFinite(seasonRaw) ? Math.max(seasonRaw, 0) : 1;
  const episode = Number.isFinite(episodeRaw) ? Math.max(episodeRaw, 1) : 1;

  const tmdbId = parseInt(id, 10);
  const iframeSources = await mergeSeriesEpisodeIframeSources(
    tmdbId,
    season,
    episode
  );

  return NextResponse.json({
    ownUrl: null,
    iframeSources,
    season,
    episode,
  });
}
