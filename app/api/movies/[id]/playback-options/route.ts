import { NextResponse } from "next/server";
import {
  mergeIframeSources,
  resolveOwnPlaybackUrl,
} from "@/lib/film-playback-sources";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json(
      { ownUrl: null, iframeSources: [] },
      { status: 400 }
    );
  }

  const ownUrl = resolveOwnPlaybackUrl(id);
  const tmdbId = parseInt(id, 10);
  const iframeSources = mergeIframeSources(tmdbId, id);

  return NextResponse.json({ ownUrl, iframeSources });
}
