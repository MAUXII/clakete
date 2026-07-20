"use client"

import { cloneElement, isValidElement, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { AnimatePresence, motion } from "framer-motion"
import {
  EyeOff,
  Flag,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
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
import { hasShiningAccess } from "@/lib/plans"
import {
  FeedEditDialog,
  type FeedEditPayload,
} from "@/components/home/feed-edit-dialog"
import {
  feedMediaHref,
  feedPostHref,
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
  onUpdated,
  highlighted = false,
}: {
  item: WatchedItem
  media: React.ReactNode
  onRemoved?: (interactionId: number) => void
  onUpdated?: () => void
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
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  const [localTitle, setLocalTitle] = useState(item.feedTitle)
  const [localCaption, setLocalCaption] = useState(item.feedCaption)
  const [localVisibility, setLocalVisibility] = useState(item.feedVisibility)
  const [heartBurst, setHeartBurst] = useState(false)
  const [heartKey, setHeartKey] = useState(0)

  useEffect(() => {
    setLiked(item.likedByMe)
    setLikeCount(item.likeCount)
    setCommentCount(item.commentCount)
    setLocalTitle(item.feedTitle)
    setLocalCaption(item.feedCaption)
    setLocalVisibility(item.feedVisibility)
  }, [
    item.likedByMe,
    item.likeCount,
    item.commentCount,
    item.interactionId,
    item.feedTitle,
    item.feedCaption,
    item.feedVisibility,
  ])

  const profileHref = feedProfileHref(item.user.username)
  const href = feedMediaHref(item.tmdbId, item.mediaType, item.title)
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

  /** Instagram-style: double-tap always likes (never unlikes) + heart burst */
  const likeFromDoubleTap = useCallback(async () => {
    setHeartKey((k) => k + 1)
    setHeartBurst(true)
    window.setTimeout(() => setHeartBurst(false), 900)

    if (!authUser?.id) {
      toast.error("Sign in to like posts")
      return
    }
    if (liked || liking) return

    setLiked(true)
    setLikeCount((c) => c + 1)
    setLiking(true)
    try {
      const { error } = await supabase.from("feed_post_likes").insert({
        interaction_id: item.interactionId,
        user_id: authUser.id,
      })
      if (error) throw error
    } catch (e) {
      console.error(e)
      setLiked(false)
      setLikeCount((c) => Math.max(0, c - 1))
      toast.error("Could not update like")
    } finally {
      setLiking(false)
    }
  }, [authUser?.id, item.interactionId, liked, liking, supabase])

  const mediaNode = isValidElement(media)
    ? cloneElement(media as React.ReactElement<{ onDoubleLike?: () => void }>, {
        onDoubleLike: likeFromDoubleTap,
      })
    : media

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

      const mapped: FeedComment[] = []
      for (const r of rows ?? []) {
        const u = usersMap.get(r.user_id as string)
        if (!u?.username) continue
        mapped.push({
          id: r.id as number,
          body: (r.body as string) || "",
          createdAt: r.created_at as string,
          user: {
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
          },
        })
      }

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
      onRemoved?.(item.interactionId)
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
      onRemoved?.(item.interactionId)
    } catch (e) {
      console.error(e)
      toast.error("Could not report post")
    } finally {
      setReporting(false)
    }
  }, [authUser?.id, isOwner, item.interactionId, onRemoved, supabase])

  const saveEdit = useCallback(
    async (payload: FeedEditPayload) => {
      if (!authUser?.id || !isOwner) return
      if (!payload.images.length) {
        toast.error("Pick at least one photo")
        return
      }
      setEditing(true)
      try {
        const primary = payload.images[0]
        const { error } = await supabase
          .from("items_interactions")
          .update({
            feed_title: payload.title || null,
            feed_caption: payload.caption || null,
            feed_layout: payload.layout,
            feed_visibility: payload.visibility,
            feed_images: payload.images.map((img) => ({
              filePath: img.filePath,
              kind: img.kind,
            })),
            feed_image_path: primary.filePath,
            feed_image_kind: primary.kind,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.interactionId)
          .eq("user_id", authUser.id)

        if (error) throw error
        setLocalTitle(payload.title || null)
        setLocalCaption(payload.caption || null)
        setLocalVisibility(payload.visibility)
        toast.success("Post updated")
        onUpdated?.()
      } catch (e) {
        console.error(e)
        toast.error("Could not update post")
        throw e
      } finally {
        setEditing(false)
      }
    },
    [authUser?.id, isOwner, item.interactionId, onUpdated, supabase],
  )

  return (
    <article
      id={item.shareUid ? `feed-p-${item.shareUid}` : `feed-post-${item.interactionId}`}
      data-feed-post={item.interactionId}
      data-feed-share={item.shareUid ?? undefined}
      className={cn(
        "scroll-mt-24 border-b border-border/80 py-4 last:border-0",
        highlighted && "feed-post-locate rounded-lg",
      )}
    >
      <div className="flex items-start gap-3">
        <Link href={profileHref} className="mt-0.5 shrink-0">
          <Avatar className="size-10 border border-border">
            <AvatarImage src={avatarDisplaySrc(item.user.avatar_url) ?? undefined} alt="" />
            <AvatarFallback className="bg-muted text-xs text-muted-foreground">
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
                  className="font-semibold text-foreground hover:text-brand"
                >
                  {name}
                </Link>
                {hasShiningAccess({
                  plan: item.user.plan,
                  plan_status: item.user.plan_status,
                  plan_current_period_end: item.user.plan_current_period_end,
                }) ? (
                  <ShiningBadge size="sm" className="translate-y-[-1px]" />
                ) : null}
                <span className="text-muted-foreground">@{item.user.username}</span>
                {when ? (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{when}</span>
                  </>
                ) : null}
              </header>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {action}{" "}
                <Link
                  href={href}
                  className="font-medium text-foreground transition-colors hover:text-brand"
                >
                  {item.title}
                </Link>
                {item.rewatchCount > 0 ? (
                  <span className="ml-1.5 rounded-full bg-brand/12 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-light">
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
                    className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted/50 hover:text-muted-foreground"
                    aria-label="Post options"
                    disabled={removing || editing}
                  >
                    {removing || editing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-4" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 size-3.5" />
                    Edit post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
                    className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted/50 hover:text-muted-foreground"
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

      <div className="relative">
        {mediaNode}
        <AnimatePresence>
          {heartBurst ? (
            <motion.div
              key={heartKey}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.15 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Heart
                className="size-24 fill-brand text-brand drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                strokeWidth={0}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {localTitle ? (
        <p className="mt-3 text-[15px] font-semibold leading-snug text-foreground">
          {localTitle}
        </p>
      ) : null}
      {localCaption ? (
        <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
          {localCaption}
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
              ? "text-brand"
              : "text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground",
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
              ? "text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground",
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
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-muted/50 hover:text-muted-foreground"
          aria-label="Share"
        >
          <Share className="size-3.5" strokeWidth={2} />
        </button>
      </footer>

      {commentsOpen ? (
        <div className="mt-3 space-y-3 rounded-xl border border-border/80 bg-muted/50 p-3">
          {commentsLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading comments…
            </div>
          ) : comments.length === 0 ? (
            <p className="py-1 text-xs text-muted-foreground">No comments yet.</p>
          ) : (
            <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {comments.map((c) => {
                const cName = displayName(c.user)
                const canDelete =
                  authUser?.id === c.user.id || authUser?.id === item.user.id
                return (
                  <li key={c.id} className="flex gap-2.5">
                    <Link href={feedProfileHref(c.user.username)} className="shrink-0">
                      <Avatar className="size-7 border border-border/80">
                        <AvatarImage
                          src={avatarDisplaySrc(c.user.avatar_url) ?? undefined}
                          alt=""
                        />
                        <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                          {cName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 text-[12px]">
                        <Link
                          href={feedProfileHref(c.user.username)}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {cName}
                        </Link>
                        <span className="text-muted-foreground">
                          {formatFeedRelativeTime(c.createdAt)}
                        </span>
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => void deleteComment(c.id)}
                            className="ml-auto text-[11px] text-muted-foreground hover:text-red-400"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                        {c.body}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="space-y-2 border-t border-border/80 pt-3">
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
              <span className="text-[11px] text-muted-foreground">
                {commentDraft.length}/{COMMENT_MAX} · Ctrl+Enter to post
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

      <FeedEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        filmTitle={item.title}
        tmdbId={item.tmdbId}
        mediaType={item.mediaType === "tv" ? "tv" : "movie"}
        loading={editing}
        initial={{
          images: item.feedImages.length
            ? item.feedImages
            : item.feedImagePath
              ? [
                  {
                    filePath: item.feedImagePath,
                    kind: item.feedImageKind ?? "backdrop",
                  },
                ]
              : item.posterPath
                ? [{ filePath: item.posterPath, kind: "poster" as const }]
                : [],
          title: localTitle ?? "",
          caption: localCaption ?? "",
          layout: item.feedLayout,
          visibility: localVisibility,
        }}
        onSave={saveEdit}
      />
    </article>
  )
}
