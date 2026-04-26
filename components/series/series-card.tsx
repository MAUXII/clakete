import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'

interface SeriesCardProps {
  series?: {
    id?: number
    name: string
    poster_path: string | null
    vote_average?: number
  }
  variant?: 'default' | 'nav-fill'
}

export function SeriesCard({ series: show, variant = 'default' }: SeriesCardProps) {
  const isNavFill = variant === 'nav-fill'

  return (
    <Link
      href={`/series/${show?.id || 0}`}
      className={cn(
        'group flex flex-col gap-2 transition-transform duration-300',
        isNavFill && 'h-full min-h-0',
      )}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden border-[1px] border-black/15 shadow-black/5 dark:border-white/15 dark:shadow-white/5 shadow-sm',
          isNavFill
            ? 'h-full min-h-0 flex-1 rounded-xl aspect-auto'
            : 'h-full rounded-[5px] aspect-[2/3]',
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {show?.poster_path ? (
          <Image
            src={
              show.poster_path
                ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                : '/placeholder.png'
            }
            alt={show.name || 'Series poster'}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
            className="w-full transition-all h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-medium text-2xl bg-muted-foreground/10">
            ?
          </div>
        )}

        {show?.vote_average ? (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge variant="secondary" className="font-medium text-[#FF0048] rounded-sm">
              {show.vote_average.toFixed(1)} ★
            </Badge>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
