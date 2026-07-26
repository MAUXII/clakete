"use client"

import { useCallback, useEffect, useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRive } from "@rive-app/react-canvas"
import { toast } from "sonner"

import { MovieCard } from "@/components/movies/movie-card"
import { SeriesCard } from "@/components/series/series-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/components/providers/i18n-provider"

type WatchedItem = {
  id: number
  tmdb_id: number
  poster_path: string | null
  movie_title: string | null
  original_title: string | null
  original_name: string | null
  release_date: string | null
  media_type: string | null
}

export function WatchedGrid({
  userId,
  isOwnProfile,
}: {
  userId: string
  username: string
  isOwnProfile: boolean
}) {
  const { t } = useT()
  const supabase = useSupabaseClient()
  const [items, setItems] = useState<WatchedItem[]>([])
  const [loading, setLoading] = useState(true)

  const { RiveComponent } = useRive({
    src: "/cat1.riv",
    artboard: "Artboard",
    stateMachines: ["State Machine 1"],
    autoplay: true,
  })

  const fetchWatched = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("items_interactions")
        .select(
          "id, tmdb_id, poster_path, movie_title, original_title, original_name, release_date, media_type, updated_at",
        )
        .eq("user_id", userId)
        .eq("is_watched", true)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setItems((data as WatchedItem[]) ?? [])
    } catch (err) {
      console.error(err)
      toast.error(t("common.errorGeneric"))
    } finally {
      setLoading(false)
    }
  }, [supabase, userId, t])

  useEffect(() => {
    setLoading(true)
    void fetchWatched()
  }, [fetchWatched])

  if (loading) {
    return (
      <div className="mt-4">
        <h2 className="text-sm font-medium uppercase text-muted-foreground/50">
          {t("watch.watchedTitle")}
        </h2>
        <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton
              key={i}
              className="relative aspect-[2/3] h-full w-full overflow-hidden rounded-[5px] border border-black/15 shadow-sm shadow-black/5 dark:border-white/15 dark:shadow-white/5"
            />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mt-4">
        <h2 className="text-sm font-medium uppercase text-muted-foreground/50">
          {t("watch.watchedTitle")}
        </h2>
        <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
        <div className="flex w-full items-start justify-between overflow-clip text-muted-foreground">
          <p className="w-full text-start">{t("watch.watchedEmpty")}</p>
          <RiveComponent width={400} className="invisible flex h-20 w-[222px] pl-9" />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium uppercase text-muted-foreground/50">
          {t("watch.watchedTitle")}
        </h2>
        <span className="text-xs text-muted-foreground/60">
          {items.length} {items.length === 1 ? "title" : "titles"}
        </span>
      </div>
      <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
        {items.map((item) => {
          const key = `${item.tmdb_id}-${item.media_type ?? "movie"}`
          const isTv = item.media_type === "tv"

          return isTv ? (
            <SeriesCard
              key={key}
              externalid={item.tmdb_id}
              series={{
                id: item.tmdb_id,
                name: item.movie_title ?? "",
                original_name: item.original_name,
                poster_path: item.poster_path,
                first_air_date: item.release_date,
              }}
            />
          ) : (
            <MovieCard
              key={key}
              externalid={item.tmdb_id}
              movie={{
                id: item.tmdb_id,
                title: item.movie_title ?? "",
                original_title: item.original_title,
                poster_path: item.poster_path,
                release_date: item.release_date,
                vote_average: 0,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
