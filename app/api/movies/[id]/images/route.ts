import { createTMDBClient } from '@/lib/tmdb/client'

export const dynamic = 'force-dynamic'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tmdb = createTMDBClient()
  const { id } = await params;
  const images = await tmdb.getMovieImages(id)
  return Response.json(images)
}
