"use client"

import { useEffect, useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRive } from "@rive-app/react-canvas"
import { toast } from "sonner"
import { MovieCard } from "../movies/movie-card"
import { SeriesCard } from "../series/series-card"
import { Skeleton } from "../ui/skeleton"

interface WatchedItem {
  id: number
  tmdb_id: number
  poster_path: string | null
  movie_title: string | null
  release_date: string | null
  media_type: string | null
  created_at: string
}

interface RecentActivityProps {
  userId: string
  /** Página /watched ou /activity: lista completa. Perfil: preview limitado. */
  showAllWatched?: boolean
}

const RECENT_LIMIT = 60

export function UserRecentActivity({ userId, showAllWatched }: RecentActivityProps) {
  const [watchedItems, setWatchedItems] = useState<WatchedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(showAllWatched ? 999 : RECENT_LIMIT)
  const supabase = useSupabaseClient()

  const { RiveComponent } = useRive({
    src: "/cat1.riv",
    artboard: "Artboard",
    stateMachines: ["State Machine 1"],
    autoplay: true,
  })

  useEffect(() => {
    setVisibleCount(showAllWatched ? 999 : RECENT_LIMIT)
  }, [showAllWatched, userId])

  useEffect(() => {
    const fetchWatched = async () => {
      try {
        const { data: interactions, error } = await supabase
          .from("items_interactions")
          .select(
            "id, tmdb_id, poster_path, movie_title, release_date, media_type, created_at",
          )
          .eq("user_id", userId)
          .eq("is_watched", true)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Erro ao buscar assistidos:", error)
          toast.error("Could not load watched titles")
          return
        }

        setWatchedItems((interactions as WatchedItem[]) ?? [])
      } catch (err) {
        console.error("Erro ao buscar assistidos:", err)
        toast.error("Could not load watched titles")
      } finally {
        setLoading(false)
      }
    }

    void fetchWatched()
  }, [userId, supabase])

  const pageTitle = showAllWatched ? "Watched" : "Recent Activity"
  const visibleItems = watchedItems.slice(0, visibleCount)
  const hasMore = !showAllWatched && watchedItems.length > visibleCount

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4">
        {[...Array(12)].map((_, i) => (
          <Skeleton
            key={i}
            className="relative aspect-[2/3] h-full w-full overflow-hidden rounded-[5px] border border-black/15 shadow-sm shadow-black/5 dark:border-white/15 dark:shadow-white/5"
          />
        ))}
      </div>
    )
  }

  if (watchedItems.length === 0) {
    return (
      <div className="mt-4">
        <h2 className="text-sm font-medium uppercase text-muted-foreground/50">{pageTitle}</h2>
        <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
        <div className="flex w-full items-start justify-between overflow-clip text-muted-foreground">
          <p className="w-full text-start">
            {showAllWatched ? "Nothing watched yet" : "No activity"}
          </p>
          <RiveComponent width={400} className="invisible flex h-20 w-[222px] pl-9" />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <h2 className="text-sm font-medium uppercase text-muted-foreground/50">{pageTitle}</h2>
      <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4">
        {visibleItems.map((item) => {
          const key = `${item.tmdb_id}-${item.media_type ?? "movie"}-${item.id}`
          const isTv = item.media_type === "tv"

          if (isTv) {
            return (
              <SeriesCard
                key={key}
                externalid={item.tmdb_id}
                series={{
                  id: item.tmdb_id,
                  name: item.movie_title ?? "",
                  poster_path: item.poster_path,
                  first_air_date: item.release_date,
                }}
              />
            )
          }

          return (
            <MovieCard
              key={key}
              externalid={item.tmdb_id}
              movie={{
                id: item.tmdb_id,
                title: item.movie_title ?? "",
                poster_path: item.poster_path,
                vote_average: 0,
              }}
            />
          )
        })}
      </div>

      {hasMore ? (
        <div className="mt-2 flex w-full items-center justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount(watchedItems.length)}
            className="flex h-12 w-full items-center justify-center rounded-md border border-black/10 bg-[#FF0048]/10 p-3 text-[#FF0048] transition-all hover:bg-[#FF0048]/20 hover:text-[#FF0048]/90 dark:border-white/10"
          >
            + See more
          </button>
        </div>
      ) : null}
    </div>
  )
}
