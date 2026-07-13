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
      interactionId: number
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
      feedVisibility: "friends" | "public"
      /** Shown because visibility=public from someone you don't follow */
      fromDiscover?: boolean
      rewatchCount: number
      likeCount: number
      likedByMe: boolean
      commentCount: number
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
const PUBLIC_DISCOVER_LIMIT = 12
const STORY_NEW_MS = 72 * 60 * 60 * 1000

const WATCHED_FEED_SELECT =
  "id, user_id, tmdb_id, media_type, poster_path, movie_title, watched_date, rewatch_count, updated_at, created_at, is_watched, feed_shared, feed_image_path, feed_image_kind, feed_images, feed_title, feed_caption, feed_layout, feed_shared_at, feed_visibility"

type WatchedFeedRow = {
  id: number
  user_id: string
  tmdb_id: number
  media_type: string | null
  poster_path: string | null
  movie_title: string | null
  watched_date: string | null
  rewatch_count: number | null
  updated_at: string | null
  created_at: string | null
  feed_image_path: string | null
  feed_image_kind: string | null
  feed_images: unknown
  feed_title: string | null
  feed_caption: string | null
  feed_layout: string | null
  feed_shared_at: string | null
  feed_visibility: string | null
}

function parseFeedImages(raw: unknown): { filePath: string; kind: "poster" | "backdrop" }[] {
  if (!Array.isArray(raw)) return []
  return raw
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
        rec.kind === "poster" || rec.kind === "backdrop" ? rec.kind : null
      if (!filePath || !kind) return null
      return { filePath, kind }
    })
    .filter(
      (x): x is { filePath: string; kind: "poster" | "backdrop" } => Boolean(x),
    )
}

function mapWatchedRow(
  row: WatchedFeedRow,
  u: FollowingFeedUser,
  meta: {
    likeCount: number
    likedByMe: boolean
    commentCount: number
    fromDiscover?: boolean
  },
): Extract<FollowingFeedItem, { kind: "watched" }> {
  const at =
    row.feed_shared_at ||
    row.watched_date ||
    row.updated_at ||
    row.created_at ||
    new Date().toISOString()
  const kindRaw = row.feed_image_kind
  const feedImageKind =
    kindRaw === "poster" || kindRaw === "backdrop" ? kindRaw : null
  const feedImages = parseFeedImages(row.feed_images)
  const primaryPath = row.feed_image_path || feedImages[0]?.filePath || null
  const primaryKind = feedImageKind || feedImages[0]?.kind || null
  const interactionId = row.id

  return {
    kind: "watched",
    id: `watched-${interactionId}`,
    interactionId,
    at,
    user: u,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type ?? "movie",
    title: row.movie_title || "Untitled",
    posterPath: row.poster_path,
    feedImagePath: primaryPath,
    feedImageKind: primaryKind,
    feedImages:
      feedImages.length > 0
        ? feedImages
        : primaryPath && primaryKind
          ? [{ filePath: primaryPath, kind: primaryKind }]
          : [],
    feedTitle: row.feed_title?.trim() || null,
    feedCaption: row.feed_caption?.trim() || null,
    feedLayout: row.feed_layout === "collage" ? "collage" : "slide",
    feedVisibility: row.feed_visibility === "public" ? "public" : "friends",
    fromDiscover: meta.fromDiscover,
    rewatchCount: row.rewatch_count ?? 0,
    likeCount: meta.likeCount,
    likedByMe: meta.likedByMe,
    commentCount: meta.commentCount,
  }
}

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

      // Circle (following + self) + public discover from people you don't follow
      const [watchedRes, publicRes, followingUsersRes] = await Promise.all([
        supabase
          .from("items_interactions")
          .select(WATCHED_FEED_SELECT)
          .in("user_id", feedAuthorIds)
          .eq("is_watched", true)
          .eq("feed_shared", true)
          .order("feed_shared_at", { ascending: false, nullsFirst: false })
          .limit(FEED_FETCH_LIMIT),
        supabase
          .from("items_interactions")
          .select(WATCHED_FEED_SELECT)
          .eq("is_watched", true)
          .eq("feed_shared", true)
          .eq("feed_visibility", "public")
          .order("feed_shared_at", { ascending: false, nullsFirst: false })
          .limit(FEED_FETCH_LIMIT),
        supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .in("id", feedAuthorIds),
      ])

      if (watchedRes.error) throw watchedRes.error
      if (followingUsersRes.error) throw followingUsersRes.error

      const circleIds = new Set(feedAuthorIds)
      const circleRows = (watchedRes.data ?? []) as WatchedFeedRow[]
      const discoverRows = ((publicRes.error ? [] : publicRes.data) ?? [])
        .map((r) => r as WatchedFeedRow)
        .filter((r) => !circleIds.has(r.user_id as string))
        .slice(0, PUBLIC_DISCOVER_LIMIT)

      const allRows = [...circleRows, ...discoverRows]
      const seenIds = new Set<number>()
      const uniqueRows: WatchedFeedRow[] = []
      for (const row of allRows) {
        const id = row.id as number
        if (seenIds.has(id)) continue
        seenIds.add(id)
        uniqueRows.push(row)
      }

      const interactionIds = uniqueRows.map((r) => r.id as number)

      const likeCountById = new Map<number, number>()
      const likedByMe = new Set<number>()
      const commentCountById = new Map<number, number>()

      if (interactionIds.length > 0) {
        const [likesRes, commentsRes] = await Promise.all([
          supabase
            .from("feed_post_likes")
            .select("interaction_id, user_id")
            .in("interaction_id", interactionIds),
          supabase
            .from("feed_post_comments")
            .select("interaction_id")
            .in("interaction_id", interactionIds),
        ])

        if (!likesRes.error) {
          for (const row of likesRes.data ?? []) {
            const iid = row.interaction_id as number
            likeCountById.set(iid, (likeCountById.get(iid) ?? 0) + 1)
            if ((row.user_id as string) === user.id) likedByMe.add(iid)
          }
        }
        if (!commentsRes.error) {
          for (const row of commentsRes.data ?? []) {
            const iid = row.interaction_id as number
            commentCountById.set(iid, (commentCountById.get(iid) ?? 0) + 1)
          }
        }
      }

      const activityUserIds = [
        ...new Set(uniqueRows.map((r) => r.user_id as string)),
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

      const discoverIdSet = new Set(discoverRows.map((r) => r.id as number))

      for (const row of uniqueRows) {
        const u = users.get(row.user_id as string)
        if (!u?.username) continue
        const interactionId = row.id as number
        const fromDiscover = discoverIdSet.has(interactionId)
        const item = mapWatchedRow(row, {
          id: u.id,
          username: u.username,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
        }, {
          likeCount: likeCountById.get(interactionId) ?? 0,
          likedByMe: likedByMe.has(interactionId),
          commentCount: commentCountById.get(interactionId) ?? 0,
          fromDiscover,
        })
        if (!fromDiscover) bumpActivity(u.id, item.at)
        feed.push(item)
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
