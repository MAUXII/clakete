"use client"

import { useCallback, useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { listPublicHref, userProfilePath } from "@/lib/list-href"
import { formatWatchedDate } from "@/lib/watched-date"
import { fetchBlockedUserIds } from "@/lib/user-blocks"
import { filmHref, seriesHref } from "@/lib/media-href"

export type FollowingFeedUser = {
  id: string
  username: string
  display_name?: string | null
  avatar_url?: string | null
  plan?: string | null
  plan_status?: string | null
  plan_current_period_end?: string | null
}

export type FollowingStoryPerson = FollowingFeedUser & {
  hasNew: boolean
  lastAt: string | null
}

export type FollowingFeedItem =
  | {
      kind: "review"
      id: string
      interactionId: number
      shareUid: string | null
      at: string
      user: FollowingFeedUser
      tmdbId: number
      mediaType: string | null
      title: string
      posterPath: string | null
      rating: number | null
      review: string
      feedVisibility: "friends" | "public"
      fromDiscover?: boolean
      likeCount: number
      likedByMe: boolean
      commentCount: number
    }
  | {
      kind: "watched"
      id: string
      interactionId: number
      shareUid: string | null
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
      feedVisibility: "friends" | "public"
      fromDiscover?: boolean
    }

const FEED_FETCH_LIMIT = 40
const PUBLIC_DISCOVER_LIMIT = 12
const STORY_NEW_MS = 72 * 60 * 60 * 1000

export const WATCHED_FEED_SELECT =
  "id, user_id, tmdb_id, media_type, poster_path, movie_title, watched_date, rewatch_count, updated_at, created_at, is_watched, rating, review, feed_shared, feed_image_path, feed_image_kind, feed_images, feed_title, feed_caption, feed_layout, feed_shared_at, feed_visibility, feed_share_uid"

const LIST_FEED_SELECT =
  "id, user_id, title, slug, is_public, feed_shared, feed_shared_at, feed_visibility, updated_at, created_at"

export type WatchedFeedRow = {
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
  is_watched: boolean | null
  rating: number | null
  review: string | null
  feed_image_path: string | null
  feed_image_kind: string | null
  feed_images: unknown
  feed_title: string | null
  feed_caption: string | null
  feed_layout: string | null
  feed_shared_at: string | null
  feed_visibility: string | null
  feed_share_uid: string | null
}

type ListFeedRow = {
  id: string
  user_id: string
  title: string
  slug: string | null
  is_public: boolean
  feed_shared_at: string | null
  feed_visibility: string | null
  updated_at: string | null
  created_at: string | null
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

function hasFeedMedia(row: WatchedFeedRow): boolean {
  return parseFeedImages(row.feed_images).length > 0 || Boolean(row.feed_image_path)
}

function hasReviewText(row: WatchedFeedRow): boolean {
  return Boolean(row.review?.trim())
}

export function mapWatchedRow(
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
    shareUid: row.feed_share_uid || null,
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

function mapReviewRow(
  row: WatchedFeedRow,
  u: FollowingFeedUser,
  meta: {
    likeCount: number
    likedByMe: boolean
    commentCount: number
    fromDiscover?: boolean
  },
): Extract<FollowingFeedItem, { kind: "review" }> {
  const interactionId = row.id
  const at =
    row.feed_shared_at ||
    row.updated_at ||
    row.created_at ||
    new Date().toISOString()

  return {
    kind: "review",
    id: `review-${interactionId}`,
    interactionId,
    shareUid: row.feed_share_uid || null,
    at,
    user: u,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type ?? "movie",
    title: row.movie_title || "Untitled",
    posterPath: row.poster_path,
    rating: row.rating,
    review: row.review?.trim() || "",
    feedVisibility: row.feed_visibility === "public" ? "public" : "friends",
    fromDiscover: meta.fromDiscover,
    likeCount: meta.likeCount,
    likedByMe: meta.likedByMe,
    commentCount: meta.commentCount,
  }
}

function mapListRow(
  row: ListFeedRow,
  u: FollowingFeedUser,
  meta: {
    filmsCount: number
    posters: string[]
    fromDiscover?: boolean
  },
): Extract<FollowingFeedItem, { kind: "list" }> {
  const at =
    row.feed_shared_at ||
    row.updated_at ||
    row.created_at ||
    new Date().toISOString()

  return {
    kind: "list",
    id: `list-${row.id}`,
    at,
    user: u,
    listId: row.id,
    listTitle: row.title,
    listSlug: row.slug,
    filmsCount: meta.filmsCount,
    posterPath: meta.posters[0] ?? null,
    listPosters: meta.posters,
    feedVisibility: row.feed_visibility === "public" ? "public" : "friends",
    fromDiscover: meta.fromDiscover,
  }
}

function toUserMap(
  rows: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    plan?: string | null
    plan_status?: string | null
    plan_current_period_end?: string | null
  }[],
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

      const followingIdsRaw = (follows ?? [])
        .map((row) => row.user_id as string)
        .filter(Boolean)

      const blockedIds = await fetchBlockedUserIds(supabase, user.id)

      const followingIds = followingIdsRaw.filter((id) => !blockedIds.has(id))

      setFollowingCount(followingIds.length)

      const { data: followersRows, error: followersError } = await supabase
        .from("user_followers")
        .select("follower_id")
        .eq("user_id", user.id)

      if (followersError) throw followersError

      const followerIdSet = new Set(
        (followersRows ?? [])
          .map((row) => row.follower_id as string)
          .filter((id) => id && !blockedIds.has(id)),
      )
      const mutualIds = new Set(
        followingIds.filter((id) => followerIdSet.has(id)),
      )

      const feedAuthorIds = [...new Set([...followingIds, user.id])]

      const [
        interactionsRes,
        publicInteractionsRes,
        listsRes,
        publicListsRes,
        followingUsersRes,
      ] = await Promise.all([
        supabase
          .from("items_interactions")
          .select(WATCHED_FEED_SELECT)
          .in("user_id", feedAuthorIds)
          .eq("feed_shared", true)
          .order("feed_shared_at", { ascending: false, nullsFirst: false })
          .limit(FEED_FETCH_LIMIT),
        supabase
          .from("items_interactions")
          .select(WATCHED_FEED_SELECT)
          .eq("feed_shared", true)
          .eq("feed_visibility", "public")
          .order("feed_shared_at", { ascending: false, nullsFirst: false })
          .limit(FEED_FETCH_LIMIT),
        supabase
          .from("lists")
          .select(LIST_FEED_SELECT)
          .in("user_id", feedAuthorIds)
          .eq("feed_shared", true)
          .order("feed_shared_at", { ascending: false, nullsFirst: false })
          .limit(FEED_FETCH_LIMIT),
        supabase
          .from("lists")
          .select(LIST_FEED_SELECT)
          .eq("feed_shared", true)
          .eq("feed_visibility", "public")
          .order("feed_shared_at", { ascending: false, nullsFirst: false })
          .limit(FEED_FETCH_LIMIT),
        supabase
          .from("users")
          .select("id, username, display_name, avatar_url, plan, plan_status, plan_current_period_end")
          .in("id", feedAuthorIds),
      ])

      if (interactionsRes.error) throw interactionsRes.error
      if (followingUsersRes.error) throw followingUsersRes.error

      const circleIds = new Set(feedAuthorIds)
      const circleRows = (interactionsRes.data ?? []) as WatchedFeedRow[]
      const discoverRows = ((publicInteractionsRes.error ? [] : publicInteractionsRes.data) ?? [])
        .map((r) => r as WatchedFeedRow)
        .filter(
          (r) =>
            !circleIds.has(r.user_id as string) &&
            !blockedIds.has(r.user_id as string),
        )
        .slice(0, PUBLIC_DISCOVER_LIMIT)

      const allRows = [...circleRows, ...discoverRows]
      const seenIds = new Set<number>()
      const uniqueRows: WatchedFeedRow[] = []
      for (const row of allRows) {
        const id = row.id as number
        if (seenIds.has(id)) continue
        if (blockedIds.has(row.user_id as string)) continue
        seenIds.add(id)
        uniqueRows.push(row)
      }

      const circleLists = ((listsRes.error ? [] : listsRes.data) ?? []) as ListFeedRow[]
      const discoverLists = ((publicListsRes.error ? [] : publicListsRes.data) ?? [])
        .map((r) => r as ListFeedRow)
        .filter(
          (r) =>
            !circleIds.has(r.user_id as string) &&
            !blockedIds.has(r.user_id as string),
        )
        .slice(0, PUBLIC_DISCOVER_LIMIT)

      const allLists = [...circleLists, ...discoverLists]
      const seenListIds = new Set<string>()
      const uniqueLists: ListFeedRow[] = []
      for (const row of allLists) {
        if (seenListIds.has(row.id)) continue
        if (blockedIds.has(row.user_id as string)) continue
        seenListIds.add(row.id)
        uniqueLists.push(row)
      }

      const interactionIds = uniqueRows.map((r) => r.id as number)
      const listIds = uniqueLists.map((r) => r.id)

      const likeCountById = new Map<number, number>()
      const likedByMe = new Set<number>()
      const commentCountById = new Map<number, number>()
      const hiddenIds = new Set<number>()
      const hiddenListIds = new Set<string>()
      const postersByListId = new Map<string, string[]>()
      const countByListId = new Map<string, number>()

      const metaPromises: PromiseLike<unknown>[] = []

      if (interactionIds.length > 0) {
        metaPromises.push(
          Promise.all([
            supabase
              .from("feed_post_likes")
              .select("interaction_id, user_id")
              .in("interaction_id", interactionIds),
            supabase
              .from("feed_post_comments")
              .select("interaction_id")
              .in("interaction_id", interactionIds),
            supabase
              .from("feed_post_hides")
              .select("interaction_id")
              .eq("user_id", user.id)
              .in("interaction_id", interactionIds),
          ]).then(([likesRes, commentsRes, hidesRes]) => {
            if (!hidesRes.error) {
              for (const row of hidesRes.data ?? []) {
                hiddenIds.add(row.interaction_id as number)
              }
            }
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
          }),
        )
      }

      if (listIds.length > 0) {
        metaPromises.push(
          Promise.all([
            supabase
              .from("list_items")
              .select("list_id, poster_path, position")
              .in("list_id", listIds)
              .order("position", { ascending: true }),
            supabase
              .from("feed_list_hides")
              .select("list_id")
              .eq("user_id", user.id)
              .in("list_id", listIds),
          ]).then(([itemsRes, listHidesRes]) => {
            if (!listHidesRes.error) {
              for (const row of listHidesRes.data ?? []) {
                hiddenListIds.add(row.list_id as string)
              }
            }
            if (!itemsRes.error) {
              for (const row of itemsRes.data ?? []) {
                const lid = row.list_id as string
                countByListId.set(lid, (countByListId.get(lid) ?? 0) + 1)
                const path = row.poster_path as string | null
                if (!path) continue
                const arr = postersByListId.get(lid) ?? []
                if (arr.length < 5) {
                  arr.push(path)
                  postersByListId.set(lid, arr)
                }
              }
            }
          }),
        )
      }

      await Promise.all(metaPromises)

      const activityUserIds = [
        ...new Set([
          ...uniqueRows.map((r) => r.user_id as string),
          ...uniqueLists.map((r) => r.user_id as string),
        ]),
      ]

      const missingIds = activityUserIds.filter(
        (id) => !(followingUsersRes.data ?? []).some((u) => u.id === id),
      )

      let extraUsers: {
        id: string
        username: string
        display_name?: string | null
        avatar_url?: string | null
        plan?: string | null
        plan_status?: string | null
        plan_current_period_end?: string | null
      }[] = []

      if (missingIds.length > 0) {
        const { data } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url, plan, plan_status, plan_current_period_end")
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
      const discoverListIdSet = new Set(discoverLists.map((r) => r.id))

      const passesVisibility = (
        visibility: "friends" | "public",
        authorId: string,
      ) => {
        if (visibility === "friends" && authorId !== user.id && !mutualIds.has(authorId)) {
          return false
        }
        return true
      }

      for (const row of uniqueRows) {
        const u = users.get(row.user_id as string)
        if (!u?.username) continue
        const interactionId = row.id as number
        if (hiddenIds.has(interactionId)) continue

        const visibility =
          row.feed_visibility === "public" ? "public" : "friends"
        if (!passesVisibility(visibility, u.id)) continue

        const reviewText = hasReviewText(row)
        const media = hasFeedMedia(row)
        const watched = Boolean(row.is_watched) || media

        // Prefer media/watched card when customize photos exist; else review card
        const asReview = reviewText && !media
        if (!asReview && !watched && !reviewText) continue

        const fromDiscover = discoverIdSet.has(interactionId)
        const feedUser = {
          id: u.id,
          username: u.username,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
          plan: u.plan,
          plan_status: u.plan_status,
          plan_current_period_end: u.plan_current_period_end,
        }
        const meta = {
          likeCount: likeCountById.get(interactionId) ?? 0,
          likedByMe: likedByMe.has(interactionId),
          commentCount: commentCountById.get(interactionId) ?? 0,
          fromDiscover,
        }

        const item = asReview
          ? mapReviewRow(row, feedUser, meta)
          : mapWatchedRow(row, feedUser, meta)

        if (!fromDiscover) bumpActivity(u.id, item.at)
        feed.push(item)
      }

      for (const row of uniqueLists) {
        const u = users.get(row.user_id as string)
        if (!u?.username) continue
        if (hiddenListIds.has(row.id)) continue

        const visibility =
          row.feed_visibility === "public" ? "public" : "friends"
        if (!passesVisibility(visibility, u.id)) continue

        const fromDiscover = discoverListIdSet.has(row.id)
        const item = mapListRow(
          row,
          {
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            plan: u.plan,
            plan_status: u.plan_status,
            plan_current_period_end: u.plan_current_period_end,
          },
          {
            filmsCount: countByListId.get(row.id) ?? 0,
            posters: postersByListId.get(row.id) ?? [],
            fromDiscover,
          },
        )
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

export function feedPostHref(shareUid: string) {
  return `/p/${shareUid}`
}

export function feedMediaHref(
  tmdbId: number,
  mediaType: string | null,
  title?: string | null,
) {
  return mediaType === "tv"
    ? seriesHref({ id: tmdbId, name: title })
    : filmHref({ id: tmdbId, title })
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
