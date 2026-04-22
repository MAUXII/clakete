import { NextResponse } from "next/server";
import { resolveOwnPlaybackUrl } from "@/lib/film-playback-sources";

/**
 * URL de arquivo/stream próprio (MP4 etc.). Ver também GET …/playback-options
 * para embeds (SuperFlix, VidSrc, overrides).
 *
 * FILM_PLAYBACK_URL_TEMPLATE=https://cdn…/filmes/{id}/main.mp4
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  const url = resolveOwnPlaybackUrl(id);
  return NextResponse.json({ url });
}
