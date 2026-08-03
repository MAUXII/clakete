import type { SupabaseClient } from "@supabase/supabase-js"

export type NotificationType =
  | "follow"
  | "feed_like"
  | "feed_comment"
  | "review_like"

export type CreateNotificationInput = {
  recipientId: string
  actorId: string
  type: NotificationType
  entityType?: string | null
  entityId?: string | number | null
}

/** Fire-and-forget — never throws to callers. */
export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput,
): Promise<void> {
  const { recipientId, actorId, type, entityType, entityId } = input
  if (!recipientId || !actorId || recipientId === actorId) return

  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: recipientId,
      actor_id: actorId,
      type,
      entity_type: entityType ?? null,
      entity_id: entityId != null ? String(entityId) : null,
    })
    if (error && error.code !== "23505") {
      console.error("[notifications]", error.message)
    }
  } catch (e) {
    console.error("[notifications]", e)
  }
}
