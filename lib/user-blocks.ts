import type { SupabaseClient } from "@supabase/supabase-js"

/** IDs involved in a block with `userId` (either direction). */
export async function fetchBlockedUserIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const ids = new Set<string>()
  try {
    const { data, error } = await supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

    if (error) {
      console.error("[user-blocks]", error.message)
      return ids
    }

    for (const row of data ?? []) {
      const blocker = row.blocker_id as string
      const blocked = row.blocked_id as string
      if (blocker === userId) ids.add(blocked)
      else if (blocked === userId) ids.add(blocker)
    }
  } catch (e) {
    console.error("[user-blocks]", e)
  }
  return ids
}

export function isBlockedRelation(
  blockedIds: Set<string>,
  otherUserId: string | null | undefined,
): boolean {
  return Boolean(otherUserId && blockedIds.has(otherUserId))
}
