"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  feedMediaHref,
  feedProfileHref,
  formatFeedRelativeTime,
  mapWatchedRow,
  WATCHED_FEED_SELECT,
  type FollowingStoryPerson,
  type WatchedFeedRow,
  type FollowingFeedItem,
} from "@/hooks/use-following-feed"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { cn } from "@/lib/utils"

const STORY_MS = 5500

type StoryPost = Extract<FollowingFeedItem, { kind: "watched" }>

function displayName(user: { username: string; display_name?: string | null }) {
  return user.display_name?.trim() || user.username
}

export function FeedStoriesViewer({
  open,
  onOpenChange,
  person,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: FollowingStoryPerson | null
}) {
  const supabase = useSupabaseClient()
  const authUser = useUser()
  const [posts, setPosts] = useState<StoryPost[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const load = useCallback(async () => {
    if (!person?.id) return
    setLoading(true)
    setIndex(0)
    setProgress(0)
    try {
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      const recent = await supabase
        .from("items_interactions")
        .select(WATCHED_FEED_SELECT)
        .eq("user_id", person.id)
        .eq("feed_shared", true)
        .gte("feed_shared_at", since)
        .order("feed_shared_at", { ascending: false })
        .limit(8)

      if (recent.error) throw recent.error

      let data = recent.data
      if (!data?.length) {
        const fallback = await supabase
          .from("items_interactions")
          .select(WATCHED_FEED_SELECT)
          .eq("user_id", person.id)
          .eq("feed_shared", true)
          .order("feed_shared_at", { ascending: false })
          .limit(5)
        if (fallback.error) throw fallback.error
        data = fallback.data
      }

      let theyFollowMe = false
      if (authUser?.id) {
        const { data: back } = await supabase
          .from("user_followers")
          .select("user_id")
          .eq("follower_id", person.id)
          .eq("user_id", authUser.id)
          .maybeSingle()
        theyFollowMe = Boolean(back)
      }

      const rows = ((data ?? []) as WatchedFeedRow[]).filter((row) => {
        if (row.feed_visibility === "public") return true
        // Friends: need mutual follow
        return theyFollowMe
      })

      const interactionIds = rows.map((r) => r.id)

      const likeCountById = new Map<number, number>()
      const likedByMe = new Set<number>()
      const commentCountById = new Map<number, number>()

      if (interactionIds.length > 0 && authUser?.id) {
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
        for (const row of likesRes.data ?? []) {
          const iid = row.interaction_id as number
          likeCountById.set(iid, (likeCountById.get(iid) ?? 0) + 1)
          if (row.user_id === authUser.id) likedByMe.add(iid)
        }
        for (const row of commentsRes.data ?? []) {
          const iid = row.interaction_id as number
          commentCountById.set(iid, (commentCountById.get(iid) ?? 0) + 1)
        }
      }

      const mapped = rows.map((row) =>
        mapWatchedRow(
          row,
          {
            id: person.id,
            username: person.username,
            display_name: person.display_name,
            avatar_url: person.avatar_url,
          },
          {
            likeCount: likeCountById.get(row.id) ?? 0,
            likedByMe: likedByMe.has(row.id),
            commentCount: commentCountById.get(row.id) ?? 0,
          },
        ),
      )
      setPosts(mapped)
    } catch (e) {
      console.error("[stories]", e)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [authUser?.id, person, supabase])

  useEffect(() => {
    if (open && person) void load()
  }, [open, person, load])

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= posts.length - 1) {
        onOpenChange(false)
        return i
      }
      return i + 1
    })
    setProgress(0)
  }, [onOpenChange, posts.length])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
    setProgress(0)
  }, [])

  useEffect(() => {
    if (!open || loading || posts.length === 0) return
    setProgress(0)
    const started = Date.now()
    const tick = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / STORY_MS)
      setProgress(p)
      if (p >= 1) {
        window.clearInterval(tick)
        goNext()
      }
    }, 50)
    return () => window.clearInterval(tick)
  }, [open, loading, posts.length, index, goNext])

  const current = posts[index]
  const img =
    current?.feedImages[0] ||
    (current?.feedImagePath
      ? {
          filePath: current.feedImagePath,
          kind: current.feedImageKind ?? ("backdrop" as const),
        }
      : current?.posterPath
        ? { filePath: current.posterPath, kind: "poster" as const }
        : null)

  const size = img?.kind === "poster" ? "w780" : "w1280"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-md overflow-hidden border-0 bg-black p-0 sm:rounded-2xl">
        <DialogTitle className="sr-only">
          {person ? `Stories from @${person.username}` : "Stories"}
        </DialogTitle>

        <div className="relative aspect-[9/16] max-h-[90vh] w-full bg-zinc-950">
          <div className="absolute left-2 right-2 top-2 z-20 flex gap-1">
            {posts.map((_, i) => (
              <div
                key={i}
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25"
              >
                <div
                  className="h-full bg-white transition-[width] duration-75 ease-linear"
                  style={{
                    width:
                      i < index
                        ? "100%"
                        : i === index
                          ? `${progress * 100}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {person ? (
            <div className="absolute left-3 right-12 top-5 z-20 flex items-center gap-2">
              <Avatar className="size-8 border border-white/20">
                <AvatarImage
                  src={avatarDisplaySrc(person.avatar_url) ?? undefined}
                  alt=""
                />
                <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-300">
                  {displayName(person)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link
                href={feedProfileHref(person.username)}
                className="truncate text-sm font-semibold text-white"
                onClick={() => onOpenChange(false)}
              >
                {displayName(person)}
              </Link>
              {current ? (
                <span className="text-xs text-white/60">
                  {formatFeedRelativeTime(current.at)}
                </span>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            className="absolute right-2 top-4 z-20 rounded-full bg-black/40 p-1.5 text-white"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Loading…
            </div>
          ) : !current || !img ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm text-zinc-400">No recent shared posts.</p>
              {person ? (
                <Link
                  href={feedProfileHref(person.username)}
                  className="text-sm text-brand-light"
                  onClick={() => onOpenChange(false)}
                >
                  View profile →
                </Link>
              ) : null}
            </div>
          ) : (
            <>
              <Image
                src={`https://image.tmdb.org/t/p/${size}${img.filePath}`}
                alt={current.title}
                fill
                className="object-cover"
                quality={90}
                sizes="420px"
                priority
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                <p className="text-sm text-white/70">
                  watched{" "}
                  <Link
                    href={feedMediaHref(current.tmdbId, current.mediaType, current.title)}
                    className="pointer-events-auto font-semibold text-white"
                    onClick={() => onOpenChange(false)}
                  >
                    {current.title}
                  </Link>
                </p>
                {current.feedTitle ? (
                  <p className="mt-1 text-base font-semibold text-white">
                    {current.feedTitle}
                  </p>
                ) : null}
                {current.feedCaption ? (
                  <p className="mt-1 line-clamp-3 text-sm text-white/80">
                    {current.feedCaption}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                className="absolute inset-y-0 left-0 z-10 w-1/3"
                aria-label="Previous"
                onClick={goPrev}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 z-10 w-1/3"
                aria-label="Next"
                onClick={goNext}
              />
            </>
          )}

          {posts.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white"
                onClick={goPrev}
                aria-label="Previous story"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white"
                onClick={goNext}
                aria-label="Next story"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
