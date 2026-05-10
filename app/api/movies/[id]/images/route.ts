import { createTMDBClient } from '@/lib/tmdb/client'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url)
  const mediaType = searchParams.get('media_type') === 'tv' ? 'tv' : 'movie'
  const tmdb = createTMDBClient()
  const { id } = await params
  const images =
    mediaType === 'tv'
      ? await tmdb.getTvImages(id)
      : await tmdb.getMovieImages(id)
  return Response.json(images)
}
