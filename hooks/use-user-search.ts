"use client"

import { useEffect, useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useDebounce } from "@/hooks/use-debounce"

export type UserSearchResult = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export function useUserSearch(query: string, enabled = true) {
  const supabase = useSupabaseClient()
  const debounced = useDebounce(query, 300)
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const q = debounced.trim().replace(/^@+/, "")
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        // Escape commas/% that break PostgREST .or() filters
        const safe = q.replace(/[%_,]/g, "")
        if (safe.length < 2) {
          if (!cancelled) setResults([])
          return
        }
        const pattern = `%${safe}%`
        const { data, error } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
          .order("username", { ascending: true })
          .limit(12)

        if (error) throw error
        if (!cancelled) {
          setResults(
            ((data ?? []) as UserSearchResult[]).filter((u) => Boolean(u.username)),
          )
        }
      } catch (e) {
        console.error("[user-search]", e)
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debounced, enabled, supabase])

  return { results, loading }
}
