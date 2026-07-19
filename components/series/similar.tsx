import { SeriesCard } from './series-card'

interface SimilarSeries {
  name: string
  original_name?: string | null
  poster_path: string
  id: number
  first_air_date?: string | null
  vote_average?: number
}

export default function SimilarSeriesList({ series }: { series: { similar?: { results?: SimilarSeries[] } } }) {
  const similarSeries: SimilarSeries[] = series.similar?.results || []

  if (similarSeries.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-6">
      {similarSeries.map((item) => (
        <SeriesCard key={item.id} series={item} />
      ))}
    </div>
  )
}
