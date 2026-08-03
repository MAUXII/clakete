"use client"

import { useCallback, useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import type { NotificationType } from "@/lib/notifications"

export type AppNotification = {
  id: number
  type: NotificationType
  entityType: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
  actor: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function useNotifications(limit = 30) {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(Boolean(user?.id))

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from("notifications")
        .select("id, type, entity_type, entity_id, read_at, created_at, actor_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      const actorIds = [
        ...new Set((rows ?? []).map((r) => r.actor_id as string).filter(Boolean)),
      ]

      const actorsById = new Map<
        string,
        {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
        }
      >()

      if (actorIds.length) {
        const { data: actors, error: actorsError } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .in("id", actorIds)
        if (actorsError) throw actorsError
        for (const a of actors ?? []) {
          actorsById.set(a.id as string, {
            id: a.id as string,
            username: a.username as string,
            display_name: (a.display_name as string | null) ?? null,
            avatar_url: (a.avatar_url as string | null) ?? null,
          })
        }
      }

      const mapped: AppNotification[] = []
      for (const row of rows ?? []) {
        const actor = actorsById.get(row.actor_id as string)
        if (!actor?.username) continue
        mapped.push({
          id: row.id as number,
          type: row.type as NotificationType,
          entityType: (row.entity_type as string | null) ?? null,
          entityId: (row.entity_id as string | null) ?? null,
          readAt: (row.read_at as string | null) ?? null,
          createdAt: row.created_at as string,
          actor,
        })
      }

      setItems(mapped)
      setUnreadCount(mapped.filter((n) => !n.readAt).length)
    } catch (e) {
      console.error("[use-notifications]", e)
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [limit, supabase, user?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const markAllRead = useCallback(async () => {
    if (!user?.id) return
    if (!items.some((n) => !n.readAt)) return

    setItems((prev) =>
      prev.map((n) =>
        n.readAt ? n : { ...n, readAt: new Date().toISOString() },
      ),
    )
    setUnreadCount(0)

    try {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null)
    } catch (e) {
      console.error("[use-notifications] markAllRead", e)
      void refresh()
    }
  }, [items, refresh, supabase, user?.id])

  return { items, unreadCount, loading, refresh, markAllRead }
}
