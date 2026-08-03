"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { fetchBlockedUserIds } from "@/lib/user-blocks"
import { filmHref, seriesHref } from "@/lib/media-href"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"

type FriendWatch = {
  id: number
  tmdbId: number
  mediaType: "movie" | "tv"
  title: string
  originalTitle: string | null
  posterPath: string | null
  releaseDate: string | null
  username: string
}

export function HomeFriendsWatchedRail({ className }: { className?: string }) {
  const { t } = useT()
  const supabase = useSupabaseClient()
  const user = useUser()
  const [items, setItems] = useState<FriendWatch[]>([])
  const [loading, setLoading] = useState(Boolean(user?.id))

  useEffect(() => {
    if (!user?.id) {
      setItems([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        const blocked = await fetchBlockedUserIds(supabase, user.id)

        const { data: follows, error: followsError } = await supabase
          .from("user_followers")
          .select("user_id")
          .eq("follower_id", user.id)

        if (followsError) throw followsError

        const followingIds = (follows ?? [])
          .map((r) => r.user_id as string)
          .filter((id) => id && !blocked.has(id))

        if (!followingIds.length) {
          if (!cancelled) setItems([])
          return
        }

        const { data: watches, error: watchesError } = await supabase
          .from("items_interactions")
          .select(
            "id, tmdb_id, media_type, movie_title, original_title, original_name, poster_path, release_date, user_id, watched_date",
          )
          .in("user_id", followingIds.slice(0, 40))
          .eq("is_watched", true)
          .not("poster_path", "is", null)
          .order("watched_date", { ascending: false, nullsFirst: false })
          .limit(24)

        if (watchesError) throw watchesError

        const userIds = [
          ...new Set((watches ?? []).map((w) => w.user_id as string)),
        ]
        const { data: users } = await supabase
          .from("users")
          .select("id, username")
          .in(
            "id",
            userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"],
          )

        const usernameById = new Map(
          (users ?? []).map((u) => [u.id as string, u.username as string]),
        )

        const seenMedia = new Set<string>()
        const mapped: FriendWatch[] = []
        for (const w of watches ?? []) {
          const uid = w.user_id as string
          if (blocked.has(uid)) continue
          const username = usernameById.get(uid)
          if (!username) continue
          const mediaType = (w.media_type as string) === "tv" ? "tv" : "movie"
          const tmdbId = w.tmdb_id as number
          const key = `${mediaType}:${tmdbId}`
          if (seenMedia.has(key)) continue
          seenMedia.add(key)
          mapped.push({
            id: w.id as number,
            tmdbId,
            mediaType,
            title: (w.movie_title as string) || "",
            originalTitle:
              ((w.original_title as string | null) ??
                (w.original_name as string | null)) ||
              null,
            posterPath: (w.poster_path as string | null) ?? null,
            releaseDate: (w.release_date as string | null) ?? null,
            username,
          })
          if (mapped.length >= 12) break
        }

        if (!cancelled) setItems(mapped)
      } catch (e) {
        console.error("[home-friends-watched]", e)
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [supabase, user?.id])

  if (!user?.id) return null

  if (!loading && items.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {t("home.friendsWatchedEmpty")}
      </p>
    )
  }

  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      className={cn("w-full", className)}
    >
      <CarouselContent className="-ml-2">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <CarouselItem
                key={i}
                className="basis-[88px] pl-2 sm:basis-[100px]"
              >
                <div className="aspect-[2/3] w-full animate-pulse rounded-md bg-muted" />
              </CarouselItem>
            ))
          : items.map((item) => {
              const href =
                item.mediaType === "tv"
                  ? seriesHref({
                      id: item.tmdbId,
                      name: item.title,
                      original_name: item.originalTitle,
                      first_air_date: item.releaseDate,
                    })
                  : filmHref({
                      id: item.tmdbId,
                      title: item.title,
                      original_title: item.originalTitle,
                      release_date: item.releaseDate,
                    })
              return (
                <CarouselItem
                  key={item.id}
                  className="basis-[88px] pl-2 sm:basis-[100px]"
                >
                  <Link
                    href={href}
                    className="group block"
                    title={`@${item.username}`}
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-md border border-border bg-muted">
                      <img
                        src={
                          item.posterPath
                            ? `https://image.tmdb.org/t/p/w185${item.posterPath}`
                            : "/placeholder.png"
                        }
                        alt={item.title || ""}
                        className="size-full object-cover transition group-hover:opacity-90"
                      />
                    </div>
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      @{item.username}
                    </p>
                  </Link>
                </CarouselItem>
              )
            })}
      </CarouselContent>
    </Carousel>
  )
}
