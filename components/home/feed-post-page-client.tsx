"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { FeedWatchedPostCard } from "@/components/home/feed-post-card"
import {
  WatchedMediaCarousel,
  watchedItemImages,
} from "@/components/home/feed-watched-media"
import {
  feedMediaHref,
  mapWatchedRow,
  WATCHED_FEED_SELECT,
  type FollowingFeedItem,
  type WatchedFeedRow,
} from "@/hooks/use-following-feed"

type WatchedItem = Extract<FollowingFeedItem, { kind: "watched" }>

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

export function FeedPostPageClient() {
  const params = useParams()
  const router = useRouter()
  const raw = params?.uid ?? params?.id
  const key = String(Array.isArray(raw) ? raw[0] : raw ?? "")

  const supabase = useSupabaseClient()
  const authUser = useUser()

  const [item, setItem] = useState<WatchedItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const load = useCallback(async () => {
    if (!key) {
      setError("Invalid post")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from("items_interactions")
        .select(WATCHED_FEED_SELECT)
        .eq("feed_shared", true)

      // /p/<uuid> or legacy /post/<numeric-id>
      if (isUuid(key)) {
        query = query.eq("feed_share_uid", key)
      } else if (/^\d+$/.test(key)) {
        query = query.eq("id", Number(key))
      } else {
        setError("Invalid post")
        setLoading(false)
        return
      }

      const { data: row, error: rowError } = await query.maybeSingle()

      if (rowError) throw rowError
      if (!row) {
        setError("Post not found or no longer shared")
        setItem(null)
        return
      }

      const watched = row as WatchedFeedRow
      const shareUid = watched.feed_share_uid

      // Legacy numeric URL → canonical /p/<uid>
      if (!isUuid(key) && shareUid) {
        setRedirecting(true)
        router.replace(`/p/${shareUid}`)
        return
      }

      // Ensure uid exists for older rows
      let resolvedUid = shareUid
      if (!resolvedUid) {
        resolvedUid = crypto.randomUUID()
        await supabase
          .from("items_interactions")
          .update({ feed_share_uid: resolvedUid })
          .eq("id", watched.id)
        watched.feed_share_uid = resolvedUid
      }

      const visibility =
        watched.feed_visibility === "public" ? "public" : "friends"

      if (visibility === "friends" && authUser?.id) {
        if (watched.user_id !== authUser.id) {
          const [{ data: iFollow }, { data: theyFollow }] = await Promise.all([
            supabase
              .from("user_followers")
              .select("user_id")
              .eq("follower_id", authUser.id)
              .eq("user_id", watched.user_id)
              .maybeSingle(),
            supabase
              .from("user_followers")
              .select("user_id")
              .eq("follower_id", watched.user_id)
              .eq("user_id", authUser.id)
              .maybeSingle(),
          ])
          if (!iFollow || !theyFollow) {
            setError("This post is only visible to mutual friends")
            setItem(null)
            return
          }
        }
      } else if (visibility === "friends" && !authUser?.id) {
        setError("Sign in to view this friends-only post")
        setItem(null)
        return
      }

      if (authUser?.id) {
        const { data: hidden } = await supabase
          .from("feed_post_hides")
          .select("id")
          .eq("user_id", authUser.id)
          .eq("interaction_id", watched.id)
          .maybeSingle()
        if (hidden) {
          setError("You hid this post")
          setItem(null)
          return
        }
      }

      // Logged-in: open home feed and locate this post
      if (authUser?.id && resolvedUid) {
        setRedirecting(true)
        router.replace(`/?p=${resolvedUid}`)
        return
      }

      const { data: author } = await supabase
        .from("users")
        .select("id, username, display_name, avatar_url")
        .eq("id", watched.user_id)
        .maybeSingle()

      if (!author?.username) {
        setError("Author not found")
        setItem(null)
        return
      }

      const [likesRes, commentsRes] = await Promise.all([
        supabase
          .from("feed_post_likes")
          .select("user_id")
          .eq("interaction_id", watched.id),
        supabase
          .from("feed_post_comments")
          .select("id")
          .eq("interaction_id", watched.id),
      ])

      const likeCount = likesRes.data?.length ?? 0
      const likedByMe = Boolean(
        authUser?.id &&
          likesRes.data?.some((r) => r.user_id === authUser.id),
      )
      const commentCount = commentsRes.data?.length ?? 0

      setItem(
        mapWatchedRow(
          watched,
          {
            id: author.id,
            username: author.username,
            display_name: author.display_name,
            avatar_url: author.avatar_url,
          },
          { likeCount, likedByMe, commentCount },
        ),
      )
    } catch (e) {
      console.error(e)
      setError("Could not load post")
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [authUser?.id, key, router, supabase])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-brand"
      >
        <ArrowLeft className="size-3.5" />
        Back to feed
      </Link>

      {loading || redirecting ? (
        <div className="flex items-center gap-2 py-16 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" />
          {redirecting ? "Opening in your feed…" : "Loading post…"}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-10 text-center">
          <p className="text-sm text-zinc-500">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-medium text-brand-light hover:text-brand"
          >
            Go home →
          </Link>
        </div>
      ) : item ? (
        <FeedWatchedPostCard
          item={item}
          onRemoved={() => {
            setItem(null)
            setError("Post removed from feed")
          }}
          onUpdated={() => void load()}
          media={
            <WatchedMediaCarousel
              href={feedMediaHref(item.tmdbId, item.mediaType, item.title)}
              filmTitle={item.title}
              layout={item.feedLayout}
              edgeToEdge={false}
              images={watchedItemImages(item)}
            />
          }
        />
      ) : null}
    </div>
  )
}
