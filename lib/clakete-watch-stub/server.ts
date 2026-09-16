import { NextResponse } from "next/server";

/** Stub server: APIs de playback vazias no showcase. */
export async function moviePlaybackOptionsGET() {
  return NextResponse.json({ ownUrl: null, iframeSources: [] });
}

export async function moviePlaybackGET() {
  return NextResponse.json({ url: null });
}

export async function seriesPlaybackOptionsGET() {
  return NextResponse.json({ ownUrl: null, iframeSources: [] });
}

export async function superflixGenresGET() {
  return NextResponse.json({ genres: [] });
}

export async function superflixMoviesGET() {
  return NextResponse.json({ items: [], total: 0 });
}

export async function superflixChannelsGET() {
  return NextResponse.json({ channels: [] });
}
