"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { RatingStars } from "@/components/movies/star-rating"
import {
  EyeOff,
  Flag,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { ShiningBadge } from "@/components/premium/shining-badge"
import { feedMediaFrameClass } from "@/components/home/feed-watched-media"
import {
  feedListHref,
  feedMediaHref,
  feedPostHref,
  feedProfileHref,
  formatFeedRelativeTime,
  type FollowingFeedItem,
  type FollowingFeedUser,
} from "@/hooks/use-following-feed"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { hasShiningAccess } from "@/lib/plans"
import { cn } from "@/lib/utils"

function FeedShiningMark({ user }: { user: FollowingFeedUser }) {
  if (
    !hasShiningAccess({
      plan: user.plan,
      plan_status: user.plan_status,
      plan_current_period_end: user.plan_current_period_end,
    })
  ) {
    return null
  }
  return <ShiningBadge size="sm" className="translate-y-[-1px]" />
}

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

type ReviewItem = Extract<FollowingFeedItem, { kind: "review" }>
type ListItem = Extract<FollowingFeedItem, { kind: "list" }>

export function FeedReviewPostCard({
  item,
  onRemoved,
  highlighted = false,
}: {
  item: ReviewItem
  onRemoved?: () => void
  highlighted?: boolean
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
  const [hiding, setHiding] = useState(false)
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    setLiked(item.likedByMe)
    setLikeCount(item.likeCount)
    setCommentCount(item.commentCount)
  }, [item.likedByMe, item.likeCount, item.commentCount, item.interactionId])

  const profileHref = feedProfileHref(item.user.username)
  const href = feedMediaHref(item.tmdbId, item.mediaType, item.title)
  const name = displayName(item.user)
  const when = formatFeedRelativeTime(item.at)
  const isOwner = Boolean(authUser?.id && authUser.id === item.user.id)
  const rating = item.rating ?? 0

  const toggleLike = useCallback(async () => {
    if (!authUser?.id || liking) return
    setLiking(true)
    const next = !liked
    setLiked(next)
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)))
    try {
      if (next) {
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
      setLiked(!next)
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)))
      toast.error("Could not update like")
    } finally {
      setLiking(false)
    }
  }, [authUser?.id, item.interactionId, liked, liking, supabase])

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    try {
      const { data, error } = await supabase
        .from("feed_post_comments")
        .select("id, body, created_at, user_id")
        .eq("interaction_id", item.interactionId)
        .order("created_at", { ascending: true })
      if (error) throw error

      const rows = data ?? []
      const userIds = [...new Set(rows.map((r) => r.user_id as string))]
      let users: {
        id: string
        username: string
        display_name?: string | null
        avatar_url?: string | null
      }[] = []
      if (userIds.length > 0) {
        const { data: u } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds)
        users = u ?? []
      }
      const byId = new Map(users.map((u) => [u.id, u]))
      setComments(
        rows.map((r) => {
          const u = byId.get(r.user_id as string)
          return {
            id: r.id as number,
            body: r.body as string,
            createdAt: r.created_at as string,
            user: {
              id: (u?.id ?? r.user_id) as string,
              username: u?.username ?? "user",
              display_name: u?.display_name,
              avatar_url: u?.avatar_url,
            },
          }
        }),
      )
    } catch (e) {
      console.error(e)
      toast.error("Could not load comments")
    } finally {
      setCommentsLoading(false)
    }
  }, [item.interactionId, supabase])

  const openComments = () => {
    const next = !commentsOpen
    setCommentsOpen(next)
    if (next) void loadComments()
  }

  const submitComment = useCallback(async () => {
    if (!authUser?.id || !commentDraft.trim()) return
    setPostingComment(true)
    try {
      const { data, error } = await supabase
        .from("feed_post_comments")
        .insert({
          interaction_id: item.interactionId,
          user_id: authUser.id,
          body: commentDraft.trim().slice(0, COMMENT_MAX),
        })
        .select("id, body, created_at")
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.interactionId)
        .eq("user_id", authUser.id)
      if (error) throw error
      toast.success("Removed from feed")
      onRemoved?.()
    } catch (e) {
      console.error(e)
      toast.error("Could not remove post")
    } finally {
      setRemoving(false)
    }
  }, [authUser?.id, isOwner, item.interactionId, onRemoved, supabase])

  const hidePost = useCallback(async () => {
    if (!authUser?.id || isOwner) return
    setHiding(true)
    try {
      const { error } = await supabase.from("feed_post_hides").insert({
        interaction_id: item.interactionId,
        user_id: authUser.id,
      })
      if (error) throw error
      toast.success("Post hidden")
      onRemoved?.()
    } catch (e) {
      console.error(e)
      toast.error("Could not hide post")
    } finally {
      setHiding(false)
    }
  }, [authUser?.id, isOwner, item.interactionId, onRemoved, supabase])

  const reportPost = useCallback(async () => {
    if (!authUser?.id || isOwner) return
    setReporting(true)
    try {
      const { error } = await supabase.from("feed_post_reports").insert({
        reporter_id: authUser.id,
        interaction_id: item.interactionId,
        reason: "other",
      })
      if (error) throw error
      toast.success("Report submitted")
      onRemoved?.()
    } catch (e) {
      console.error(e)
      toast.error("Could not report post")
    } finally {
      setReporting(false)
    }
  }, [authUser?.id, isOwner, item.interactionId, onRemoved, supabase])

  return (
    <article
      id={item.shareUid ? `feed-p-${item.shareUid}` : `feed-post-${item.interactionId}`}
      data-feed-post={item.interactionId}
      data-feed-share={item.shareUid ?? undefined}
      className={cn(
        "scroll-mt-24 border-b border-white/[0.06] py-4 last:border-0",
        highlighted && "feed-post-locate rounded-lg",
      )}
    >
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
                  className="font-semibold text-zinc-100 hover:text-brand"
                >
                  {name}
                </Link>
                <FeedShiningMark user={item.user} />
                <span className="text-zinc-600">@{item.user.username}</span>
                {when ? (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-600">{when}</span>
                  </>
                ) : null}
              </header>
              <p className="mt-0.5 text-[13px] text-zinc-500">
                reviewed{" "}
                <Link
                  href={href}
                  className="font-medium text-zinc-100 transition-colors hover:text-brand"
                >
                  {item.title}
                </Link>
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
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
                    aria-label="Post options"
                    disabled={hiding || reporting}
                  >
                    {hiding || reporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-4" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => void hidePost()}>
                    <EyeOff className="mr-2 size-3.5" />
                    Hide post
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300"
                    onClick={() => void reportPost()}
                  >
                    <Flag className="mr-2 size-3.5" />
                    Report post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <Link href={href} className="relative h-28 w-[76px] shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-zinc-950">
          {item.posterPath ? (
            <Image
              src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
              alt=""
              fill
              className="object-cover"
              sizes="76px"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-1 text-center text-[10px] text-zinc-600">
              {item.title}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          {rating > 0 ? (
            <RatingStars
              value={rating}
              className="mb-1.5"
              starClassName="h-3.5 w-3.5"
              emptyClassName="text-zinc-700"
            />
          ) : null}
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-200">
            {item.review}
          </p>
        </div>
      </div>

      <footer className="mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => void toggleLike()}
          disabled={liking}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition",
            liked
              ? "text-brand"
              : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
          )}
          aria-label="Like"
        >
          <Heart className={cn("size-3.5", liked && "fill-brand")} strokeWidth={2} />
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
              let uid = item.shareUid
              if (!uid) {
                uid = crypto.randomUUID()
                const { error } = await supabase
                  .from("items_interactions")
                  .update({ feed_share_uid: uid })
                  .eq("id", item.interactionId)
                if (error) throw error
              }
              await navigator.clipboard.writeText(
                `${window.location.origin}${feedPostHref(uid)}`,
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
                          className="font-medium text-zinc-200 hover:text-brand"
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
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-600">
                {commentDraft.length}/{COMMENT_MAX}
              </span>
              <Button
                type="button"
                size="sm"
                className="bg-brand text-white hover:bg-brand-hover"
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

export function FeedListPostCard({
  item,
  onRemoved,
}: {
  item: ListItem
  onRemoved?: () => void
}) {
  const supabase = useSupabaseClient()
  const authUser = useUser()
  const [removing, setRemoving] = useState(false)
  const [hiding, setHiding] = useState(false)
  const [reporting, setReporting] = useState(false)

  const profileHref = feedProfileHref(item.user.username)
  const href = feedListHref(item)
  const name = displayName(item.user)
  const when = formatFeedRelativeTime(item.at)
  const isOwner = Boolean(authUser?.id && authUser.id === item.user.id)
  const posters = item.listPosters.slice(0, 4)

  const removeFromFeed = useCallback(async () => {
    if (!authUser?.id || !isOwner) return
    setRemoving(true)
    try {
      const { error } = await supabase
        .from("lists")
        .update({
          feed_shared: false,
          feed_shared_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.listId)
        .eq("user_id", authUser.id)
      if (error) throw error
      toast.success("Removed from feed")
      onRemoved?.()
    } catch (e) {
      console.error(e)
      toast.error("Could not remove post")
    } finally {
      setRemoving(false)
    }
  }, [authUser?.id, isOwner, item.listId, onRemoved, supabase])

  const hidePost = useCallback(async () => {
    if (!authUser?.id || isOwner) return
    setHiding(true)
    try {
      const { error } = await supabase.from("feed_list_hides").insert({
        list_id: item.listId,
        user_id: authUser.id,
      })
      if (error) throw error
      toast.success("Post hidden")
      onRemoved?.()
    } catch (e) {
      console.error(e)
      toast.error("Could not hide post")
    } finally {
      setHiding(false)
    }
  }, [authUser?.id, isOwner, item.listId, onRemoved, supabase])

  const reportPost = useCallback(async () => {
    if (!authUser?.id || isOwner) return
    setReporting(true)
    try {
      const { error } = await supabase.from("feed_post_reports").insert({
        reporter_id: authUser.id,
        list_id: item.listId,
        reason: "other",
      })
      if (error) throw error
      toast.success("Report submitted")
      onRemoved?.()
    } catch (e) {
      console.error(e)
      toast.error("Could not report post")
    } finally {
      setReporting(false)
    }
  }, [authUser?.id, isOwner, item.listId, onRemoved, supabase])

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
                  className="font-semibold text-zinc-100 hover:text-brand"
                >
                  {name}
                </Link>
                <FeedShiningMark user={item.user} />
                <span className="text-zinc-600">@{item.user.username}</span>
                {when ? (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-600">{when}</span>
                  </>
                ) : null}
              </header>
              <p className="mt-0.5 text-[13px] text-zinc-500">shared a list</p>
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
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
                    aria-label="Post options"
                    disabled={hiding || reporting}
                  >
                    {hiding || reporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-4" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => void hidePost()}>
                    <EyeOff className="mr-2 size-3.5" />
                    Hide post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300"
                    onClick={() => void reportPost()}
                  >
                    <Flag className="mr-2 size-3.5" />
                    Report post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <Link href={href} className={feedMediaFrameClass}>
        <div className="aspect-[16/9] w-full">
          {posters.length > 0 ? (
            <div
              className={cn(
                "grid h-full w-full gap-0.5",
                posters.length === 1 && "grid-cols-1",
                posters.length === 2 && "grid-cols-2",
                posters.length >= 3 && "grid-cols-2 grid-rows-2",
              )}
            >
              {posters.map((path, i) => (
                <div
                  key={`${path}-${i}`}
                  className={cn(
                    "relative overflow-hidden bg-zinc-900",
                    posters.length === 3 && i === 0 && "row-span-2",
                  )}
                >
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${path}`}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 280px"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-900 text-sm text-zinc-600">
              {item.listTitle}
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3">
        <Link
          href={href}
          className="text-[15px] font-semibold leading-snug text-zinc-100 hover:text-brand"
        >
          {item.listTitle}
        </Link>
        <p className="mt-0.5 text-[13px] text-zinc-500">
          {item.filmsCount} {item.filmsCount === 1 ? "title" : "titles"}
        </p>
      </div>

      <footer className="mt-3 flex items-center justify-end">
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
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
          aria-label="Share"
        >
          <Share className="size-3.5" strokeWidth={2} />
        </button>
      </footer>
    </article>
  )
}
