"use client"

import { useCallback, useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/**
 * Like/unlike a review (items_interactions row with text review).
 * Requires `review_likes` table (migration 20260713_review_likes.sql).
 */
export function useReviewLike(interactionId: number) {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!interactionId) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from("review_likes")
        .select("user_id")
        .eq("interaction_id", interactionId)

      if (error) throw error
      const rows = data ?? []
      setCount(rows.length)
      setLiked(Boolean(user?.id && rows.some((r) => r.user_id === user.id)))
    } catch (e) {
      console.error("[review-like]", e)
    } finally {
      setLoading(false)
    }
  }, [interactionId, supabase, user?.id])

  useEffect(() => {
    void load()
  }, [load])

  const toggle = async () => {
    if (!user) {
      toast.error("Sign in to like reviews")
      return
    }
    if (busy || !interactionId) return

    setBusy(true)
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)))

    try {
      if (nextLiked) {
        const { error } = await supabase.from("review_likes").insert({
          interaction_id: interactionId,
          user_id: user.id,
        })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("review_likes")
          .delete()
          .eq("interaction_id", interactionId)
          .eq("user_id", user.id)
        if (error) throw error
      }
    } catch (e) {
      console.error(e)
      setLiked(!nextLiked)
      setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
      toast.error("Could not update like")
    } finally {
      setBusy(false)
    }
  }

  return { liked, count, loading, busy, toggle }
}

export function ReviewLikeButton({
  interactionId,
  className,
}: {
  interactionId: number
  className?: string
}) {
  const { liked, count, busy, toggle } = useReviewLike(interactionId)

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition",
        liked
          ? "text-brand"
          : "text-zinc-500 hover:text-zinc-300",
        className,
      )}
      aria-label={liked ? "Unlike review" : "Like review"}
    >
      <Heart className={cn("size-3.5", liked && "fill-current")} />
      {count > 0 ? <span className="tabular-nums">{count}</span> : null}
    </button>
  )
}
