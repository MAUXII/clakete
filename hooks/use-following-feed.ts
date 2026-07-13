"use client"

import { useCallback, useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { listPublicHref, userProfilePath } from "@/lib/list-href"
import { formatWatchedDate } from "@/lib/watched-date"

export type FollowingFeedUser = {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
}

export type FollowingStoryPerson = FollowingFeedUser & {
  hasNew: boolean
  lastAt: string | null
}

export type FollowingFeedItem =
  | {
      kind: "review"
      id: string
      at: string
      user: FollowingFeedUser
      tmdbId: number
      mediaType: string | null
      title: string
      posterPath: string | null
      rating: number | null
      review: string
    }
  | {
      kind: "watched"
      id: string
      at: string
      user: FollowingFeedUser
      tmdbId: number
      mediaType: string | null
      title: string
      posterPath: string | null
      /** Chosen feed image (backdrop preferred); falls back to posterPath in UI. */
      feedImagePath: string | null
      feedImageKind: "poster" | "backdrop" | null
      feedImages: { filePath: string; kind: "poster" | "backdrop" }[]
      feedTitle: string | null
      feedCaption: string | null
      feedLayout: "slide" | "collage"
      rewatchCount: number
    }
  | {
      kind: "list"
      id: string
      at: string
      user: FollowingFeedUser
      listId: string
      listTitle: string
      listSlug: string | null
      filmsCount: number
      posterPath: string | null
      listPosters: string[]
    }

const FEED_FETCH_LIMIT = 40
const STORY_NEW_MS = 72 * 60 * 60 * 1000

function toUserMap(
  rows: { id: string; username: string; display_name?: string | null; avatar_url?: string | null }[],
) {
  return new Map(rows.map((u) => [u.id, u]))
}

export function formatFeedRelativeTime(iso: string): string {
  const raw = iso.length <= 10 ? `${iso}T12:00:00` : iso
  const t = new Date(raw).getTime()
  if (Number.isNaN(t)) return formatWatchedDate(iso.slice(0, 10)) ?? ""
  const diff = Date.now() - t
  if (diff < 0) return formatWatchedDate(iso.slice(0, 10)) ?? ""
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return formatWatchedDate(iso.slice(0, 10)) ?? ""
}

export function useFollowingFeed(limit = 20) {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [items, setItems] = useState<FollowingFeedItem[]>([])
  const [stories, setStories] = useState<FollowingStoryPerson[]>([])
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(limit)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      setStories([])
      setFollowingCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: follows, error: followsError } = await supabase
        .from("user_followers")
        .select("user_id")
        .eq("follower_id", user.id)

      if (followsError) throw followsError

      const followingIds = (follows ?? [])
        .map((row) => row.user_id as string)
        .filter(Boolean)

      setFollowingCount(followingIds.length)

      // Include self so your own shared posts appear in the home feed
      const feedAuthorIds = [...new Set([...followingIds, user.id])]

      // Only opt-in shared watches — reviews/lists no longer auto-appear
      const [watchedRes, followingUsersRes] = await Promise.all([
        supabase
          .from("items_interactions")
          .select(
            "id, user_id, tmdb_id, media_type, poster_path, movie_title, watched_date, rewatch_count, updated_at, created_at, is_watched, feed_shared, feed_image_path, feed_image_kind, feed_images, feed_title, feed_caption, feed_layout, feed_shared_at, feed_visibility",
          )
          .in("user_id", feedAuthorIds)
          .eq("is_watched", true)
          .eq("feed_shared", true)
          .order("feed_shared_at", { ascending: false, nullsFirst: false })
          .limit(FEED_FETCH_LIMIT),
        supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .in("id", feedAuthorIds),
      ])

      if (watchedRes.error) throw watchedRes.error
      if (followingUsersRes.error) throw followingUsersRes.error

      const activityUserIds = [
        ...new Set((watchedRes.data ?? []).map((r) => r.user_id as string)),
      ]

      const missingIds = activityUserIds.filter(
        (id) => !(followingUsersRes.data ?? []).some((u) => u.id === id),
      )

      let extraUsers: {
        id: string
        username: string
        display_name?: string | null
        avatar_url?: string | null
      }[] = []

      if (missingIds.length > 0) {
        const { data } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .in("id", missingIds)
        extraUsers = data ?? []
      }

      const users = toUserMap([...(followingUsersRes.data ?? []), ...extraUsers])

      const feed: FollowingFeedItem[] = []
      const lastActivity = new Map<string, string>()

      const bumpActivity = (userId: string, at: string) => {
        const prev = lastActivity.get(userId)
        if (!prev || new Date(at).getTime() > new Date(prev).getTime()) {
          lastActivity.set(userId, at)
        }
      }

      for (const row of watchedRes.data ?? []) {
        const u = users.get(row.user_id as string)
        if (!u?.username) continue
        const at =
          (row.feed_shared_at as string | null) ||
          (row.watched_date as string | null) ||
          (row.updated_at as string) ||
          (row.created_at as string)
        const kindRaw = row.feed_image_kind as string | null
        const feedImageKind =
          kindRaw === "poster" || kindRaw === "backdrop" ? kindRaw : null

        const feedImagesRaw = row.feed_images
        const feedImages: { filePath: string; kind: "poster" | "backdrop" }[] =
          Array.isArray(feedImagesRaw)
            ? feedImagesRaw
                .map((entry) => {
                  if (!entry || typeof entry !== "object") return null
                  const rec = entry as Record<string, unknown>
                  const filePath =
                    typeof rec.filePath === "string"
                      ? rec.filePath
                      : typeof rec.path === "string"
                        ? rec.path
                        : null
                  const kind =
                    rec.kind === "poster" || rec.kind === "backdrop"
                      ? rec.kind
                      : null
                  if (!filePath || !kind) return null
                  return { filePath, kind }
                })
                .filter(
                  (x): x is { filePath: string; kind: "poster" | "backdrop" } =>
                    Boolean(x),
                )
            : []

        const primaryPath =
          (row.feed_image_path as string | null) ||
          feedImages[0]?.filePath ||
          null
        const primaryKind =
          feedImageKind || feedImages[0]?.kind || null

        bumpActivity(u.id, at)
        feed.push({
          kind: "watched",
          id: `watched-${row.id}`,
          at,
          user: {
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
          },
          tmdbId: row.tmdb_id as number,
          mediaType: (row.media_type as string | null) ?? "movie",
          title: (row.movie_title as string) || "Untitled",
          posterPath: (row.poster_path as string | null) ?? null,
          feedImagePath: primaryPath,
          feedImageKind: primaryKind,
          feedImages:
            feedImages.length > 0
              ? feedImages
              : primaryPath && primaryKind
                ? [{ filePath: primaryPath, kind: primaryKind }]
                : [],
          feedTitle: ((row.feed_title as string | null) ?? null)?.trim() || null,
          feedCaption:
            ((row.feed_caption as string | null) ?? null)?.trim() || null,
          feedLayout:
            (row.feed_layout as string) === "collage" ? "collage" : "slide",
          rewatchCount: (row.rewatch_count as number) ?? 0,
        })
      }

      feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      setItems(feed)

      const now = Date.now()
      const followingIdSet = new Set(followingIds)
      const storyPeople: FollowingStoryPerson[] = (followingUsersRes.data ?? [])
        .filter((u) => Boolean(u.username) && followingIdSet.has(u.id))
        .map((u) => {
          const lastAt = lastActivity.get(u.id) ?? null
          const hasNew = lastAt
            ? now - new Date(lastAt).getTime() < STORY_NEW_MS
            : false
          return {
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            hasNew,
            lastAt,
          }
        })
        .sort((a, b) => {
          if (a.hasNew !== b.hasNew) return a.hasNew ? -1 : 1
          const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0
          const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0
          return tb - ta
        })

      setStories(storyPeople)
    } catch (e) {
      console.error("[following-feed]", e)
      setError(e instanceof Error ? e.message : "Could not load feed")
      setItems([])
      setStories([])
    } finally {
      setLoading(false)
    }
  }, [supabase, user?.id])

  useEffect(() => {
    setVisibleLimit(limit)
  }, [limit])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const loadMore = useCallback(() => {
    setVisibleLimit((n) => n + 10)
  }, [])

  const visibleItems = items.slice(0, visibleLimit)

  return {
    items: visibleItems,
    stories,
    followingCount,
    loading,
    error,
    hasMore: items.length > visibleLimit,
    loadMore,
    refresh,
  }
}

export function feedMediaHref(tmdbId: number, mediaType: string | null) {
  return mediaType === "tv" ? `/series/${tmdbId}` : `/film/${tmdbId}`
}

export function feedListHref(item: Extract<FollowingFeedItem, { kind: "list" }>) {
  return listPublicHref({
    id: item.listId,
    slug: item.listSlug,
    userData: { username: item.user.username },
  })
}

export function feedProfileHref(username: string) {
  return userProfilePath(username)
}
