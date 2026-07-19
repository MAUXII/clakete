import { SeriesCard } from './series-card'

interface RecommendedSeries {
  name: string
  original_name?: string | null
  poster_path: string
  id: number
  first_air_date?: string | null
  vote_average?: number
}

export default function RecommendedSeriesList({ series }: { series: { recommendations?: { results?: RecommendedSeries[] } } }) {
  const recommendedSeries: RecommendedSeries[] = series.recommendations?.results || []

  if (recommendedSeries.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-6">
      {recommendedSeries.map((item) => (
        <SeriesCard key={item.id} series={item} />
      ))}
    </div>
  )
}
