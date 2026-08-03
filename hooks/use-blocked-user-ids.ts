"use client"

import { useCallback, useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { fetchBlockedUserIds } from "@/lib/user-blocks"

export function useBlockedUserIds() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [blockedIds, setBlockedIds] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(Boolean(user?.id))

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setBlockedIds(new Set())
      setLoading(false)
      return
    }
    setLoading(true)
    const ids = await fetchBlockedUserIds(supabase, user.id)
    setBlockedIds(ids)
    setLoading(false)
  }, [supabase, user?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { blockedIds, loading, refresh }
}
