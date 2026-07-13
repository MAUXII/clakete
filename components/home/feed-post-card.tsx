"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import {
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Share,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  feedMediaHref,
  feedProfileHref,
  formatFeedRelativeTime,
  type FollowingFeedItem,
} from "@/hooks/use-following-feed"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { cn } from "@/lib/utils"

const COMMENT_MAX = 500

type FeedComment = {
  id: number
  body: string
  createdAt: string
  user: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
  }
}

function displayName(user: { username: string; display_name?: string | null }) {
  return user.display_name?.trim() || user.username
}

type WatchedItem = Extract<FollowingFeedItem, { kind: "watched" }>

/** Media renderer is injected by SocialFeed to avoid duplicating carousel code. */
export function FeedWatchedPostCard({
  item,
  media,
  onRemoved,
}: {
  item: WatchedItem
  media: React.ReactNode
  onRemoved?: (interactionId: number) => void
}) {
  const supabase = useSupabaseClient()
  const authUser = useUser()

  const [liked, setLiked] = useState(item.likedByMe)
  const [likeCount, setLikeCount] = useState(item.likeCount)
  const [liking, setLiking] = useState(false)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<FeedComment[]>([])
  const [commentCount, setCommentCount] = useState(item.commentCount)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentDraft, setCommentDraft] = useState("")
  const [postingComment, setPostingComment] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    setLiked(item.likedByMe)
    setLikeCount(item.likeCount)
    setCommentCount(item.commentCount)
  }, [item.likedByMe, item.likeCount, item.commentCount, item.interactionId])

  const profileHref = feedProfileHref(item.user.username)
  const href = feedMediaHref(item.tmdbId, item.mediaType)
  const name = displayName(item.user)
  const when = formatFeedRelativeTime(item.at)
  const isOwner = Boolean(authUser?.id && authUser.id === item.user.id)

  const action = item.rewatchCount > 0 ? "rewatched" : "watched"

  const toggleLike = useCallback(async () => {
    if (!authUser?.id) {
      toast.error("Sign in to like posts")
      return
    }
    if (liking) return

    const nextLiked = !liked
    setLiked(nextLiked)
    setLikeCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)))
    setLiking(true)

    try {
      if (nextLiked) {
        const { error } = await supabase.from("feed_post_likes").insert({
          interaction_id: item.interactionId,
          user_id: authUser.id,
        })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("feed_post_likes")
          .delete()
          .eq("interaction_id", item.interactionId)
          .eq("user_id", authUser.id)
        if (error) throw error
      }
    } catch (e) {
      console.error(e)
      setLiked(!nextLiked)
      setLikeCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
      toast.error("Could not update like")
    } finally {
      setLiking(false)
    }
  }, [authUser?.id, item.interactionId, liked, liking, supabase])

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from("feed_post_comments")
        .select("id, body, created_at, user_id")
        .eq("interaction_id", item.interactionId)
        .order("created_at", { ascending: true })
        .limit(80)

      if (error) throw error

      const userIds = [...new Set((rows ?? []).map((r) => r.user_id as string))]
      let usersMap = new Map<
        string,
        {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
        }
      >()

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds)
        usersMap = new Map((users ?? []).map((u) => [u.id, u]))
      }

      const mapped: FeedComment[] = (rows ?? [])
        .map((r) => {
          const u = usersMap.get(r.user_id as string)
          if (!u?.username) return null
          return {
            id: r.id as number,
            body: (r.body as string) || "",
            createdAt: r.created_at as string,
            user: {
              id: u.id,
              username: u.username,
              display_name: u.display_name,
              avatar_url: u.avatar_url,
            },
          }
        })
        .filter((c): c is FeedComment => Boolean(c))

      setComments(mapped)
      setCommentCount(mapped.length)
    } catch (e) {
      console.error(e)
      toast.error("Could not load comments")
    } finally {
      setCommentsLoading(false)
    }
  }, [item.interactionId, supabase])

  const openComments = useCallback(() => {
    setCommentsOpen((open) => {
      const next = !open
      if (next) void loadComments()
      return next
    })
  }, [loadComments])

  const submitComment = useCallback(async () => {
    if (!authUser?.id) {
      toast.error("Sign in to comment")
      return
    }
    const body = commentDraft.trim()
    if (!body) return
    if (body.length > COMMENT_MAX) {
      toast.error(`Comment must be under ${COMMENT_MAX} characters`)
      return
    }

    setPostingComment(true)
    try {
      const { data, error } = await supabase
        .from("feed_post_comments")
        .insert({
          interaction_id: item.interactionId,
          user_id: authUser.id,
          body,
        })
        .select("id, body, created_at, user_id")
        .single()

      if (error) throw error

                    setComments((prev) => [
        ...prev,
        {
          id: data.id as number,
          body: data.body as string,
          createdAt: data.created_at as string,
          user: {
            id: authUser.id,
            username: "you",
            display_name: null,
            avatar_url: null,
          },
        },
      ])
      setCommentCount((c) => c + 1)
      setCommentDraft("")
      void loadComments()
    } catch (e) {
      console.error(e)
      toast.error("Could not post comment")
    } finally {
      setPostingComment(false)
    }
  }, [authUser, commentDraft, item.interactionId, loadComments, supabase])

  const deleteComment = useCallback(
    async (commentId: number) => {
      try {
        const { error } = await supabase
          .from("feed_post_comments")
          .delete()
          .eq("id", commentId)
        if (error) throw error
        setComments((prev) => prev.filter((c) => c.id !== commentId))
        setCommentCount((c) => Math.max(0, c - 1))
      } catch (e) {
        console.error(e)
        toast.error("Could not delete comment")
      }
    },
    [supabase],
  )

  const removeFromFeed = useCallback(async () => {
    if (!authUser?.id || !isOwner) return
    setRemoving(true)
    try {
      const { error } = await supabase
        .from("items_interactions")
        .update({
          feed_shared: false,
          feed_shared_at: null,
          feed_image_path: null,
          feed_image_kind: null,
          feed_images: [],
          feed_title: null,
          feed_caption: null,
          feed_layout: "slide",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.interactionId)
        .eq("user_id", authUser.id)

      if (error) throw error
      toast.success("Removed from feed")
      onRemoved?.(item.interactionId)
    } catch (e) {
      console.error(e)
      toast.error("Could not remove post")
    } finally {
      setRemoving(false)
    }
  }, [authUser?.id, isOwner, item.interactionId, onRemoved, supabase])

  return (
    <article className="border-b border-white/[0.06] py-4 last:border-0">
      <div className="flex items-start gap-3">
        <Link href={profileHref} className="mt-0.5 shrink-0">
          <Avatar className="size-10 border border-white/[0.08]">
            <AvatarImage src={avatarDisplaySrc(item.user.avatar_url) ?? undefined} alt="" />
            <AvatarFallback className="bg-zinc-900 text-xs text-zinc-300">
              {name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <header className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[13px] leading-snug">
                <Link
                  href={profileHref}
                  className="font-semibold text-zinc-100 hover:text-[#FF0048]"
                >
                  {name}
                </Link>
                <span className="text-zinc-600">@{item.user.username}</span>
                {when ? (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-600">{when}</span>
                  </>
                ) : null}
              </header>
              <p className="mt-0.5 text-[13px] text-zinc-500">
                {action}{" "}
                <Link
                  href={href}
                  className="font-medium text-zinc-100 transition-colors hover:text-[#FF0048]"
                >
                  {item.title}
                </Link>
                {item.rewatchCount > 0 ? (
                  <span className="ml-1.5 rounded-full bg-[#FF0048]/12 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#ff9eb0]">
                    rewatch
                  </span>
                ) : null}
              </p>
            </div>

            {isOwner ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
                    aria-label="Post options"
                    disabled={removing}
                  >
                    {removing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-4" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300"
                    onClick={() => void removeFromFeed()}
                  >
                    <Trash2 className="mr-2 size-3.5" />
                    Remove from feed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </div>

      {media}

      {item.feedTitle ? (
        <p className="mt-3 text-[15px] font-semibold leading-snug text-zinc-100">
          {item.feedTitle}
        </p>
      ) : null}
      {item.feedCaption ? (
        <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-300">
          {item.feedCaption}
        </p>
      ) : null}

      <footer className="mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => void toggleLike()}
          disabled={liking}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition",
            liked
              ? "text-[#FF0048]"
              : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
          )}
          aria-label="Like"
        >
          <Heart className={cn("size-3.5", liked && "fill-[#FF0048]")} strokeWidth={2} />
          {likeCount > 0 ? <span>{likeCount}</span> : null}
        </button>
        <button
          type="button"
          onClick={openComments}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition",
            commentsOpen
              ? "text-zinc-200"
              : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
          )}
          aria-label="Comment"
        >
          <MessageCircle className="size-3.5" strokeWidth={2} />
          {commentCount > 0 ? <span>{commentCount}</span> : null}
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${window.location.origin}${href}`,
              )
              toast.success("Link copied")
            } catch {
              toast.message("Could not copy link")
            }
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
          aria-label="Share"
        >
          <Share className="size-3.5" strokeWidth={2} />
        </button>
      </footer>

      {commentsOpen ? (
        <div className="mt-3 space-y-3 rounded-xl border border-white/[0.06] bg-zinc-950/50 p-3">
          {commentsLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-zinc-500">
              <Loader2 className="size-3.5 animate-spin" />
              Loading comments…
            </div>
          ) : comments.length === 0 ? (
            <p className="py-1 text-xs text-zinc-500">No comments yet.</p>
          ) : (
            <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {comments.map((c) => {
                const cName = displayName(c.user)
                const canDelete =
                  authUser?.id === c.user.id || authUser?.id === item.user.id
                return (
                  <li key={c.id} className="flex gap-2.5">
                    <Link href={feedProfileHref(c.user.username)} className="shrink-0">
                      <Avatar className="size-7 border border-white/[0.06]">
                        <AvatarImage
                          src={avatarDisplaySrc(c.user.avatar_url) ?? undefined}
                          alt=""
                        />
                        <AvatarFallback className="bg-zinc-900 text-[9px] text-zinc-400">
                          {cName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 text-[12px]">
                        <Link
                          href={feedProfileHref(c.user.username)}
                          className="font-medium text-zinc-200 hover:text-[#FF0048]"
                        >
                          {cName}
                        </Link>
                        <span className="text-zinc-600">
                          {formatFeedRelativeTime(c.createdAt)}
                        </span>
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => void deleteComment(c.id)}
                            className="ml-auto text-[11px] text-zinc-600 hover:text-red-400"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-300">
                        {c.body}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="space-y-2 border-t border-white/[0.06] pt-3">
            <Textarea
              value={commentDraft}
              maxLength={COMMENT_MAX}
              disabled={postingComment}
              placeholder="Write a comment…"
              className="min-h-[72px] resize-none bg-transparent text-sm"
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  void submitComment()
                }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-600">
                {commentDraft.length}/{COMMENT_MAX} · Ctrl+Enter to post
              </span>
              <Button
                type="button"
                size="sm"
                className="bg-[#FF0048] text-white hover:bg-[#e60042]"
                disabled={postingComment || !commentDraft.trim()}
                onClick={() => void submitComment()}
              >
                {postingComment ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}
